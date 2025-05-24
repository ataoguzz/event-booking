import { query, getClient } from "../utils/db.js";

const validSort = (sortValue) => {
    const validSorts = ['popular', 'rating', 'events', 'upcoming'];
    return validSorts.includes(sortValue);
};

const toInt = (value, defaultValue) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
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
      SELECT  o.account_id AS organizer_id,
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
          SELECT organizer_account_id AS id$
          FROM   follows
          WHERE  follower_account_id = $1
        `;
        const { rows } = await query(q, [req.user.id]);
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
        [req.user.id, orgId]
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
        [req.user.id, orgId]
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


