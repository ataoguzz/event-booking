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
        venue, price, rules, organizerAccountId
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

    if (!title || !description || !eventType || !startDate || !startTime || !endDate || !endTime || !venue || !price) {
        return res.status(400).json({ message: "Missing required fields." });
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
    const basePrice = parseFloat(price);

    if (isNaN(venueId) || venueId <= 0) return res.status(400).json({ message: "Invalid Venue ID." });
    if (isNaN(basePrice) || basePrice <= 0) return res.status(400).json({ message: "Invalid Price." });

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Optional: Verify if the organizerAccountId from req.body actually exists in your organizers table
        // This is a good sanity check if you are taking the ID from the body.
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
            parsedOrganizerAccountId, // Using the ID directly from req.body
            venueId, category, title, description, rules || null,
            startAtIso, endAtIso, 'PUBLISHED', basePrice, heroImageUrl
        ];

        const eventResult = await client.query(eventInsertQuery, eventInsertValues);
        const newEvent = eventResult.rows[0];

        const imageInsertPromises = req.files.map(file => {
            const imageUrl = `/uploads/${file.filename}`;
            return client.query(
                'INSERT INTO event_images (event_id, url, caption) VALUES ($1, $2, $3)',
                [newEvent.event_id, imageUrl, file.originalname]
            );
        });
        await Promise.all(imageInsertPromises);

        await client.query('COMMIT');
        res.status(201).json({ message: "Event created successfully!", event: newEvent });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during event creation transaction:', error);
        if (error.code === '23503') {
            next({ status: 400, message: `Invalid reference (e.g., organizer or venue ID not found). Details: ${error.detail}` });
        } else if (error.code === '23505' && error.constraint === 'events_title_start_key') {
            next({ status: 409, message: "An event with this title and start time already exists."});
        } else {
            next(error);
        }
    } finally {
        client.release();
    }
};