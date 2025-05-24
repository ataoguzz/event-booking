import bcryptjs from "bcryptjs";
import { query } from "../utils/db.js";
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

export const getOrganizers = async (req, res, next) => {
    try {
        const search = req.query.search    ?? null;
        const category = req.query.category  ?? null;
        const sort = validSort(req.query.sort) ? req.query.sort : 'popular';
        const page = toInt(req.query.page , 1);
        const limit = toInt(req.query.limit, 24);
        const offset = (page - 1) * limit;
        const viewerId = req.user?.id || null;          
    
        const q = `
        WITH upcoming AS (
           SELECT DISTINCT ON (e.organizer_account_id)
                  e.organizer_account_id,
                  e.event_id,
                  e.title,
                  e.start_at,
                  ei.url       AS cover_url
           FROM   events e
           LEFT   JOIN LATERAL (
                    SELECT url FROM event_images 
                    WHERE  event_id = e.event_id
                    LIMIT  1
                  ) ei ON TRUE
           WHERE  e.status = 'PUBLISHED'
             AND  e.start_at >= NOW()
           ORDER  BY e.organizer_account_id, e.start_at
        )
        SELECT  o.organizer_id,
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
                )                       AS featured_event,
    
                ( SELECT ARRAY(
                      SELECT DISTINCT category
                      FROM   events e2
                      WHERE  e2.organizer_account_id = o.account_id
                      LIMIT  3
                  )
                )                       AS categories,
    
                ( SELECT COUNT(*)
                  FROM   events e3
                  WHERE  e3.organizer_account_id = o.account_id
                )                       AS event_count,
    
                CASE WHEN $1::BIGINT IS NULL THEN FALSE
                     ELSE EXISTS (
                         SELECT 1 FROM follows f 
                         WHERE  f.follower_account_id = $1
                           AND  f.organizer_account_id = o.account_id)
                END                      AS is_following
        FROM    organizers o
        LEFT    JOIN upcoming up ON up.organizer_account_id = o.account_id
        WHERE   ($2::TEXT IS NULL OR       -- search
                 o.display_name ILIKE '%'||$2||'%' OR
                 o.bio          ILIKE '%'||$2||'%')
          AND   ($3::event_category_enum IS NULL OR
                 EXISTS (SELECT 1 FROM events e4
                         WHERE  e4.organizer_account_id = o.account_id
                           AND  e4.category = $3))
        ORDER BY
             CASE WHEN $4 = 'popular'  THEN o.followers_count END DESC NULLS LAST,
             CASE WHEN $4 = 'rating'   THEN o.avg_rating      END DESC NULLS LAST,
             CASE WHEN $4 = 'events'   THEN event_count       END DESC NULLS LAST,
             CASE WHEN $4 = 'upcoming' THEN up.start_at       END ASC  NULLS LAST,
             o.display_name
        LIMIT  $5 OFFSET $6
        `;

        const { rows } = await query(q, [
          viewerId,
          search,
          category,
          sort,
          limit,
          offset
        ]);
        res.json(rows);
    } catch (err) { 
        next(err); 
    }
};

