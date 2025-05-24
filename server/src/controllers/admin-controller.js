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
          o.display_name,
          v.name,
          v.address,
          v.city,
          v.capacity,
          v.is_seated
        FROM events e
        JOIN organizers o ON e.organizer_account_id = o.account_id
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

  export const getAllEventsFilter = async (req, res, next) => {
    const client = await getClient();
  
    try {
      const { search, category, status, start, end } = req.query;
  
      // Base query with joins
      let queryText = `
        SELECT 
          e.*,
          o.display_name,
          v.name,
          v.address,
          v.city,
          v.capacity,
          v.is_seated
        FROM events e
        JOIN organizers o ON e.organizer_account_id = o.account_id
        JOIN venues v ON e.venue_id = v.venue_id
      `;
  
      // Array to hold WHERE conditions
      const conditions = [];
      // Array to hold parameter values for parameterized query
      const values = [];
  
      // Add filters if they exist
      if (search) {
        values.push(`%${search}%`);
        conditions.push(`(e.title ILIKE $${values.length} OR o.display_name ILIKE $${values.length})`);
      }
      if (category && category !== 'all') {
        values.push(category);
        conditions.push(`e.category = $${values.length}`);
      }
      if (status && status !== 'all') {
        values.push(status);
        conditions.push(`e.status = $${values.length}`);
      }
      if (start) {
        values.push(start);
        conditions.push(`e.start_at >= $${values.length}`);
      }
      if (end) {
        values.push(end);
        conditions.push(`e.end_at <= $${values.length}`);
      }
  
      // Append WHERE clause if any conditions exist
      if (conditions.length > 0) {
        queryText += ` WHERE ` + conditions.join(' AND ');
      }
  
      // Optionally add ORDER BY, LIMIT, OFFSET here if needed
  
      const result = await client.query(queryText, values);
      res.status(200).json(result.rows);
  
    } catch (error) {
      console.error("Error fetching filtered events:", error);
      next(error);
    } finally {
      client.release();
    }
  };
  
  export const getAllAcounts = async (req, res, next) => {
    const client = await getClient();
  
    try {
      // Query all users with roles and full names from joined tables
      const result = await client.query(`
        SELECT 
        a.account_id,
        a.email,
        a.role,
        a.created_at,
        CASE 
            WHEN a.role = 'organizer' THEN o.display_name
            WHEN a.role = 'attendee' THEN at.full_name
            ELSE 'Admin'
        END AS full_name
        FROM accounts a
        LEFT JOIN organizers o ON a.account_id = o.account_id
        LEFT JOIN attendees at ON a.account_id = at.account_id;
      `);
  
      const users = result.rows;
  
      // Count users by role
      const attendeeCount = users.filter(u => u.role === 'attendee').length;
      const organizerCount = users.filter(u => u.role === 'organizer').length;
      const adminCount = users.filter(u => u.role === 'admin').length;
  
      // Trace counts in console
      console.log('Attendee Count:', attendeeCount);
      console.log('Organizer Count:', organizerCount);
      console.log('Admin Count:', adminCount);
  
      // Optionally send counts in response or whole user list
      res.status(200).json({
        counts: { attendeeCount, organizerCount, adminCount },
        users,
      });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      next(error);
    } finally {
      client.release();
    }
  };
  
  

  export const getEventsByCities = async (req, res, next) => {
    const { cities } = req.body; 
  
    if (!Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({ message: "You must provide an array of cities." });
    }
  
    const client = await getClient();
  
    try {
      const result = await client.query(
        `SELECT e.*, v.name, v.city, v.address, v.capacity
         FROM events e
         JOIN venues v ON e.venue_id = v.venue_id
         WHERE v.city = ANY($1);`,
        [cities]
      );
  
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("Error fetching events by cities:", error);
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

  