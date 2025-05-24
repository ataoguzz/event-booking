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

    if (!req.user || !req.user.accountId) {
        console.error("Error in createEvent: req.user.accountId is missing. Ensure authentication middleware is correctly populating it.");
        return res.status(401).json({ message: "Authentication error: User identity not found." });
    }
    const organizerAccountId = req.user.accountId;

    const {
        title, description, eventType,
        startDate, startTime, endDate, endTime,
        venue, price, rules,
    } = req.body;

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
        await client.query('BEGIN'); // Start transaction

        const heroImageUrl = `/uploads/${req.files[0].filename}`;
        const eventInsertQuery = `
            INSERT INTO events (
                organizer_account_id, venue_id, category, title, description, rules,
                start_at, end_at, status, base_price, hero_image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING event_id, title, created_at, status;
        `;
        const eventInsertValues = [
            organizerAccountId,
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

        await client.query('COMMIT'); // Commit transaction
        res.status(201).json({ message: "Event created successfully!", event: newEvent });

    } catch (error) {
        await client.query('ROLLBACK'); // Rollback transaction on error
        console.error('Error during event creation transaction:', error);
        if (error.code === '23503') {
            next({ status: 400, message: `Invalid reference (e.g., venue ID not found). Details: ${error.detail}` });
        } else if (error.code === '23505' && error.constraint === 'events_title_start_key') {
            next({ status: 409, message: "An event with this title and start time already exists."});
        } else {
            next(error); // Pass to global error handler
        }
    } finally {
        client.release(); // Release client back to the pool
    }
};