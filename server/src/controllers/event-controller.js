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

export const getEventDetails = async (req, res) => {
    try {
        const { eventId } = req.params;
        
        console.log('Received eventId:', eventId);
        
        if (!eventId || isNaN(parseInt(eventId))) {
            console.log('Invalid eventId provided:', eventId);
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const eventIdInt = parseInt(eventId);
        console.log('Parsed eventId:', eventIdInt);

        const eventQuery = `
            SELECT
                e.event_id,
                e.title,
                e.description,
                e.rules,
                e.category::TEXT AS category,
                e.start_at,
                e.end_at,
                e.status::TEXT AS status,
                e.base_price,
                e.hero_image_url,
                e.tickets_sold,
                e.created_at,
                e.updated_at,
                o.account_id AS organizer_account_id,
                o.display_name AS organizer_display_name,
                o.avatar_url AS organizer_avatar_url,
                o.avg_rating AS organizer_rating,
                v.venue_id,
                v.name AS venue_name,
                v.address AS venue_address,
                v.city AS venue_city,
                v.capacity AS venue_capacity,
                v.is_seated AS venue_is_seated,
                v.map_image_url AS venue_map_image_url
            FROM events e
            JOIN organizers o ON o.account_id = e.organizer_account_id
            JOIN venues v ON v.venue_id = e.venue_id
            WHERE e.event_id = $1
        `;

        console.log('Executing query with eventId:', eventIdInt);
        const { rows: eventRows } = await query(eventQuery, [eventIdInt]);
        console.log('Query returned rows:', eventRows.length);
        
        if (eventRows.length === 0) {
            const checkQuery = 'SELECT event_id, title, status FROM events WHERE event_id = $1';
            const { rows: checkRows } = await query(checkQuery, [eventIdInt]);
            console.log('Check query results:', checkRows);
            
            if (checkRows.length === 0) {
                return res.status(404).json({ error: 'Event not found' });
            } else {
                return res.status(404).json({ 
                    error: 'Event exists but may have missing organizer or venue data',
                    debug: checkRows[0]
                });
            }
        }

        const event = eventRows[0];
        console.log('Found event:', event.title);

        const facilitiesQuery = `
            SELECT f.facility_id, f.name
            FROM venue_facilities vf
            JOIN facilities f ON f.facility_id = vf.facility_id
            WHERE vf.venue_id = $1
            ORDER BY f.name
        `;
        const { rows: facilitiesRows } = await query(facilitiesQuery, [event.venue_id]);

        const imagesQuery = `
            SELECT image_id, url, caption
            FROM event_images
            WHERE event_id = $1
            ORDER BY image_id
        `;
        const { rows: imagesRows } = await query(imagesQuery, [eventIdInt]);

        let ticketTiers = [];
        const tiersQuery = `
            SELECT tier_name, price, quantity, description
            FROM event_ticket_tiers
            WHERE event_id = $1
            ORDER BY price ASC
        `;
        const { rows: tiersRows } = await query(tiersQuery, [eventIdInt]);
        ticketTiers = tiersRows.map(row => ({
            tier: row.tier_name,
            price: parseFloat(row.price),
            quantity: row.quantity,
            description: row.description
        }));

        const response = {
            event_id: event.event_id,
            title: event.title,
            description: event.description,
            rules: event.rules,
            start_at: event.start_at,
            end_at: event.end_at,
            status: event.status,
            hero_image_url: event.hero_image_url,
            images: imagesRows.map(img => ({
                url: img.url,
                caption: img.caption
            })),
            organizer: {
                account_id: event.organizer_account_id,
                display_name: event.organizer_display_name,
                avatar_url: event.organizer_avatar_url,
                rating: event.organizer_rating ? parseFloat(event.organizer_rating) : null
            },
            venue: {
                venue_id: event.venue_id,
                name: event.venue_name,
                address: event.venue_address,
                city: event.venue_city,
                capacity: event.venue_capacity,
                is_seated: event.venue_is_seated,
                map_image_url: event.venue_map_image_url,
                facilities: facilitiesRows
            },
            ticket_tiers: ticketTiers
        };

        console.log('Returning response for event:', response.title);
        res.json(response);

    } catch (err) {
        console.error('Error fetching event details:', err);
        res.status(500).json({ error: 'Failed to fetch event details', details: err.message });
    }
};

export const getEventSeats = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { tier } = req.query;
        
        if (!eventId || isNaN(parseInt(eventId))) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const eventIdInt = parseInt(eventId);

        const eventQuery = `
            SELECT e.event_id, e.title, v.venue_id, v.name AS venue_name, v.is_seated
            FROM events e
            JOIN venues v ON v.venue_id = e.venue_id
            WHERE e.event_id = $1
        `;
        const { rows: eventRows } = await query(eventQuery, [eventIdInt]);
        
        if (eventRows.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const event = eventRows[0];

        const tiersQuery = `
            SELECT tier_id, tier_name, price, quantity, description
            FROM event_ticket_tiers
            WHERE event_id = $1
            ORDER BY price DESC
        `;
        const { rows: tierRows } = await query(tiersQuery, [eventIdInt]);

        if (!event.is_seated) {
            const response = {
                event: {
                    event_id: event.event_id,
                    title: event.title,
                    venue_name: event.venue_name
                },
                venue: {
                    is_seated: event.is_seated
                },
                tiers: tierRows.map(tier => ({
                    tier_id: tier.tier_id,
                    tier_name: tier.tier_name,
                    price: parseFloat(tier.price),
                    quantity: tier.quantity,
                    description: tier.description
                })),
                seat_layout: null,
                seat_ranges: null,
                statistics: {
                    total_seats: 0,
                    available_seats: 0,
                    sold_seats: 0
                }
            };

            return res.json(response);
        }

        const seatsQuery = `
            SELECT 
                s.seat_id,
                s.section,
                s.row_label,
                s.seat_number,
                t.ticket_id,
                t.status AS ticket_status,
                ett.tier_name,
                ett.price,
                ett.tier_id
            FROM seats s
            LEFT JOIN tickets t ON t.seat_id = s.seat_id AND t.event_id = $1
            LEFT JOIN event_ticket_tiers ett ON ett.tier_id = t.tier_id
            WHERE s.venue_id = $2
            ORDER BY s.section, s.row_label, CAST(s.seat_number AS INT)
        `;
        
        const { rows: seatRows } = await query(seatsQuery, [eventIdInt, event.venue_id]);

        const seatRangeQuery = `
            SELECT 
                s.section,
                s.row_label,
                MIN(CAST(s.seat_number AS INT)) AS min_seat,
                MAX(CAST(s.seat_number AS INT)) AS max_seat
            FROM seats s
            WHERE s.venue_id = $1
            GROUP BY s.section, s.row_label
            ORDER BY s.section, s.row_label
        `;
        const { rows: seatRangeRows } = await query(seatRangeQuery, [event.venue_id]);

        let allSeats = seatRows;

        const seatRanges = {};
        seatRangeRows.forEach(range => {
            if (!seatRanges[range.section]) {
                seatRanges[range.section] = {};
            }
            seatRanges[range.section][range.row_label] = {
                min_seat: parseInt(range.min_seat),
                max_seat: parseInt(range.max_seat)
            };
        });

        const seatLayout = {};
        allSeats.forEach(seat => {
            if (!seatLayout[seat.section]) {
                seatLayout[seat.section] = {};
            }
            if (!seatLayout[seat.section][seat.row_label]) {
                seatLayout[seat.section][seat.row_label] = [];
            }
            
            seatLayout[seat.section][seat.row_label].push({
                seat_id: seat.seat_id,
                seat_number: seat.seat_number,
                status: seat.ticket_status || 'unavailable',
                tier: seat.tier_name,
                price: seat.price ? parseFloat(seat.price) : null,
                tier_id: seat.tier_id
            });
        });

        let filteredSeatsForStats = allSeats;
        if (tier && tier !== 'all') {
            filteredSeatsForStats = allSeats.filter(seat => seat.tier_name === tier);
        }

        const totalSeats = filteredSeatsForStats.length;
        const availableSeats = filteredSeatsForStats.filter(seat => seat.ticket_status === 'AVAILABLE').length;
        const soldSeats = filteredSeatsForStats.filter(seat => seat.ticket_status === 'PURCHASED').length;

        const response = {
            event: {
                event_id: event.event_id,
                title: event.title,
                venue_name: event.venue_name
            },
            venue: {
                is_seated: event.is_seated
            },
            seat_layout: seatLayout,
            seat_ranges: seatRanges,
            tiers: tierRows.map(tier => ({
                tier_id: tier.tier_id,
                tier_name: tier.tier_name,
                price: parseFloat(tier.price),
                quantity: tier.quantity,
                description: tier.description
            })),
            statistics: {
                total_seats: totalSeats,
                available_seats: availableSeats,
                sold_seats: soldSeats
            }
        };

        res.json(response);

    } catch (err) {
        console.error('Error fetching event seats:', err);
        res.status(500).json({ error: 'Failed to fetch event seats', details: err.message });
    }
};