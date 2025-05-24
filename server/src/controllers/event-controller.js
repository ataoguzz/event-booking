/* controllers/events.js */
import { query } from '../utils/db.js';

const toInt = (v, defVal) => {
  const n = parseInt(v, 10);
  if (typeof v === 'string' && v.trim() === '0') return 0;
  return Number.isFinite(n) && (n >= 0 || defVal === undefined) ? n : defVal;
};

const mapSort = s => {
  const validSorts = ['soonest', 'latest', 'price_low', 'price_high', 'rating_high'];
  return validSorts.includes(s) ? s : 'soonest';
};


export const getEvents = async (req, res) => {
    try {
        const getQueryParam = (key) => {
            return req.query[key] !== undefined ? req.query[key] : req.query[`params[${key}]`];
        }

        let search = getQueryParam('search') || null;
        if (search && search.trim() === "") search = null;

        let category = getQueryParam('category') || null;
        if (category === 'all' || (category && category.trim() === "")) category = null;

        let city = getQueryParam('city') || null;
        if (city === 'all' || (city && city.trim() === "")) city = null;

        let dateFrom = getQueryParam('date_from') || null;
        if (dateFrom && dateFrom.trim() === "") dateFrom = null;

        let dateTo = getQueryParam('date_to') || null;
        if (dateTo && dateTo.trim() === "") dateTo = null;

        let priceMinSource = getQueryParam('price_min');
        let priceMin = priceMinSource !== undefined ? priceMinSource : null;
        if (priceMin !== null) priceMin = parseFloat(priceMin);

        let priceMaxSource = getQueryParam('price_max');
        let priceMax = priceMaxSource !== undefined ? priceMaxSource : null;
        if (priceMax !== null) priceMax = parseFloat(priceMax);
        
        const sort = mapSort(getQueryParam('sort')); 
        const limit = toInt(getQueryParam('limit'), 30);
        const page = toInt(getQueryParam('page'), 1);
        const offset = (page - 1) * limit;

        const q = `
        SELECT
            e.event_id,
            e.title,
            e.description,
            e.category::TEXT AS category,
            e.start_at,
            e.end_at,
            e.status::TEXT AS status,
            e.base_price, -- Send raw base_price
            e.base_price AS price_from, -- Alias for frontend consistency
            e.hero_image_url AS cover_url,
            e.tickets_sold,
            e.view_count,
            v.name                                    AS venue_name,
            v.city,
            o.account_id                              AS organizer_account_id,
            o.display_name                            AS organizer_name,
            o.avg_rating                              AS organizer_rating
        FROM
            events e
        JOIN
            organizers o  ON o.account_id = e.organizer_account_id
        JOIN
            venues     v  ON v.venue_id   = e.venue_id
        WHERE
            e.status = 'PUBLISHED'
            AND e.end_at >= NOW()
    
            AND ($1::TEXT IS NULL OR (
                e.title ILIKE '%' || $1 || '%' OR
                v.name  ILIKE '%' || $1 || '%' OR
                o.display_name ILIKE '%' || $1 || '%'
            ))
    
            AND ($2::TEXT IS NULL OR e.category = $2::event_category_enum)
    
            AND ($3::TEXT IS NULL OR v.city = $3)
    
            AND ($4::DATE IS NULL OR DATE(e.start_at) >= $4)
            AND ($5::DATE IS NULL OR DATE(e.start_at) <= $5)
    
            AND ($6::NUMERIC IS NULL OR e.base_price >= $6)
            AND ($7::NUMERIC IS NULL OR e.base_price <= $7)
    
        ORDER BY
            CASE WHEN $8 = 'soonest'     THEN e.start_at END ASC NULLS LAST,
            CASE WHEN $8 = 'latest'      THEN e.start_at END DESC NULLS LAST,
            CASE WHEN $8 = 'price_low'   THEN e.base_price END ASC NULLS LAST,
            CASE WHEN $8 = 'price_high'  THEN e.base_price END DESC NULLS LAST,
            CASE WHEN $8 = 'rating_high' THEN o.avg_rating END DESC NULLS LAST,
            e.event_id ASC
        LIMIT $9
        OFFSET $10;
        `;

        const queryParams = [
            search,       // $1
            category,     // $2
            city,         // $3
            dateFrom,     // $4
            dateTo,       // $5
            priceMin,     // $6
            priceMax,     // $7
            sort,         // $8
            limit,        // $9
            offset        // $10
        ];

        console.log(queryParams);
        
        const { rows } = await query(q, queryParams);
        const events = rows.map(event => ({
            ...event,
            base_price: parseFloat(event.base_price),
            price_from: parseFloat(event.price_from)
        }));

        console.log(queryParams);

        res.json(events);
        } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Failed to fetch events', details: err.message });
        }
  };