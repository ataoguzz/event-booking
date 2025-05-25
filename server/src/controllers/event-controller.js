import { query, getClient } from "../utils/db.js";

export const searchEvents = async (req, res, next) => {
    const {
        location,
        startDate,
        endDate,
        category,
        minPrice,
        maxPrice,
        sortBy = 'date_asc'
    } = req.query;

    try {
        let queryText = `
            SELECT 
                e.event_id,
                e.title,
                e.description,
                e.start_at,
                e.end_at,
                e.base_price,
                e.category,
                e.avg_rating,
                e.hero_image_url,
                e.tickets_sold,
                e.view_count,
                v.name as venue_name,
                v.city,
                v.address,
                array_agg(DISTINCT f.name) as facilities
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            LEFT JOIN venue_facilities vf ON v.venue_id = vf.venue_id
            LEFT JOIN facilities f ON vf.facility_id = f.facility_id
            WHERE e.status = 'PUBLISHED'
        `;

        const queryParams = [];
        let paramCount = 1;

        // Add location filter
        if (location) {
            queryText += `
                AND (LOWER(v.city) LIKE LOWER($${paramCount}) 
                OR LOWER(v.name) LIKE LOWER($${paramCount}))
            `;
            queryParams.push(`%${location}%`);
            paramCount++;
        }

        // Add date range filter
        if (startDate) {
            queryText += ` AND e.start_at >= $${paramCount}`;
            queryParams.push(new Date(startDate));
            paramCount++;
        }
        if (endDate) {
            queryText += ` AND e.start_at <= $${paramCount}`;
            queryParams.push(new Date(endDate));
            paramCount++;
        }

        // Add category filter
        if (category) {
            queryText += ` AND e.category = $${paramCount}`;
            queryParams.push(category);
            paramCount++;
        }

        // Add price range filter
        if (minPrice !== undefined) {
            queryText += ` AND e.base_price >= $${paramCount}`;
            queryParams.push(parseFloat(minPrice));
            paramCount++;
        }
        if (maxPrice !== undefined) {
            queryText += ` AND e.base_price <= $${paramCount}`;
            queryParams.push(parseFloat(maxPrice));
            paramCount++;
        }

        // Group by required fields
        queryText += `
            GROUP BY 
                e.event_id,
                e.title,
                e.description,
                e.start_at,
                e.end_at,
                e.base_price,
                e.category,
                e.avg_rating,
                e.hero_image_url,
                e.tickets_sold,
                e.view_count,
                v.name,
                v.city,
                v.address
        `;

        // Add sorting
        switch (sortBy) {
            case 'date_asc':
                queryText += ' ORDER BY e.start_at ASC';
                break;
            case 'date_desc':
                queryText += ' ORDER BY e.start_at DESC';
                break;
            case 'price_asc':
                queryText += ' ORDER BY e.base_price ASC';
                break;
            case 'price_desc':
                queryText += ' ORDER BY e.base_price DESC';
                break;
            case 'popularity':
                queryText += ' ORDER BY e.tickets_sold DESC, e.view_count DESC';
                break;
            case 'rating':
                queryText += ' ORDER BY e.avg_rating DESC NULLS LAST';
                break;
            default:
                queryText += ' ORDER BY e.start_at ASC';
        }

        const result = await query(queryText, queryParams);
        res.json(result.rows);
    } catch (error) {
        console.error('Error in searchEvents:', error);
        next(error);
    }
};

export const getEventById = async (req, res, next) => {
    const { id } = req.params;

    try {
        const queryText = `
            SELECT 
                e.*,
                v.name as venue_name,
                v.city,
                v.address,
                v.capacity,
                array_agg(DISTINCT f.name) as facilities,
                json_agg(DISTINCT ei.*) as images,
                json_agg(DISTINCT sp.*) as seat_pricing
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            LEFT JOIN venue_facilities vf ON v.venue_id = vf.venue_id
            LEFT JOIN facilities f ON vf.facility_id = f.facility_id
            LEFT JOIN event_images ei ON e.event_id = ei.event_id
            LEFT JOIN seat_pricing sp ON e.event_id = sp.event_id
            WHERE e.event_id = $1 AND e.status = 'PUBLISHED'
            GROUP BY e.event_id, v.venue_id
        `;

        const result = await query(queryText, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // Increment view count
        await query(
            'UPDATE events SET view_count = view_count + 1 WHERE event_id = $1',
            [id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error in getEventById:', error);
        next(error);
    }
}; 