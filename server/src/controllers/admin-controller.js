import bcryptjs from "bcryptjs";
import { query, getClient } from "../utils/db.js";
import PDFDocument from 'pdfkit';

export const getVenuesRequests = async (req, res, next) => {
    const client = await getClient();
    try {
      const { status, city, search } = req.query;
      let queryText = `
        SELECT vr.request_id, vr.name,vr.address, vr.city, vr.capacity,
               vr.is_seated, vr.requested_layout_rows, vr.requested_layout_cols, vr.notes, vr.status,
               o.account_id, o.display_name, o.bio, o.avg_rating, a.email
        FROM venue_requests vr
        JOIN organizers o ON vr.organizer_account_id = o.account_id
        JOIN accounts a ON vr.organizer_account_id = a.account_id
        WHERE 1=1
      `;
      const values = [];
      let paramIndex = 1;

      if (status) {
        queryText += ` AND vr.status = $${paramIndex++}`;
        values.push(status);
      }
      if (city) {
        queryText += ` AND vr.city ILIKE $${paramIndex++}`;
        values.push(city);
      }
      if (search) {
        queryText += `
          AND (
            LOWER(vr.name) LIKE $${paramIndex} OR
            LOWER(vr.city) LIKE $${paramIndex} OR
            CAST(vr.request_id AS TEXT) LIKE $${paramIndex}
          )
        `;
        values.push(`%${search.toLowerCase()}%`);
        paramIndex++;
      }
      queryText += ` ORDER BY vr.created_at DESC`;

      // Get filtered requests
      const result = await client.query(queryText, values);

      // Get counts for each status (no filters except city/search)
      let countQuery = `
        SELECT status, COUNT(*) as count
        FROM venue_requests
        WHERE 1=1
      `;
      const countValues = [];
      let countParamIndex = 1;
      if (city) {
        countQuery += ` AND city ILIKE $${countParamIndex++}`;
        countValues.push(city);
      }
      if (search) {
        countQuery += `
          AND (
            LOWER(name) LIKE $${countParamIndex} OR
            LOWER(city) LIKE $${countParamIndex} OR
            CAST(request_id AS TEXT) LIKE $${countParamIndex}
          )
        `;
        countValues.push(`%${search.toLowerCase()}%`);
        countParamIndex++;
      }
      countQuery += ` GROUP BY status`;

      const countResult = await client.query(countQuery, countValues);
      const counts = { APPROVED: 0, PENDING: 0, REJECTED: 0 };
      countResult.rows.forEach(row => {
        counts[row.status] = parseInt(row.count, 10);
      });

      const formattedVenues = result.rows.map(row => ({
        id: row.request_id,
        name: row.name,
        address: row.address,
        city: row.city,
        capacity: row.capacity,
        notes: row.notes,
        status: row.status,
        owner: row.display_name,
        contactEmail: row.email,
        seated: row.is_seated,
        rows: row.requested_layout_rows,
        columns: row.requested_layout_cols
      }));

      res.json({
        venues: formattedVenues,
        counts
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Internal Server Error' });
    } finally {
      client.release();
    }
};


export const evaluateVenueRequest = async (req, res, next) => {
    const { request_id, action } = req.body;
    if (!request_id){
        return res.status(400).json({
            message: "' or 'declined'."
          });
    }
    if (!request_id || !['APPROVED', 'REJECTED'].includes(action)) {
      return res.status(400).json({
        message: "Request must include a valid 'request_id' and an action of 'approved' or 'declined'."
      });
    }
    const client = await getClient();
    try {
        await client.query('BEGIN');

        const updateResult = await client.query(
            'UPDATE venue_requests SET status = $1 WHERE request_id = $2 RETURNING *;',
            [action, request_id]
        );
        if (updateResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Venue request not found.' });
        }
        const request = updateResult.rows[0];
        if (action === 'APPROVED') {
            const insertVenueQuery = `
              INSERT INTO venues (
                name,
                address,
                city,
                capacity,
                is_seated,
                created_at,
                updated_at
              )
              VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
              RETURNING *;
            `;
      
            const venueResult = await client.query(insertVenueQuery, [
              request.name,
              request.address,
              request.city,
              request.capacity,
              request.is_seated
            ]);
            const venue = venueResult.rows[0];

            // Insert seats if the venue is seated and rows/columns are provided
            if (
              request.is_seated &&
              request.requested_layout_rows &&
              request.requested_layout_cols
            ) {
              // Ensure these are integers
              const numRows = parseInt(request.requested_layout_rows, 10);
              const numCols = parseInt(request.requested_layout_cols, 10);

              const seatInserts = [];
              for (let row = 1; row <= numRows; row++) {
                const rowLabel = String.fromCharCode(64 + row); // 1 -> 'A', 2 -> 'B', ...
                for (let col = 1; col <= numCols; col++) {
                  seatInserts.push(
                    client.query(
                      "INSERT INTO seats (venue_id, section, row_label, seat_number) VALUES ($1, 'Main', $2, $3)",
                      [venue.venue_id, rowLabel, col]
                    )
                  );
                }
              }
              await Promise.all(seatInserts);
            }
      
            await client.query('COMMIT');
      
            return res.status(200).json({
              message: 'Venue request approved and venue added.',
              venue
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
              WHERE tn.tx_type IN ('TICKET_PURCHASE')
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

export const getDashboardReport = async (req, res, next) => {
  try {
    const client = await getClient();
    // 1. Most revenue event
    const eventRevenueResult = await client.query(`
      WITH revenue_per_event AS (
        SELECT e.title, SUM(tn.amount) AS revenue
        FROM events e
        JOIN (
          SELECT DISTINCT tk.event_id, tk.tx_id
          FROM tickets tk
          WHERE tk.status IN ('PURCHASED')
        ) AS valid_txs ON e.event_id = valid_txs.event_id
        JOIN transactions tn ON valid_txs.tx_id = tn.tx_id
        GROUP BY e.title
      )
      SELECT title, revenue
      FROM revenue_per_event
      WHERE revenue = (
        SELECT MAX(revenue) FROM revenue_per_event
      )
    `);
    const topEvent = eventRevenueResult.rows[0] || null;

    // 2. Most popular event (by tickets sold)
    const popularEventResult = await client.query(`
      SELECT e.title, COUNT(tk.ticket_id) AS tickets_sold
      FROM events e
      JOIN tickets tk ON e.event_id = tk.event_id
      GROUP BY e.title
    `);
    let mostPopularEvent = null;
    if (popularEventResult.rows.length > 0) {
      mostPopularEvent = popularEventResult.rows.reduce((max, row) =>
        Number(row.tickets_sold) > Number(max.tickets_sold) ? row : max,
        popularEventResult.rows[0]
      );
    }

    // 3. Most active city (by event count)
    const activeCityResult = await client.query(`
      SELECT v.city, COUNT(*) AS event_count
      FROM events e
      JOIN venues v ON e.venue_id = v.venue_id
      GROUP BY v.city
    `);
    let mostActiveCity = null;
    if (activeCityResult.rows.length > 0) {
      mostActiveCity = activeCityResult.rows.reduce((max, row) =>
        Number(row.event_count) > Number(max.event_count) ? row : max,
        activeCityResult.rows[0]
      );
    }

    // 4. Total revenue
    const totalRevenueResult = await client.query(`
      SELECT COALESCE(SUM(tn.amount), 0) AS total
      FROM transactions tn
      WHERE tn.tx_type IN ('TICKET_PURCHASE')
    `);
    const totalRevenue = totalRevenueResult.rows[0]?.total || 0;

    // 5. Total events
    const totalEventsResult = await client.query(`SELECT COUNT(*) AS total FROM events`);
    const totalEvents = totalEventsResult.rows[0]?.total || 0;

    // 6. Total users
    const totalUsersResult = await client.query(`SELECT COUNT(*) AS total FROM accounts`);
    const totalUsers = totalUsersResult.rows[0]?.total || 0;

    // Generate PDF
    const doc = new PDFDocument();
    let buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      let pdfData = Buffer.concat(buffers);
      res
        .writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment;filename=dashboard_report.pdf',
          'Content-Length': pdfData.length,
        })
        .end(pdfData);
    });

    doc.fontSize(20).text('Dashboard Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text('Key Statistics:');
    doc.moveDown();
    doc.fontSize(12).text(`Total Revenue: $${totalRevenue}`);
    doc.text(`Total Events: ${totalEvents}`);
    doc.text(`Total Users: ${totalUsers}`);
    doc.moveDown();
    doc.fontSize(14).text('Top Event by Revenue:');
    doc.fontSize(12).text(`Event: ${topEvent?.title || 'N/A'}`);
    doc.text(`Revenue: $${topEvent?.revenue || 0}`);
    doc.moveDown();
    doc.fontSize(14).text('Most Popular Event (by Tickets Sold):');
    doc.fontSize(12).text(`Event: ${mostPopularEvent?.title || 'N/A'}`);
    doc.text(`Tickets Sold: ${mostPopularEvent?.tickets_sold || 0}`);
    doc.moveDown();
    doc.fontSize(14).text('Most Active City (by Event Count):');
    doc.fontSize(12).text(`City: ${mostActiveCity?.city || 'N/A'}`);
    doc.text(`Event Count: ${mostActiveCity?.event_count || 0}`);
    doc.end();
  } catch (err) {
    next(err);
  }
};
  