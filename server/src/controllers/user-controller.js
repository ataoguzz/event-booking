import { query, getClient } from "../utils/db.js";
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper functions
const toInt = (val, defaultVal) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultVal : parsed;
};

const validSort = (sort) => {
    return ['popular', 'rating', 'events', 'upcoming'].includes(sort);
};

export const getOrganizers = async (req, res) => {
    try {
      const search = req.query.search ?? null;
      const sort   = validSort(req.query.sort) ? req.query.sort : 'popular';
      const limit  = toInt(req.query.limit, 24);
      const page   = toInt(req.query.page , 1);
      const offset = (page - 1) * limit;
  
      const q = `
      WITH upcoming AS (
        SELECT DISTINCT ON (e.organizer_account_id)
               e.organizer_account_id,
               e.event_id,
               e.title,
               e.start_at,
               ei.url AS cover_url
        FROM   events e
        LEFT   JOIN LATERAL (
                 SELECT url
                 FROM   event_images
                 WHERE  event_id = e.event_id
                 LIMIT  1
               ) ei ON TRUE
        WHERE  e.status = 'PUBLISHED'
          AND  e.start_at >= NOW()
        ORDER  BY e.organizer_account_id, e.start_at
      ),
  
      base AS (
        SELECT  o.account_id,
                o.display_name,
                o.avatar_url,
                o.bio,
                o.avg_rating,
                o.followers_count,
                json_build_object(
                  'event_id', up.event_id,
                  'title'   , up.title,
                  'date'    , up.start_at,
                  'cover_url', up.cover_url
                )                           AS featured_event,
                (
                  SELECT COUNT(*)
                  FROM   events e2
                  WHERE  e2.organizer_account_id = o.account_id
                )                           AS event_count
        FROM    organizers o
        LEFT    JOIN upcoming up
                ON up.organizer_account_id = o.account_id
        WHERE   (
                  $1::TEXT IS NULL OR
                  o.display_name ILIKE '%'||$1||'%' OR
                  o.bio          ILIKE '%'||$1||'%'
                )
      )
  
      SELECT *
      FROM   base
      ORDER  BY
             CASE WHEN $2 = 'popular'  THEN followers_count END DESC NULLS LAST,
             CASE WHEN $2 = 'rating'   THEN avg_rating      END DESC NULLS LAST,
             CASE WHEN $2 = 'events'   THEN event_count     END DESC NULLS LAST,
             CASE WHEN $2 = 'upcoming' THEN (featured_event->>'date')::timestamptz END ASC NULLS LAST,
             display_name
      LIMIT  $3 OFFSET $4;
      `;
  
      const { rows } = await query(q, [
        search,   // $1
        sort,     // $2
        limit,    // $3
        offset    // $4
      ]);
  
      res.json(rows);
    } catch (err) {
      console.error('Error in getOrganizers:', err);
      res.status(500).json({ error: err.message });
    }
  };


export const getFollowing = async (req, res) => {
    try {
        const q = `
          SELECT organizer_account_id AS id
          FROM   follows
          WHERE  follower_account_id = $1
        `;
        const { rows } = await query(q, [req.user.accountId]);
        res.json(rows.map(r => r.id));
    } catch (err) { 
        console.error("Error in getFollowing:", err);
        res.status(500).json({ error: err.message }); 
    }
}

export const followOrganizer = async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId) || orgId <= 0) {
      return res.status(400).json({ error: 'Invalid organizer id' });
    }
  
    const client = await getClient();
    try {
      await client.query('BEGIN');
  
      const insertResult = await client.query(
        `INSERT INTO follows (follower_account_id, organizer_account_id)
         VALUES ($1, $2)
         ON CONFLICT (follower_account_id, organizer_account_id) DO NOTHING`,
        [req.user.accountId, orgId]
      );
  
      if (insertResult.rowCount > 0) {
        await client.query(
          `UPDATE organizers
             SET followers_count = followers_count + 1
           WHERE account_id = $1`,
          [orgId]
        );
      }
  
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error in followOrganizer:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
};
  

  export const unfollowOrganizer = async (req, res) => {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId) || orgId <= 0) {
      return res.status(400).json({ error: 'Invalid organizer id' });
    }
  
    const client = await getClient();
    try {
      await client.query('BEGIN');
  
      const { rowCount } = await client.query(
        `DELETE FROM follows
         WHERE follower_account_id   = $1
           AND organizer_account_id = $2`,
        [req.user.accountId, orgId]
      );
  
      if (rowCount) {
        await client.query(
          `UPDATE organizers
             SET followers_count = GREATEST(followers_count - 1, 0)
           WHERE account_id = $1`,
          [orgId]
        );
      }
  
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Error in unfollowOrganizer:", err);
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  };

export const getWalletInfo = async (req, res) => {
    try {
        const { accountId } = req.user;
        
        const balanceQuery = `
            SELECT balance 
            FROM attendees 
            WHERE account_id = $1
        `;
        const { rows: balanceRows } = await query(balanceQuery, [accountId]);
        
        if (balanceRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const balance = parseFloat(balanceRows[0].balance);
        
        const currentMonth = new Date();
        const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        
        const statsQuery = `
            SELECT 
                tx_type,
                SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_added,
                SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
                COUNT(*) as transaction_count
            FROM transactions 
            WHERE attendee_account_id = $1 
            AND created_at >= $2
            GROUP BY tx_type
        `;
        const { rows: statsRows } = await query(statsQuery, [accountId, firstDayOfMonth]);
        
        let monthlySpent = 0;
        let monthlyAdded = 0;
        let totalTransactions = 0;
        
        statsRows.forEach(row => {
            if (row.tx_type === 'TICKET_PURCHASE') {
                monthlySpent += parseFloat(row.total_spent);
            } else if (row.tx_type === 'TOP_UP') {
                monthlyAdded += parseFloat(row.total_added);
            }
            totalTransactions += parseInt(row.transaction_count);
        });
        
        res.json({
            balance: balance,
            monthly_spent: monthlySpent,
            monthly_added: monthlyAdded,
            total_transactions: totalTransactions
        });
        
    } catch (err) {
        console.error('Error fetching wallet info:', err);
        res.status(500).json({ error: 'Failed to fetch wallet information', details: err.message });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const { accountId } = req.user;
        const { filter = 'all', limit = 50, offset = 0 } = req.query;
        
        let whereClause = 'WHERE t.attendee_account_id = $1';
        const queryParams = [accountId];
        
        // Add filter conditions
        if (filter === 'deposits') {
            whereClause += ' AND t.tx_type = $2';
            queryParams.push('TOP_UP');
        } else if (filter === 'expenses') {
            whereClause += ' AND t.tx_type = $2';
            queryParams.push('TICKET_PURCHASE');
        }
        
        const transactionsQuery = `
            SELECT 
                t.tx_id,
                t.tx_type,
                t.amount,
                t.note,
                t.created_at,
                e.title as event_title,
                e.event_id
            FROM transactions t
            LEFT JOIN tickets tk ON t.tx_id = tk.tx_id
            LEFT JOIN events e ON tk.event_id = e.event_id
            ${whereClause}
            ORDER BY t.created_at DESC
            LIMIT $${queryParams.length + 1}
            OFFSET $${queryParams.length + 2}
        `;
        
        queryParams.push(limit, offset);
        const { rows } = await query(transactionsQuery, queryParams);
        
        // Format transactions for frontend
        const transactions = rows.map(row => ({
            id: row.tx_id,
            type: row.tx_type === 'TOP_UP' ? 'deposit' : 'expense',
            description: row.tx_type === 'TOP_UP' ? 
                (row.note || 'Wallet Top-up') : 
                (row.event_title ? `${row.event_title} Ticket` : 'Ticket Purchase'),
            amount: parseFloat(row.amount),
            date: row.created_at.toISOString().split('T')[0],
            time: row.created_at.toTimeString().slice(0, 5),
            status: 'completed',
            event_id: row.event_id
        }));
        
        res.json(transactions);
        
    } catch (err) {
        console.error('Error fetching transactions:', err);
        res.status(500).json({ error: 'Failed to fetch transactions', details: err.message });
    }
};

export const topUpBalance = async (req, res) => {
    try {
        const { accountId } = req.user;
        const { amount, card_data } = req.body;
        
        // Validate amount
        const topUpAmount = parseFloat(amount);
        if (!topUpAmount || topUpAmount <= 0 || topUpAmount > 10000) {
            return res.status(400).json({ error: 'Invalid amount. Must be between $0.01 and $10,000' });
        }
        
        // Mock credit card validation (always accept)
        if (!card_data || !card_data.number || !card_data.expiry || !card_data.cvv || !card_data.name) {
            return res.status(400).json({ error: 'Please provide complete credit card information' });
        }
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Start transaction
        const client = await getClient();
        
        try {
            await client.query('BEGIN');
            
            // Insert transaction record
            const insertTxQuery = `
                INSERT INTO transactions (attendee_account_id, tx_type, amount, note)
                VALUES ($1, 'TOP_UP', $2, $3)
                RETURNING tx_id, created_at
            `;
            const { rows: txRows } = await client.query(insertTxQuery, [
                accountId, 
                topUpAmount, 
                `Credit card top-up - **** ${card_data.number.slice(-4)}`
            ]);
            
            // Update user balance
            const updateBalanceQuery = `
                UPDATE attendees 
                SET balance = balance + $1 
                WHERE account_id = $2
                RETURNING balance
            `;
            const { rows: balanceRows } = await client.query(updateBalanceQuery, [topUpAmount, accountId]);
            
            await client.query('COMMIT');
            
            res.json({
                success: true,
                transaction_id: txRows[0].tx_id,
                new_balance: parseFloat(balanceRows[0].balance),
                amount: topUpAmount,
                timestamp: txRows[0].created_at
            });
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
        
    } catch (err) {
        console.error('Error processing top-up:', err);
        res.status(500).json({ error: 'Failed to process top-up', details: err.message });
    }
};

export const getFollowedEvents = async (req, res) => {
    try {
        const { accountId } = req.user;
        const limit = parseInt(req.query.limit) || 10;
        const offset = parseInt(req.query.offset) || 0;

        const eventsQuery = `
            SELECT 
                event_id,
                title,
                category,
                start_at,
                end_at,
                status,
                base_price,
                cover_url,
                tickets_sold,
                venue_name,
                venue_city,
                organizer_account_id,
                organizer_name,
                organizer_avatar_url,
                organizer_rating
            FROM followed_organizer_events
            WHERE follower_account_id = $1
            ORDER BY start_at ASC
            LIMIT $2 OFFSET $3
        `;

        const { rows: events } = await query(eventsQuery, [accountId, limit, offset]);

        const countQuery = `
            SELECT COUNT(*) as total
            FROM followed_organizer_events
            WHERE follower_account_id = $1
        `;
        const { rows: countRows } = await query(countQuery, [accountId]);
        const totalCount = parseInt(countRows[0].total);

        const formattedEvents = events.map(event => ({
            event_id: event.event_id,
            title: event.title,
            category: event.category,
            start_at: event.start_at,
            end_at: event.end_at,
            status: event.status,
            base_price: parseFloat(event.base_price),
            cover_url: event.cover_url || `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80`,
            tickets_sold: event.tickets_sold,
            venue_name: event.venue_name,
            venue_city: event.venue_city,
            organizer: {
                account_id: event.organizer_account_id,
                display_name: event.organizer_name,
                avatar_url: event.organizer_avatar_url,
                rating: event.organizer_rating ? parseFloat(event.organizer_rating) : null
            },
            time_until_event: new Date(event.start_at) - new Date()
        }));

        res.json({
            events: formattedEvents,
            pagination: {
                total: totalCount,
                limit: limit,
                offset: offset,
                has_more: offset + limit < totalCount
            }
        });

    } catch (err) {
        console.error('Error fetching followed events:', err);
        res.status(500).json({ error: 'Failed to fetch followed events', details: err.message });
    }
};


