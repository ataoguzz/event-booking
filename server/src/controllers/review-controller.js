import { query } from '../utils/db.js';

export const getEventReviews = async (req, res) => {
  try {
    const { eventId } = req.params;

    const reviewsQuery = `
      SELECT 
        r.review_id,
        r.account_id,
        r.stars,
        r.body,
        r.created_at,
        CASE 
          WHEN a.role = 'attendee' THEN att.full_name
          WHEN a.role = 'organizer' THEN org.display_name
          ELSE 'Anonymous'
        END AS user_name
      FROM reviews r
      JOIN accounts a ON a.account_id = r.account_id
      LEFT JOIN attendees att ON att.account_id = r.account_id
      LEFT JOIN organizers org ON org.account_id = r.account_id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC
    `;

    const { rows: reviews } = await query(reviewsQuery, [eventId]);
    res.json(reviews);
  } catch (err) {
    console.error('Error fetching event reviews:', err);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

export const canReviewEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const accountId = req.user.account_id;

    // Check if the event has ended
    const eventQuery = `
      SELECT end_at
      FROM events
      WHERE event_id = $1 AND status = 'COMPLETED'
    `;
    const { rows: eventRows } = await query(eventQuery, [eventId]);
    
    if (eventRows.length === 0) {
      return res.json({ canReview: false, reason: 'Event has not ended yet' });
    }

    // Check if the user attended the event
    const ticketQuery = `
      SELECT ticket_id
      FROM tickets
      WHERE event_id = $1 AND attendee_account_id = $2 AND status = 'PURCHASED'
    `;
    const { rows: ticketRows } = await query(ticketQuery, [eventId, accountId]);

    if (ticketRows.length === 0) {
      return res.json({ canReview: false, reason: 'User did not attend this event' });
    }

    // Check if the user has already reviewed
    const reviewQuery = `
      SELECT review_id
      FROM reviews
      WHERE event_id = $1 AND account_id = $2
    `;
    const { rows: reviewRows } = await query(reviewQuery, [eventId, accountId]);

    if (reviewRows.length > 0) {
      return res.json({ canReview: false, reason: 'User has already reviewed this event' });
    }

    res.json({ canReview: true });
  } catch (err) {
    console.error('Error checking review eligibility:', err);
    res.status(500).json({ error: 'Failed to check review eligibility' });
  }
};

export const createReview = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { stars, body } = req.body;
    const accountId = req.user.account_id;

    // Validate input
    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Invalid rating. Must be between 1 and 5.' });
    }

    // Start a transaction
    const client = await query('BEGIN');

    try {
      // Insert the review
      const insertReviewQuery = `
        INSERT INTO reviews (event_id, account_id, stars, body)
        VALUES ($1, $2, $3, $4)
        RETURNING review_id, stars, body, created_at
      `;
      const { rows: [review] } = await client.query(insertReviewQuery, [eventId, accountId, stars, body]);

      // Update event's average rating
      const updateEventRatingQuery = `
        WITH event_avg AS (
          SELECT AVG(stars)::NUMERIC(2,1) as avg_rating
          FROM reviews
          WHERE event_id = $1
        )
        UPDATE events
        SET avg_rating = event_avg.avg_rating
        FROM event_avg
        WHERE event_id = $1
        RETURNING avg_rating
      `;
      const { rows: [updatedEvent] } = await client.query(updateEventRatingQuery, [eventId]);

      // Get user's name for the response
      const userNameQuery = `
        SELECT 
          CASE 
            WHEN a.role = 'attendee' THEN att.full_name
            WHEN a.role = 'organizer' THEN org.display_name
            ELSE 'Anonymous'
          END AS user_name
        FROM accounts a
        LEFT JOIN attendees att ON att.account_id = a.account_id
        LEFT JOIN organizers org ON org.account_id = a.account_id
        WHERE a.account_id = $1
      `;
      const { rows: [user] } = await client.query(userNameQuery, [accountId]);

      await client.query('COMMIT');

      res.json({
        ...review,
        user_name: user.user_name,
        account_id: accountId
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    console.error('Error creating review:', err);
    res.status(500).json({ error: 'Failed to create review' });
  }
}; 