import { getClient } from "../utils/db.js";
import path from "path";
import fs from "fs";

const mapEventTypeToCategory = (eventType) => {
    const mapping = {
        "Concert": 'CONCERT',
        "Theater": 'THEATER',
        "Stand-up Comedy": 'STANDUP',
        "Conference": 'CONFERENCE',
        "Workshop": 'WORKSHOP',
        "Festival": 'FESTIVAL',
        "Sports Event": 'SPORTS',
        "Exhibition": 'OTHER',
        "Dance Performance": 'OTHER',
    };
    return mapping[eventType] || 'OTHER';
};

export const createEvent = async (req, res, next) => {

    const {
        title, description, eventType,
        startDate, startTime, endDate, endTime,
        venue, rules, organizerAccountId,
        ticketTiersData: ticketTiersDataString
    } = req.body;

    if (!organizerAccountId) {
        console.error("Error in createEvent: organizerAccountId is missing from the request body.");
        return res.status(400).json({ message: "Organizer ID is required in the request body." });
    }
    const parsedOrganizerAccountId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedOrganizerAccountId) || parsedOrganizerAccountId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer ID format in request body." });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "At least one event image is required." });
    }

    if (!title || !description || !eventType || !startDate || !startTime || !endDate || !endTime || !venue) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    let ticketTiers;
    try {
        ticketTiers = JSON.parse(ticketTiersDataString);
        if (!Array.isArray(ticketTiers) || ticketTiers.length === 0) {
            throw new Error("Ticket tiers data is invalid or empty.");
        }
        for (const tier of ticketTiers) {
            if (!tier.tierName || typeof tier.tierName !== 'string' || tier.tierName.trim() === "")
                throw new Error("Invalid tier name.");
            if (isNaN(parseFloat(tier.price)) || parseFloat(tier.price) < 0)
                throw new Error(`Invalid price for tier ${tier.tierName}.`);
            if (isNaN(parseInt(tier.quantity)) || parseInt(tier.quantity) <= 0)
                throw new Error(`Invalid quantity for tier ${tier.tierName}. Must be a positive integer.`);
        }
    } catch (e) {
        return res.status(400).json({ message: `Invalid ticket tiers data: ${e.message}` });
    }

    let startAtIso, endAtIso;
    try {
        startAtIso = new Date(`${startDate}T${startTime}`).toISOString();
        endAtIso = new Date(`${endDate}T${endTime}`).toISOString();
        if (new Date(endAtIso) <= new Date(startAtIso)) {
            return res.status(400).json({ message: "End date/time must be after start date/time." });
        }
    } catch (e) {
        return res.status(400).json({ message: "Invalid date or time format." });
    }

    const category = mapEventTypeToCategory(eventType);
    const venueId = parseInt(venue, 10);

    if (isNaN(venueId) || venueId <= 0) return res.status(400).json({ message: "Invalid Venue ID." });

    const basePriceForEvent = ticketTiers.length > 0 ? parseFloat(ticketTiers[0].price) : 0;

    const client = await getClient();
    try {
        await client.query('BEGIN');

        const organizerCheckResult = await client.query('SELECT account_id FROM organizers WHERE account_id = $1', [parsedOrganizerAccountId]);
        if (organizerCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Organizer with ID ${parsedOrganizerAccountId} not found.` });
        }

        const heroImageUrl = `/uploads/${req.files[0].filename}`;
        const eventInsertQuery = `
            INSERT INTO events (
                organizer_account_id, venue_id, category, title, description, rules,
                start_at, end_at, status, base_price, hero_image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING event_id, title, created_at, status;
        `;
        const eventInsertValues = [
            parsedOrganizerAccountId,
            venueId, category, title, description, rules || null,
            startAtIso, endAtIso, 'PUBLISHED', basePriceForEvent, heroImageUrl
        ];

        const eventResult = await client.query(eventInsertQuery, eventInsertValues);
        const newEventId = eventResult.rows[0].event_id;

        const imageInsertPromises = req.files.map(file => {
            const imageUrl = `/uploads/${file.filename}`;
            return client.query('INSERT INTO event_images (event_id, url, caption) VALUES ($1, $2, $3)',
                [newEventId, imageUrl, file.originalname]);
        });
        await Promise.all(imageInsertPromises);

        for (const tier of ticketTiers) {
            const tierInsertQuery = `
                INSERT INTO event_ticket_tiers (event_id, tier_name, price, quantity)
                VALUES ($1, $2, $3, $4)
                RETURNING tier_id;
            `;
            const tierResult = await client.query(tierInsertQuery, [
                newEventId,
                tier.tierName,
                parseFloat(tier.price),
                parseInt(tier.quantity)
            ]);
            const newTierId = tierResult.rows[0].tier_id;

            const ticketInsertPromises = [];
            for (let i = 0; i < parseInt(tier.quantity); i++) {
                ticketInsertPromises.push(
                    client.query(
                        `INSERT INTO tickets (event_id, tier_id, status) VALUES ($1, $2, 'AVAILABLE')`,
                        [newEventId, newTierId]
                    )
                );
            }
            await Promise.all(ticketInsertPromises);
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Event and tickets created successfully!", event: { event_id: newEventId } });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during event creation transaction:', error);
        if (error.code === '23503') {
            next({ status: 400, message: `Invalid reference (e.g., organizer or venue ID not found). Details: ${error.detail}` });
        } else if (error.code === '23505' && error.constraint === 'events_title_start_key') {
            next({ status: 409, message: "An event with this title and start time already exists."});
        } else if (error.constraint === 'event_ticket_tiers_event_id_tier_name_key') {
            next({ status: 409, message: "Duplicate tier name for this event."});
        } else {
            next(error);
        }
    } finally {
        client.release();
    }
};


export const getOrganizerEvents = async (req, res, next) => {
    // This route should be protected by your `checkAuth` middleware.
    const { organizerAccountId } = req.body;

    if (!organizerAccountId) {
        return res.status(400).json({ message: "Organizer Account ID is required in the request body." });
    }

    const parsedOrganizerAccountId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedOrganizerAccountId) || parsedOrganizerAccountId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer Account ID format in request body." });
    }

    const client = await getClient();
    try {
        const eventsQuery = `
            SELECT
                e.event_id, e.title, e.description, e.category, e.status,
                e.start_at, e.end_at, e.base_price, e.tickets_sold, e.hero_image_url,
                v.name AS venue_name, v.city AS venue_city, v.capacity AS venue_capacity
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            WHERE e.organizer_account_id = $1
            ORDER BY e.start_at DESC;
        `;
        const { rows } = await client.query(eventsQuery, [parsedOrganizerAccountId]);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`Error fetching events for organizer ${parsedOrganizerAccountId} via POST:`, error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const updateEvent = async (req, res, next) => {
    console.log("UPDATE EVENT req.body:", JSON.stringify(req.body, null, 2)); // Log the received body
    console.log("UPDATE EVENT req.files:", req.files); // Log uploaded files
    const { eventId } = req.params;
    const parsedEventId = parseInt(eventId, 10);

    if (isNaN(parsedEventId)) {
        return res.status(400).json({ message: "Invalid Event ID." });
    }

    const {
        title, description, eventType,
        startDate, startTime, endDate, endTime,
        venue: venueIdStr, rules,
        organizerAccountId,
        ticketTiersData: ticketTiersDataString,
    } = req.body;

    if (!organizerAccountId) {
        return res.status(400).json({ message: "Organizer Account ID is required in the request body to perform an update." });
    }
    const parsedPerformingOrganizerId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedPerformingOrganizerId) || parsedPerformingOrganizerId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer Account ID format in request body." });
    }

    if (!title || !description || !eventType || !startDate || !startTime || !endDate || !endTime || !venueIdStr || !ticketTiersDataString) {
        return res.status(400).json({ message: "Missing required fields for update." });
    }
    let ticketTiers; try { ticketTiers = JSON.parse(ticketTiersDataString); /* + validation */ } catch (e) { /* error */ }
    let startAtIso, endAtIso;
    try {
        startAtIso = new Date(`${startDate}T${startTime}`).toISOString();
        endAtIso = new Date(`${endDate}T${endTime}`).toISOString();
        if (new Date(endAtIso) <= new Date(startAtIso)) {
            return res.status(400).json({ message: "End date/time must be after start date/time." });
        }
    } catch (e) {
        console.error("Date parsing error during update:", e);
        return res.status(400).json({ message: "Invalid date or time format provided for update." });
    }
    const category = mapEventTypeToCategory(eventType);
    const venueId = parseInt(venueIdStr, 10); // Parse venueIdStr to venueId
    if (isNaN(venueId) || venueId <= 0) { // Add validation for parsed venueId
        return res.status(400).json({ message: "Invalid Venue ID format." });
    }
    const basePriceForEvent = ticketTiers.length > 0 && ticketTiers[0].price !== undefined ? parseFloat(ticketTiers[0].price) : 0;

    const client = await getClient();
    try {
        await client.query('BEGIN');

        const eventCheckQuery = 'SELECT organizer_account_id, hero_image_url FROM events WHERE event_id = $1';
        const eventCheckResult = await client.query(eventCheckQuery, [parsedEventId]);

        if (eventCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found." });
        }

        const eventOwnerId = eventCheckResult.rows[0].organizer_account_id;
        let currentHeroImageUrl = eventCheckResult.rows[0].hero_image_url;

        // 3. Handle Image Updates (Simplified: Delete all old images, then add new ones if provided)
        let newHeroImageUrl = currentHeroImageUrl;
        if (req.files && req.files.length > 0) {
            const oldImagesResult = await client.query('SELECT url FROM event_images WHERE event_id = $1', [parsedEventId]);
            for (const oldImage of oldImagesResult.rows) {
                if (oldImage.url) {
                    try {
                        const imagePath = path.join(projectRootDir, 'uploads', path.basename(oldImage.url));
                        await fs.unlink(imagePath);
                    } catch (fileError) { console.warn(`Could not delete old image file ${oldImage.url}: ${fileError.message}`); }
                }
            }
            await client.query('DELETE FROM event_images WHERE event_id = $1', [parsedEventId]);
            newHeroImageUrl = `/uploads/${req.files[0].filename}`;
            const imageInsertPromises = req.files.map(file => {
                const imageUrl = `/uploads/${file.filename}`;
                return client.query('INSERT INTO event_images (event_id, url, caption) VALUES ($1, $2, $3)',
                    [parsedEventId, imageUrl, file.originalname]);
            });
            await Promise.all(imageInsertPromises);
        }

        // 4. Update basic event fields in 'events' table
        const eventUpdateQuery = `
            UPDATE events SET
                title = $1, description = $2, category = $3, venue_id = $4, rules = $5,
                start_at = $6, end_at = $7, status = $8, base_price = $9, hero_image_url = $10, 
                updated_at = NOW()
            WHERE event_id = $11 AND organizer_account_id = $12; -- Ensure we only update if still owner
        `;
        const eventUpdateValues = [
            title, description, category, venueId, rules || null,
            startAtIso, endAtIso, 'PUBLISHED', basePriceForEvent, newHeroImageUrl,
            parsedEventId, eventOwnerId
        ];
        await client.query(eventUpdateQuery, eventUpdateValues);

        await client.query('DELETE FROM tickets WHERE event_id = $1', [parsedEventId]);
        await client.query('DELETE FROM event_ticket_tiers WHERE event_id = $1', [parsedEventId]);

        for (const tier of ticketTiers) {
            const tierResult = await client.query(
                `INSERT INTO event_ticket_tiers (event_id, tier_name, price, quantity, description)
                 VALUES ($1, $2, $3, $4, $5) RETURNING tier_id;`,
                [parsedEventId, tier.tierName, parseFloat(tier.price), parseInt(tier.quantity), tier.description || null]
            );
            const newTierId = tierResult.rows[0].tier_id;
            const ticketGenerationPromises = [];
            for (let i = 0; i < parseInt(tier.quantity); i++) {
                ticketGenerationPromises.push(
                    client.query(`INSERT INTO tickets (event_id, tier_id, status) VALUES ($1, $2, 'AVAILABLE')`,
                        [parsedEventId, newTierId])
                );
            }
            await Promise.all(ticketGenerationPromises);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: "Event updated successfully", event_id: parsedEventId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) client.release();
    }
};

export const deleteEvent = async (req, res, next) => {
    const { eventId } = req.params;
    const parsedEventId = parseInt(eventId, 10);

    // Organizer ID performing the action, expected from the request body for consistency
    // with your specified pattern for createEvent/updateEvent.
    // For a DELETE, often the identity is purely from the token, but we'll follow your pattern.
    const { organizerAccountId } = req.body;

    if (isNaN(parsedEventId)) {
        return res.status(400).json({ message: "Valid Event ID is required in URL." });
    }
    if (!organizerAccountId) {
        return res.status(400).json({ message: "Organizer Account ID is required in the request body to perform a delete." });
    }
    const parsedPerformingOrganizerId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedPerformingOrganizerId) || parsedPerformingOrganizerId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer Account ID format in request body." });
    }


    const client = await getClient();
    try {
        await client.query('BEGIN');

        const eventCheckQuery = 'SELECT organizer_account_id, title FROM events WHERE event_id = $1';
        const eventCheckResult = await client.query(eventCheckQuery, [parsedEventId]);

        if (eventCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found." });
        }
        const eventOwnerId = eventCheckResult.rows[0].organizer_account_id;
        const eventTitle = eventCheckResult.rows[0].title;


        const oldImagesResult = await client.query('SELECT url FROM event_images WHERE event_id = $1', [parsedEventId]);
        for (const oldImage of oldImagesResult.rows) {
            if (oldImage.url) {
                try {
                    const imagePath = path.join(projectRootDir, 'uploads', path.basename(oldImage.url));
                    await fs.unlink(imagePath);
                } catch (fileError) { console.warn(`Could not delete image file ${oldImage.url} for event ${parsedEventId}: ${fileError.message}`); }
            }
        }

        const deleteEventQuery = 'DELETE FROM events WHERE event_id = $1 AND organizer_account_id = $2';
        const deleteResult = await client.query(deleteEventQuery, [parsedEventId, parsedPerformingOrganizerId]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found or not owned by the specified organizer during delete." });
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Event "${eventTitle}" (ID: ${parsedEventId}) deleted successfully.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) client.release();
    }
};

export const getEventDetailsById = async (req, res, next) => {
    const { eventId } = req.params;
    if (!eventId || isNaN(parseInt(eventId))) {
        return res.status(400).json({ message: "Valid Event ID is required." });
    }
    const parsedEventId = parseInt(eventId, 10);

    // This route could be public, or protected by checkAuth if only logged-in users can view
    // For now, let's make it public-facing, so no req.user check here unless desired.

    const client = await getClient();
    try {
        // Fetch main event data and venue info
        const eventQuery = `
            SELECT
                e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city, v.capacity as venue_capacity, v.is_seated as venue_is_seated,
                o.display_name as organizer_display_name, o.avatar_url as organizer_avatar_url
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            JOIN organizers o ON e.organizer_account_id = o.account_id
            WHERE e.event_id = $1;
        `;
        const eventResult = await client.query(eventQuery, [parsedEventId]);

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: "Event not found." });
        }
        const eventDetails = eventResult.rows[0];

        // Fetch event images
        const imagesQuery = 'SELECT image_id, url, caption FROM event_images WHERE event_id = $1 ORDER BY image_id ASC';
        const imagesResult = await client.query(imagesQuery, [parsedEventId]);
        eventDetails.images = imagesResult.rows;

        // Fetch event ticket tiers
        const tiersQuery = 'SELECT tier_id, tier_name, price, quantity, description FROM event_ticket_tiers WHERE event_id = $1 ORDER BY price ASC, tier_name ASC';
        const tiersResult = await client.query(tiersQuery, [parsedEventId]);
        eventDetails.ticket_tiers = tiersResult.rows;

        // You could also fetch how many tickets are sold per tier if needed for display:
        // SELECT tier_id, COUNT(*) as sold_count FROM tickets WHERE event_id = $1 AND status = 'CONFIRMED' GROUP BY tier_id;
        // And then merge this with eventDetails.ticket_tiers.

        res.status(200).json(eventDetails);

    } catch (error) {
        console.error(`Error fetching details for event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) client.release();
    }
};