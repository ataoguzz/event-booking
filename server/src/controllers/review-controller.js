import { query } from '../utils/db.js';

export const createReview = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rating, comment, ticketId } = req.body;
        const { accountId } = req.user;

        // Validate the ticket belongs to the user and is for the correct event
        const ticketCheck = await query(
            `SELECT t.ticket_id, t.event_id, e.start_at 
             FROM tickets t
             JOIN events e ON e.event_id = t.event_id
             WHERE t.ticket_id = $1 
             AND t.attendee_account_id = $2 
             AND t.event_id = $3`,
            [ticketId, accountId, eventId]
        );

        if (ticketCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found or not authorized' });
        }

        // Check if event has already happened
        const eventDate = new Date(ticketCheck.rows[0].start_at);
        if (eventDate > new Date()) {
            return res.status(400).json({ error: 'Cannot review an event that has not happened yet' });
        }

        // Check if review already exists for this ticket
        const existingReview = await query(
            'SELECT review_id FROM reviews WHERE ticket_id = $1',
            [ticketId]
        );

        if (existingReview.rows.length > 0) {
            return res.status(400).json({ error: 'Review already exists for this ticket' });
        }

        // Create the review
        const result = await query(
            `INSERT INTO reviews (event_id, ticket_id, attendee_account_id, rating, comment)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING review_id`,
            [eventId, ticketId, accountId, rating, comment]
        );

        res.status(201).json({
            message: 'Review submitted successfully',
            reviewId: result.rows[0].review_id
        });

    } catch (err) {
        console.error('Error creating review:', err);
        res.status(500).json({ error: 'Failed to submit review' });
    }
};

export const getEventReviews = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const reviews = await query(
            `SELECT r.review_id, r.stars as rating, r.body as comment, r.created_at,
                    COALESCE(att.full_name, a.email) as reviewer_name
             FROM reviews r
             JOIN accounts a ON a.account_id = r.account_id
             LEFT JOIN attendees att ON att.account_id = r.account_id
             WHERE r.event_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [eventId, limit, offset]
        );

        // Get total count
        const countResult = await query(
            'SELECT COUNT(*) FROM reviews WHERE event_id = $1',
            [eventId]
        );

        const totalReviews = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalReviews / limit);

        res.json({
            reviews: reviews.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalReviews,
                hasMore: page < totalPages
            }
        });

    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

export const getUserReview = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { accountId } = req.user;

        const review = await query(
            `SELECT r.review_id, r.rating, r.comment, r.created_at,
                    r.ticket_id, e.title as event_name
             FROM reviews r
             JOIN events e ON e.event_id = r.event_id
             WHERE r.event_id = $1 AND r.attendee_account_id = $2`,
            [eventId, accountId]
        );

        if (review.rows.length === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }

        res.json(review.rows[0]);

    } catch (err) {
        console.error('Error fetching user review:', err);
        res.status(500).json({ error: 'Failed to fetch review' });
    }
}; 