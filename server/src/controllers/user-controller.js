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
      
      // Check if organizer exists
      const organizerCheck = await client.query(
        'SELECT account_id FROM organizers WHERE account_id = $1',
        [orgId]
      );
      
      if (organizerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Organizer not found' });
      }
      
      // Check if current user is an attendee
      const attendeeCheck = await client.query(
        'SELECT account_id FROM attendees WHERE account_id = $1',
        [req.user.accountId]
      );
      
      if (attendeeCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Only attendees can follow organizers' });
      }
  
      const insertResult = await client.query(
        `INSERT INTO follows (follower_account_id, organizer_account_id)
         VALUES ($1, $2)
         ON CONFLICT (follower_account_id, organizer_account_id) DO NOTHING`,
        [req.user.accountId, orgId]
      );
  
      if (insertResult.rowCount > 0) {
        // Update organizer's followers count
        await client.query(
          `UPDATE organizers
             SET followers_count = followers_count + 1
           WHERE account_id = $1`,
          [orgId]
        );
        
        // Update attendee's following count
        await client.query(
          `UPDATE attendees
             SET following_count = following_count + 1
           WHERE account_id = $1`,
          [req.user.accountId]
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
      
      // Check if organizer exists
      const organizerCheck = await client.query(
        'SELECT account_id FROM organizers WHERE account_id = $1',
        [orgId]
      );
      
      if (organizerCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Organizer not found' });
      }
      
      // Check if current user is an attendee
      const attendeeCheck = await client.query(
        'SELECT account_id FROM attendees WHERE account_id = $1',
        [req.user.accountId]
      );
      
      if (attendeeCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Only attendees can unfollow organizers' });
      }
  
      const { rowCount } = await client.query(
        `DELETE FROM follows
         WHERE follower_account_id   = $1
           AND organizer_account_id = $2`,
        [req.user.accountId, orgId]
      );
  
      if (rowCount) {
        // Update organizer's followers count
        await client.query(
          `UPDATE organizers
             SET followers_count = GREATEST(followers_count - 1, 0)
           WHERE account_id = $1`,
          [orgId]
        );
        
        // Update attendee's following count
        await client.query(
          `UPDATE attendees
             SET following_count = GREATEST(following_count - 1, 0)
           WHERE account_id = $1`,
          [req.user.accountId]
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


