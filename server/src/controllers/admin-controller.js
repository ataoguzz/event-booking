import bcryptjs from "bcryptjs";
import { query, getClient } from "../utils/db.js";

export const getVenuesRequests = async (req, res, next) => {
    const client = await getClient();
    try {
      const { status, city, search } = req.query;
      let queryText = `
        SELECT vr.request_id, vr.name, vr.city, vr.capacity, vr.notes, vr.status,
               o.account_id, o.display_name, o.bio, o.avg_rating
        FROM venues_requests vr
        JOIN organizers o ON vr.organizer_account_id = o.account_id
        WHERE 1=1
      `;
      const values = [];

      if (status && status !== 'all') {
        values.push(status);
        queryText += ` AND vr.status = $${values.length}`;
      }
      if (city && city !== 'all') {
        values.push(city);
        queryText += ` AND vr.city = $${values.length}`;
      }
      if (search) {
        values.push(`%${search.toLowerCase()}%`);
        queryText += ` AND (LOWER(vr.name) LIKE $${values.length} OR LOWER(vr.city) LIKE $${values.length} OR LOWER(vr.request_id::text) LIKE $${values.length})`;
      }

      const result = await client.query(queryText, values);
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
                created_at,
                updated_at
              )
              VALUES ($1, NULL, $2, $3, NOW(), NOW())
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

export const getDashboardData = async (req, res, next) => {
    const client = await getClient();
    try {
        const { timeRange } = req.query
        let startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 5);

        const now = new Date();
        switch (timeRange) {
        case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'year':
            startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st of this year
            break;
        case 'all':
        default:
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 5); // 5 years ago from today
            break;
        }
        let query = `
            SELECT e.category as name, COUNT(*) AS value
            FROM events e
        `;
        let values = [];

        if (startDate) {
            query += ` WHERE e.created_at >= $1`;
            values.push(startDate);
        }

        query += `
            GROUP BY e.category
            ORDER BY value DESC
        `;
        const eventResult = await client.query(query, values);

        const nowDate = new Date();
        const userGrowthData = [];

        for (let i = 5; i >= 0; i--) {
        const firstDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
        const firstDayOfNextMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 1);

        const query = `
            SELECT COUNT(*) AS count
            FROM accounts
            WHERE created_at < $1
        `;
        const result = await client.query(query, [firstDayOfNextMonth]);

        const monthLabel = firstDayOfMonth.toLocaleString('en-US', { month: 'short' }); // e.g. Jan, Feb

        userGrowthData.push({
            month: monthLabel,
            users: parseInt(result.rows[0].count, 10),
        });
        }

        const revenueData = [];

        for (let i = 5; i >= 0; i--) {
        const firstDayOfMonth = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
        const firstDayOfNextMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 1);

        const revenueQuery = `
            SELECT COALESCE(-SUM(tn.amount), 0) AS revenue
            FROM transactions tn
            JOIN tickets tk ON tn.tx_id = tk.tx_id
            WHERE tk.status IN ('PURCHASED')
            AND tn.created_at >= $1
            AND tn.created_at < $2
        `;
        const revenueResult = await client.query(revenueQuery, [firstDayOfMonth, firstDayOfNextMonth]);

        const monthLabel = firstDayOfMonth.toLocaleString('en-US', { month: 'short' });

        revenueData.push({
            month: monthLabel,
            revenue: parseFloat(revenueResult.rows[0].revenue),
        });
        }   

        let prevStartDate = null;

        if (startDate) {
        const diff = now.getTime() - startDate.getTime();
        prevStartDate = new Date(startDate.getTime() - diff);
        }
        const summaryQueries = {
            totalRevenue: `
              SELECT COALESCE(-SUM(tn.amount), 0) AS total
              FROM transactions tn
              WHERE tn.tx_type IN ('TICKET_PURCHASE')
              AND tn.created_at >= $1
              AND tn.created_at < $2
            `,
            previousRevenue: `
              SELECT COALESCE(-SUM(tn.amount), 0) AS total
              FROM transactions tn
              WHERE tn.tx_type IN ('TICKET_PURCHASE')
              ${prevStartDate ? "AND tn.created_at >= $1 AND tn.created_at < $2" : ""}
            `,
            totalEvents: `
              SELECT COUNT(*) AS total FROM events
              ${startDate ? "WHERE created_at >= $1 AND created_at < $2" : ""}
            `,
            previousEvents: `
              SELECT COUNT(*) AS total FROM events
              ${prevStartDate ? "WHERE created_at >= $1 AND created_at < $2" : ""}
            `,
            totalUsers: `
              SELECT COUNT(*) AS total FROM accounts
              ${startDate ? "WHERE created_at >= $1 AND created_at < $2" : ""}
            `,
            previousUsers: `
              SELECT COUNT(*) AS total FROM accounts
              ${prevStartDate ? "WHERE created_at >= $1 AND created_at < $2" : ""}
            `,
            activeVenues: `
              SELECT COUNT(DISTINCT venue_id) AS total FROM venues
              ${startDate ? "WHERE created_at >= $1 AND created_at < $2" : ""}
            `,
            previousVenues: `
              SELECT COUNT(DISTINCT venue_id) AS total FROM venues
              ${prevStartDate ? "WHERE created_at >= $1 AND created_at < $2" : ""}
            `,
            ticketsSold: `
              SELECT COALESCE( COUNT(*), 0) AS total
              FROM transactions tn
              WHERE tn.tx_type IN ('TICKET_PURCHASE')
              AND tn.created_at >= $1
              AND tn.created_at < $2
            `,
            previousTicketsSold: `
              SELECT COALESCE( COUNT(*), 0) AS total
              FROM transactions tn
              JOIN tickets tk ON tn.tx_id = tk.tx_id
              WHERE tk.status IN ('PURCHASED')
              ${prevStartDate ? "AND tn.created_at >= $1 AND tn.created_at < $2" : ""}
            `,
          };
          
          
          const totalRevenueResult = await client.query(summaryQueries.totalRevenue, [startDate, now]);
            const previousRevenueResult = await client.query(summaryQueries.previousRevenue, [prevStartDate, startDate]);
            const totalEventsResult = await client.query(summaryQueries.totalEvents, startDate ? [startDate, now] : []);
            const previousEventsResult = await client.query(summaryQueries.previousEvents, prevStartDate ? [prevStartDate, startDate] : []);
            const totalUsersResult = await client.query(summaryQueries.totalUsers, startDate ? [startDate, now] : []);
            const previousUsersResult = await client.query(summaryQueries.previousUsers, prevStartDate ? [prevStartDate, startDate] : []);
            const activeVenuesResult = await client.query(summaryQueries.activeVenues, startDate ? [startDate, now] : []);
            const previousVenuesResult = await client.query(summaryQueries.previousVenues, prevStartDate ? [prevStartDate, startDate] : []);
            const ticketsSoldResult = await client.query(summaryQueries.ticketsSold, startDate ? [startDate, now] : []);
            const previousTicketsSoldResult = await client.query(summaryQueries.previousTicketsSold, prevStartDate ? [prevStartDate, startDate] : []);

            const summaryData = {
                ticketsSold: ticketsSoldResult.rows[0] ? ticketsSoldResult.rows[0].total : 0,
                previousTicketsSold: previousTicketsSoldResult.rows[0] ? previousTicketsSoldResult.rows[0].total : 0,
                totalRevenue: totalRevenueResult.rows[0] ? totalRevenueResult.rows[0].total : 0,
                previousRevenue: previousRevenueResult.rows[0] ? previousRevenueResult.rows[0].total : 0,
                totalEvents: totalEventsResult.rows[0] ? totalEventsResult.rows[0].total : 0,
                previousEvents: previousEventsResult.rows[0] ? previousEventsResult.rows[0].total : 0,
                totalUsers: totalUsersResult.rows[0] ? totalUsersResult.rows[0].total : 0,
                previousUsers: previousUsersResult.rows[0] ? previousUsersResult.rows[0].total : 0,
                activeVenues: activeVenuesResult.rows[0] ? activeVenuesResult.rows[0].total : 0,
                previousVenues: previousVenuesResult.rows[0] ? previousVenuesResult.rows[0].total : 0, 
            };
          res.json({
            categoryCounts: eventResult.rows,
            userGrowthData,
            revenueData,
            summaryData,
        });

    } catch (error) {
        console.error("Error fetching all organizers:", error);
        next(error);
    } finally {
        client.release();
    }

}
  