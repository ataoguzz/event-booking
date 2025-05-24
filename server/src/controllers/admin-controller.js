import bcryptjs from "bcryptjs";
import { query, getClient } from "../utils/db.js";

export const getVenuesRequests = async (req, res, next) => {
    const client = await getClient();
    try {
      const queryText = `
        SELECT vr.request_id, vr.name, vr.city, vr.capacity, vr.notes, vr.status,
               o.account_id, o.display_name, o.bio, o.avg_rating
        FROM venues_requests vr
        JOIN organizers o ON vr.organizer_account_id = o.account_id
      `;
      const result = await client.query(queryText);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching venues requests:", error);
      next(error);
    } finally {
      client.release();
    }
  };

export const evaluateVenueRequest = async (req, res, next) => {
    const { request_id, action } = req.body;

    if (!request_id || !['approved', 'declined'].includes(action)) {
      return res.status(400).json({
        message: "Request must include a valid 'request_id' and an action of 'approved' or 'declined'."
      });
    }
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const updateResult = await client.query(
            'UPDATE venues_requests SET status = $1 WHERE request_id = $2 RETURNING *;',
            [action, request_id]
        );
        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Venue request not found.' });
        }
        const request = updateResult.rows[0];
        if (action === 'approved') {
            const insertVenueQuery = `
              INSERT INTO venues (
                name,
                address,
                city,
                capacity,
                map_image_url,
                created_at,
                updated_at
              )
              VALUES ($1, NULL, $2, $3, NULL, NOW(), NOW())
              RETURNING *;
            `;
      
            const venueResult = await client.query(insertVenueQuery, [
              request.name,
              request.city,
              request.capacity
            ]);
      
            await client.query('COMMIT');
      
            return res.status(200).json({
              message: 'Venue request approved and venue added.',
              venue: venueResult.rows[0]
            });
        }
        await client.query('COMMIT');
        res.status(200).json({
        message: 'Venue request declined.',
        request
        });
        
    }catch (error) {
        await client.query('ROLLBACK');
        console.error('Admin Controller Error:', error);
        next(error);
    } finally {
        client.release();
    }
}

export const getAllEvents = async (req, res, next) => {
    const client = await getClient();
    try {
      const queryText = `
        SELECT 
          e.*,
          v.name,
          v.city,
          v.address,
          v.capacity 
        FROM events e
        JOIN venues v ON e.venue_id = v.venue_id
      `;
      const result = await client.query(queryText);
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching all events with venues:", error);
      next(error);
    } finally {
      client.release();
    }
  };
  
export const getAllOrganizers = async (req, res, next) => {
    const client = await getClient();
    try {
        const queryText = `SELECT * FROM organizers`;
        const result = await client.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching all organizers:", error);
        next(error);
    } finally {
        client.release();
    }
}

  