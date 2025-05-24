import { getClient } from "../utils/db.js";

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

export const deleteEvent = async (req, res, next) => {
    // req.user should be populated by checkAuth
    if (!req.user || !req.user.accountId) {
        return res.status(401).json({ message: "Authentication required." });
    }

    const { eventId } = req.params;

    if (!eventId || isNaN(parseInt(eventId))) {
        return res.status(400).json({ message: "Valid Event ID is required." });
    }
    const parsedEventId = parseInt(eventId, 10);

    const client = await getClient();
    try {
        await client.query('BEGIN');

        const eventCheckQuery = 'SELECT organizer_account_id FROM events WHERE event_id = $1';
        const eventCheckResult = await client.query(eventCheckQuery, [parsedEventId]);

        if (eventCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found." });
        }

        const deleteEventQuery = 'DELETE FROM events WHERE event_id = $1 RETURNING event_id, title';
        const deletedEventResult = await client.query(deleteEventQuery, [parsedEventId]);

        if (deletedEventResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found during deletion attempt." });
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Event "${deletedEventResult.rows[0].title}" (ID: ${deletedEventResult.rows[0].event_id}) deleted successfully.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};