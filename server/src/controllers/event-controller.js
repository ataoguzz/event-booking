import { query, getClient } from '../utils/db.js';
import { calculateDiscount, applyPromoCode } from './promo-controller.js';
import { getImageUrl } from '../utils/imageUtils.js';
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRootDir = path.join(__dirname, '../..');

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
            price_from: parseFloat(event.price_from),
            cover_url: getImageUrl(event.cover_url)
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
                o.account_id AS organizer_account_id,
                o.display_name AS organizer_display_name,
                o.avatar_url AS organizer_avatar_url,
                o.avg_rating AS organizer_rating,
                v.venue_id,
                v.name AS venue_name,
                v.address AS venue_address,
                v.city AS venue_city,
                v.capacity AS venue_capacity,
                v.is_seated AS venue_is_seated
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
            tier_name: row.tier_name,
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
            category: event.category,
            venue_id: event.venue_id,
            hero_image_url: getImageUrl(event.hero_image_url),
            images: imagesRows.map(img => ({
                url: getImageUrl(img.url),
                caption: img.caption
            })),
            organizer: {
                account_id: event.organizer_account_id,
                display_name: event.organizer_display_name,
                avatar_url: getImageUrl(event.organizer_avatar_url),
                rating: event.organizer_rating ? parseFloat(event.organizer_rating) : null
            },
            venue: {
                venue_id: event.venue_id,
                name: event.venue_name,
                address: event.venue_address,
                city: event.venue_city,
                capacity: event.venue_capacity,
                is_seated: event.venue_is_seated,
                facilities: facilitiesRows
            },
            venue_name: event.venue_name,
            venue_address: event.venue_address,
            venue_city: event.venue_city,
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

export const purchaseTickets = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { accountId } = req.user;
        const { seats, quantities, guest_info, promo_code } = req.body;

        if (!eventId || isNaN(parseInt(eventId))) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }

        const eventIdInt = parseInt(eventId);

        const eventQuery = `
            SELECT e.event_id, e.title, v.venue_id, v.name AS venue_name, v.is_seated
            FROM events e
            JOIN venues v ON v.venue_id = e.venue_id
            WHERE e.event_id = $1 AND e.status = 'PUBLISHED'
        `;
        const { rows: eventRows } = await query(eventQuery, [eventIdInt]);
        
        if (eventRows.length === 0) {
            return res.status(404).json({ error: 'Event not found or not published' });
        }

        const event = eventRows[0];

        
        const userQuery = `
            SELECT full_name, balance
            FROM attendees
            WHERE account_id = $1
        `;
        const { rows: userRows } = await query(userQuery, [accountId]);
        
        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userRows[0];
        let totalAmount = 0;
        let ticketsToCreate = [];

        // Start database transaction
        const client = await getClient();
        await client.query('BEGIN');

        try {
            if (event.is_seated && seats) {
                
                const seatIds = seats.split(',').map(id => parseInt(id));
                

                const availableTicketsQuery = `
                    SELECT 
                        t.ticket_id, t.seat_id, t.tier_id,
                        ett.tier_name, ett.price,
                        s.section, s.row_label, s.seat_number
                    FROM tickets t
                    JOIN event_ticket_tiers ett ON ett.tier_id = t.tier_id
                    JOIN seats s ON s.seat_id = t.seat_id
                    WHERE t.event_id = $1 
                    AND t.seat_id = ANY($2) 
                    AND t.status = 'AVAILABLE'
                `;
                const { rows: availableTickets } = await client.query(availableTicketsQuery, [eventIdInt, seatIds]);

                if (availableTickets.length !== seatIds.length) {
                    console.log('Requested seat IDs:', seatIds);
                    console.log('Found available tickets:', availableTickets.map(t => t.seat_id));
                    throw new Error('Some selected seats are no longer available');
                }

                // Calculate total and prepare ticket data
                for (const ticket of availableTickets) {
                    totalAmount += parseFloat(ticket.price);
                    
                    ticketsToCreate.push({
                        ticket_id: ticket.ticket_id,
                        seat_id: ticket.seat_id,
                        tier_id: ticket.tier_id,
                        price: parseFloat(ticket.price),
                        seat_info: `${ticket.section} ${ticket.row_label}-${ticket.seat_number}`
                    });
                }

            } else if (!event.is_seated && quantities) {
                // Handle non-seated event purchases
                const quantityPairs = quantities.split(',').map(pair => {
                    const [tier_id, quantity] = pair.split(':');
                    return { tier_id: parseInt(tier_id), quantity: parseInt(quantity) };
                });

                // Get tier information
                const tierIds = quantityPairs.map(p => p.tier_id);
                const tiersQuery = `
                    SELECT tier_id, tier_name, price, quantity as available_quantity
                    FROM event_ticket_tiers
                    WHERE tier_id = ANY($1) AND event_id = $2
                `;
                const { rows: tierRows } = await client.query(tiersQuery, [tierIds, eventIdInt]);

                // For non-seated events, create new tickets
                for (const qtyPair of quantityPairs) {
                    const tier = tierRows.find(t => t.tier_id === qtyPair.tier_id);
                    if (!tier) {
                        throw new Error(`Invalid tier selected`);
                    }

                    for (let i = 0; i < qtyPair.quantity; i++) {
                        totalAmount += parseFloat(tier.price);
                        ticketsToCreate.push({
                            ticket_id: null, // Will be created
                            seat_id: null,
                            tier_id: tier.tier_id,
                            price: parseFloat(tier.price),
                            seat_info: tier.tier_name
                        });
                    }
                }
            } else {
                throw new Error('Invalid purchase data');
            }

            const originalAmount = totalAmount;
            let discountAmount = 0;
            let promoCodeId = null;

            // Handle promo code if provided
            if (promo_code) {
                const promoQuery = `
                    SELECT 
                        pc.promo_code_id,
                        pc.code,
                        pc.discount_type,
                        pc.discount_value,
                        pc.usage_limit,
                        pc.usage_count,
                        pc.start_date,
                        pc.end_date,
                        pc.is_active,
                        pc.event_id
                    FROM promo_codes pc
                    WHERE pc.code = $1 
                    AND pc.is_active = TRUE
                    AND (pc.event_id IS NULL OR pc.event_id = $2)
                `;

                const { rows: promoRows } = await client.query(promoQuery, [promo_code, eventIdInt]);

                if (promoRows.length === 0) {
                    throw new Error('Invalid promo code');
                }

                const promo = promoRows[0];

                // Validate promo code
                const currentDate = new Date().toISOString().split('T')[0];
                if (promo.start_date && currentDate < promo.start_date) {
                    throw new Error('Promo code is not yet active');
                }
                if (promo.end_date && currentDate > promo.end_date) {
                    throw new Error('Promo code has expired');
                }
                if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
                    throw new Error('Promo code usage limit reached');
                }

                // Check if user has already used this promo code
                const redemptionQuery = `
                    SELECT redemption_id 
                    FROM promo_redemptions 
                    WHERE promo_code_id = $1 AND account_id = $2
                `;
                const { rows: redemptionRows } = await client.query(redemptionQuery, [promo.promo_code_id, accountId]);

                if (redemptionRows.length > 0) {
                    throw new Error('You have already used this promo code');
                }

                // Calculate discount
                discountAmount = calculateDiscount(totalAmount, promo.discount_type, parseFloat(promo.discount_value));
                totalAmount = Math.max(0, totalAmount - discountAmount);
                promoCodeId = promo.promo_code_id;
            }

            // Check wallet balance
            if (user.balance < totalAmount) {
                throw new Error(`Insufficient wallet balance. Required: $${totalAmount.toFixed(2)}, Available: $${user.balance.toFixed(2)}`);
            }

            // Create transaction record
            const transactionQuery = `
                INSERT INTO transactions (attendee_account_id, tx_type, amount, note)
                VALUES ($1, 'TICKET_PURCHASE', $2, $3)
                RETURNING tx_id, created_at
            `;
            const transactionNote = promo_code 
                ? `Ticket purchase for ${event.title} (Promo: ${promo_code})`
                : `Ticket purchase for ${event.title}`;
            
            const { rows: txRows } = await client.query(transactionQuery, [
                accountId,
                -totalAmount, // Negative amount for expense
                transactionNote
            ]);

            const transactionId = txRows[0].tx_id;

            // Apply promo code if used
            if (promoCodeId) {
                await applyPromoCode(client, promoCodeId, transactionId, accountId);
            }

            // Update user balance
            const updateBalanceQuery = `
                UPDATE attendees 
                SET balance = balance - $1 
                WHERE account_id = $2
                RETURNING balance
            `;
            await client.query(updateBalanceQuery, [totalAmount, accountId]);

            // Process tickets
            const tickets = [];
            for (let i = 0; i < ticketsToCreate.length; i++) {
                const ticketData = ticketsToCreate[i];
                
                // Determine guest information
                let guestName, guestEmail;
                if (i === 0) {
                    // First ticket goes to the purchaser
                    guestName = user.full_name;
                    const emailQuery = `SELECT email FROM accounts WHERE account_id = $1`;
                    const { rows: emailRows } = await client.query(emailQuery, [accountId]);
                    guestEmail = emailRows[0]?.email || null;
                } else {
                    // Additional tickets use guest information
                    const guestIndex = i - 1;
                    if (guest_info && guest_info[guestIndex]) {
                        guestName = guest_info[guestIndex].name;
                        guestEmail = guest_info[guestIndex].email;
                    } else {
                        throw new Error(`Guest information required for ticket ${i + 1}`);
                    }
                }

                if (event.is_seated) {
                    // For seated events, update existing ticket
                    const updateTicketQuery = `
                        UPDATE tickets 
                        SET tx_id = $1, attendee_account_id = $2, guest_full_name = $3, 
                            guest_email = $4, status = 'PURCHASED', price_at_purchase = $5, updated_at = NOW()
                        WHERE ticket_id = $6
                        RETURNING ticket_id, qr_token
                    `;
                    
                    const { rows: ticketRows } = await client.query(updateTicketQuery, [
                        transactionId,
                        accountId,
                        guestName,
                        guestEmail,
                        ticketData.price,
                        ticketData.ticket_id
                    ]);

                    tickets.push({
                        ticket_id: ticketRows[0].ticket_id,
                        qr_token: ticketRows[0].qr_token,
                        guest_name: guestName,
                        guest_email: guestEmail,
                        price: ticketData.price,
                        seat_info: ticketData.seat_info
                    });
                } else {
                    // For non-seated events, create new ticket
                    const createTicketQuery = `
                        INSERT INTO tickets (
                            event_id, tier_id, seat_id, tx_id, attendee_account_id,
                            price_at_purchase, guest_full_name, guest_email, status
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PURCHASED')
                        RETURNING ticket_id, qr_token
                    `;
                    
                    const { rows: ticketRows } = await client.query(createTicketQuery, [
                        eventIdInt,
                        ticketData.tier_id,
                        ticketData.seat_id,
                        transactionId,
                        accountId,
                        ticketData.price,
                        guestName,
                        guestEmail
                    ]);

                    tickets.push({
                        ticket_id: ticketRows[0].ticket_id,
                        qr_token: ticketRows[0].qr_token,
                        guest_name: guestName,
                        guest_email: guestEmail,
                        price: ticketData.price,
                        seat_info: ticketData.seat_info
                    });
                }
            }

            await client.query('COMMIT');

            const response = {
                success: true,
                transaction_id: transactionId,
                original_amount: originalAmount,
                discount_amount: discountAmount,
                total_amount: totalAmount,
                tickets_purchased: tickets.length,
                tickets: tickets,
                event: {
                    event_id: event.event_id,
                    title: event.title,
                    venue_name: event.venue_name
                }
            };

            if (promo_code) {
                response.promo_code_applied = promo_code;
            }

            res.json(response);

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Error processing ticket purchase:', err);
        res.status(500).json({ error: err.message || 'Failed to process ticket purchase' });
    }
};



const mapEventTypeToCategory = (eventType) => {
    const mapping = {
        // Frontend sends these values
        "CONCERT": 'CONCERT',
        "THEATER": 'THEATER',
        "SPORTS": 'SPORTS',
        "STANDUP": 'STANDUP',
        "CONFERENCE": 'CONFERENCE',
        "WORKSHOP": 'WORKSHOP',
        "FESTIVAL": 'FESTIVAL',
        "OTHER": 'OTHER',
        // Legacy mappings (in case old format is still used)
        "Concert": 'CONCERT',
        "Theater": 'THEATER',
        "Stand-up Comedy": 'STANDUP',
        "Conference": 'CONFERENCE',
        "Workshop": 'WORKSHOP',
        "Festival": 'FESTIVAL',
        "Sports Event": 'SPORTS',
        "Exhibition": 'OTHER',
        "Dance Performance": 'OTHER',
    };
    return mapping[eventType] || 'OTHER';
};

export const createEvent = async (req, res, next) => {
    const {
        title, description, eventType,
        startDate, startTime, endDate, endTime,
        venue, rules, organizerAccountId,
        ticketTiersData: ticketTiersDataString,
        promoCodes: promoCodesString,
        seatAssignments: seatAssignmentsString
    } = req.body;

    if (!organizerAccountId) {
        console.error("Error in createEvent: organizerAccountId is missing from the request body.");
        return res.status(400).json({ message: "Organizer ID is required in the request body." });
    }
    const parsedOrganizerAccountId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedOrganizerAccountId) || parsedOrganizerAccountId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer ID format in request body." });
    }

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "At least one event image is required." });
    }

    if (!title || !description || !eventType || !startDate || !startTime || !endDate || !endTime || !venue) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    let ticketTiers;
    try {
        ticketTiers = JSON.parse(ticketTiersDataString);
        if (!Array.isArray(ticketTiers) || ticketTiers.length === 0) {
            throw new Error("Ticket tiers data is invalid or empty.");
        }
        for (const tier of ticketTiers) {
            if (!tier.tierName || typeof tier.tierName !== 'string' || tier.tierName.trim() === "")
                throw new Error("Invalid tier name.");
            if (isNaN(parseFloat(tier.price)) || parseFloat(tier.price) < 0)
                throw new Error(`Invalid price for tier ${tier.tierName}.`);
            if (isNaN(parseInt(tier.quantity)) || parseInt(tier.quantity) <= 0)
                throw new Error(`Invalid quantity for tier ${tier.tierName}. Must be a positive integer.`);
        }
    } catch (e) {
        return res.status(400).json({ message: `Invalid ticket tiers data: ${e.message}` });
    }

    // Parse and validate promo codes
    let promoCodes = [];
    if (promoCodesString) {
        try {
            promoCodes = JSON.parse(promoCodesString);
            if (!Array.isArray(promoCodes)) {
                throw new Error("Promo codes data must be an array.");
            }
            for (const promo of promoCodes) {
                if (!promo.code || typeof promo.code !== 'string' || promo.code.trim() === "") {
                    throw new Error("Invalid promo code.");
                }
                if (!promo.discountType || !['PERCENT', 'FIXED'].includes(promo.discountType)) {
                    throw new Error(`Invalid discount type for promo code ${promo.code}.`);
                }
                if (isNaN(parseFloat(promo.discountValue)) || parseFloat(promo.discountValue) <= 0) {
                    throw new Error(`Invalid discount value for promo code ${promo.code}.`);
                }
                if (promo.discountType === 'PERCENT' && parseFloat(promo.discountValue) > 100) {
                    throw new Error(`Percentage discount cannot exceed 100% for promo code ${promo.code}.`);
                }
                if (promo.usageLimit && (isNaN(parseInt(promo.usageLimit)) || parseInt(promo.usageLimit) <= 0)) {
                    throw new Error(`Invalid usage limit for promo code ${promo.code}.`);
                }
                if (promo.startDate && isNaN(new Date(promo.startDate).getTime())) {
                    throw new Error(`Invalid start date for promo code ${promo.code}.`);
                }
                if (promo.endDate && isNaN(new Date(promo.endDate).getTime())) {
                    throw new Error(`Invalid end date for promo code ${promo.endDate}.`);
                }
                if (promo.startDate && promo.endDate && new Date(promo.endDate) < new Date(promo.startDate)) {
                    throw new Error(`End date must be after start date for promo code ${promo.code}.`);
                }
            }
        } catch (e) {
            return res.status(400).json({ message: `Invalid promo codes data: ${e.message}` });
        }
    }

    // Parse seat assignments for seated venues
    let seatAssignments = {};
    if (seatAssignmentsString) {
        try {
            seatAssignments = JSON.parse(seatAssignmentsString);
            if (typeof seatAssignments !== 'object' || seatAssignments === null) {
                throw new Error("Seat assignments must be an object.");
            }
        } catch (e) {
            return res.status(400).json({ message: `Invalid seat assignments data: ${e.message}` });
        }
    }

    let startAtIso, endAtIso;
    try {
        startAtIso = new Date(`${startDate}T${startTime}`).toISOString();
        endAtIso = new Date(`${endDate}T${endTime}`).toISOString();
        if (new Date(endAtIso) <= new Date(startAtIso)) {
            return res.status(400).json({ message: "End date/time must be after start date/time." });
        }
    } catch (e) {
        return res.status(400).json({ message: "Invalid date or time format." });
    }

    const category = mapEventTypeToCategory(eventType);
    const venueId = parseInt(venue, 10);

    if (isNaN(venueId) || venueId <= 0) return res.status(400).json({ message: "Invalid Venue ID." });

    const basePriceForEvent = ticketTiers.length > 0 ? parseFloat(ticketTiers[0].price) : 0;

    const client = await getClient();
    try {
        await client.query('BEGIN');

        // Check if venue exists and get its seating type
        const venueCheckQuery = 'SELECT venue_id, is_seated FROM venues WHERE venue_id = $1';
        const venueCheckResult = await client.query(venueCheckQuery, [venueId]);
        if (venueCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Venue not found." });
        }
        const isSeatedVenue = venueCheckResult.rows[0].is_seated;

        const organizerCheckResult = await client.query('SELECT account_id FROM organizers WHERE account_id = $1', [parsedOrganizerAccountId]);
        if (organizerCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: `Organizer with ID ${parsedOrganizerAccountId} not found.` });
        }

        const heroImageUrl = `/uploads/${req.files[0].filename}`;
        const eventInsertQuery = `
            INSERT INTO events (
                organizer_account_id, venue_id, category, title, description, rules,
                start_at, end_at, status, base_price, hero_image_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING event_id, title, created_at, status;
        `;
        const eventInsertValues = [
            parsedOrganizerAccountId,
            venueId, category, title, description, rules || null,
            startAtIso, endAtIso, 'PUBLISHED', basePriceForEvent, heroImageUrl
        ];

        const eventResult = await client.query(eventInsertQuery, eventInsertValues);
        const newEventId = eventResult.rows[0].event_id;

        // Insert promo codes
        if (promoCodes.length > 0) {
            const promoInsertQuery = `
                INSERT INTO promo_codes (
                    event_id, code, discount_type, discount_value,
                    usage_limit, start_date, end_date, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING promo_code_id
            `;

            for (const promo of promoCodes) {
                await client.query(promoInsertQuery, [
                    newEventId,
                    promo.code.toUpperCase(),
                    promo.discountType,
                    parseFloat(promo.discountValue),
                    promo.usageLimit ? parseInt(promo.usageLimit) : null,
                    promo.startDate ? new Date(promo.startDate).toISOString().split('T')[0] : null,
                    promo.endDate ? new Date(promo.endDate).toISOString().split('T')[0] : null,
                    true
                ]);
            }
        }

        const imageInsertPromises = req.files.map(file => {
            const imageUrl = `/uploads/${file.filename}`;
            return client.query('INSERT INTO event_images (event_id, url, caption) VALUES ($1, $2, $3)',
                [newEventId, imageUrl, file.originalname]);
        });
        await Promise.all(imageInsertPromises);

        // Create a mapping of tier names to tier IDs for seat assignments
        const tierNameToIdMap = {};
        
        for (const tier of ticketTiers) {
            const tierInsertQuery = `
                INSERT INTO event_ticket_tiers (event_id, tier_name, price, quantity)
                VALUES ($1, $2, $3, $4)
                RETURNING tier_id;
            `;
            const tierResult = await client.query(tierInsertQuery, [
                newEventId,
                tier.tierName,
                parseFloat(tier.price),
                parseInt(tier.quantity)
            ]);
            const newTierId = tierResult.rows[0].tier_id;
            tierNameToIdMap[tier.tierName] = newTierId;

            if (!isSeatedVenue) {
                // For non-seated venues, create tickets without seat assignments
                const ticketInsertPromises = [];
                for (let i = 0; i < parseInt(tier.quantity); i++) {
                    ticketInsertPromises.push(
                        client.query(
                            `INSERT INTO tickets (event_id, tier_id, status) VALUES ($1, $2, 'AVAILABLE')`,
                            [newEventId, newTierId]
                        )
                    );
                }
                await Promise.all(ticketInsertPromises);
            }
        }

        // For seated venues, handle seat assignments
        if (isSeatedVenue) {
            if (Object.keys(seatAssignments).length > 0) {
                // Use organizer's specific seat assignments
                const seatAssignmentPromises = [];
                for (const [seatId, tierName] of Object.entries(seatAssignments)) {
                    const tierId = tierNameToIdMap[tierName];
                    if (tierId) {
                        seatAssignmentPromises.push(
                            client.query(
                                `INSERT INTO tickets (event_id, seat_id, tier_id, status) VALUES ($1, $2, $3, 'AVAILABLE')`,
                                [newEventId, parseInt(seatId), tierId]
                            )
                        );
                    }
                }
                await Promise.all(seatAssignmentPromises);
            } else {
                // Fallback: assign seats sequentially if no specific assignments provided
                for (const tier of ticketTiers) {
                    const tierId = tierNameToIdMap[tier.tierName];
                    const seatAssignmentQuery = `
                        INSERT INTO tickets (event_id, seat_id, tier_id, status)
                        SELECT $1, s.seat_id, $2, 'AVAILABLE'
                        FROM seats s
                        LEFT JOIN tickets t ON t.event_id = $1 AND t.seat_id = s.seat_id
                        WHERE s.venue_id = $3
                        AND t.ticket_id IS NULL
                        ORDER BY s.section, s.row_label, CAST(s.seat_number AS INT)
                        LIMIT $4;
                    `;
                    await client.query(seatAssignmentQuery, [
                        newEventId,
                        tierId,
                        venueId,
                        parseInt(tier.quantity)
                    ]);
                }
            }
        }

        await client.query('COMMIT');
        res.status(201).json({ message: "Event and tickets created successfully!", event: { event_id: newEventId } });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during event creation transaction:', error);
        if (error.code === '23503') {
            next({ status: 400, message: `Invalid reference (e.g., organizer or venue ID not found). Details: ${error.detail}` });
        } else if (error.code === '23505' && error.constraint === 'events_title_start_key') {
            next({ status: 409, message: "An event with this title and start time already exists."});
        } else if (error.constraint === 'event_ticket_tiers_event_id_tier_name_key') {
            next({ status: 409, message: "Duplicate tier name for this event."});
        } else if (error.constraint === 'promo_codes_code_key') {
            next({ status: 409, message: "A promo code with this code already exists."});
        } else {
            next(error);
        }
    } finally {
        client.release();
    }
};


export const getOrganizerEvents = async (req, res, next) => {
    // This route should be protected by your `checkAuth` middleware.
    const { organizerAccountId } = req.body;

    if (!organizerAccountId) {
        return res.status(400).json({ message: "Organizer Account ID is required in the request body." });
    }

    const parsedOrganizerAccountId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedOrganizerAccountId) || parsedOrganizerAccountId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer Account ID format in request body." });
    }

    const client = await getClient();
    try {
        const eventsQuery = `
            SELECT
                e.event_id, e.title, e.description, e.category, e.status,
                e.start_at, e.end_at, e.base_price, e.tickets_sold, e.hero_image_url,
                v.name AS venue_name, v.city AS venue_city, v.capacity AS venue_capacity
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            WHERE e.organizer_account_id = $1
            ORDER BY e.start_at DESC;
        `;
        const { rows } = await client.query(eventsQuery, [parsedOrganizerAccountId]);
        
        // Process image URLs for events
        const processedEvents = rows.map(event => ({
            ...event,
            hero_image_url: getImageUrl(event.hero_image_url)
        }));
        
        res.status(200).json(processedEvents);
    } catch (error) {
        console.error(`Error fetching events for organizer ${parsedOrganizerAccountId} via POST:`, error);
        next(error);
    } finally {
        if (client) {
            client.release();
        }
    }
};

export const updateEvent = async (req, res, next) => {
    console.log("UPDATE EVENT req.body:", JSON.stringify(req.body, null, 2)); // Log the received body
    console.log("UPDATE EVENT req.files:", req.files); // Log uploaded files
    const { eventId } = req.params;
    const parsedEventId = parseInt(eventId, 10);

    if (isNaN(parsedEventId)) {
        return res.status(400).json({ message: "Invalid Event ID." });
    }

    const {
        title, description, eventType,
        startDate, startTime, endDate, endTime,
        venue: venueIdStr, rules,
        organizerAccountId,
        ticketTiersData: ticketTiersDataString,
    } = req.body;

    if (!organizerAccountId) {
        return res.status(400).json({ message: "Organizer Account ID is required in the request body to perform an update." });
    }
    const parsedPerformingOrganizerId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedPerformingOrganizerId) || parsedPerformingOrganizerId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer Account ID format in request body." });
    }

    if (!title || !description || !eventType || !startDate || !startTime || !endDate || !endTime || !venueIdStr || !ticketTiersDataString) {
        return res.status(400).json({ message: "Missing required fields for update." });
    }
    let ticketTiers; try { ticketTiers = JSON.parse(ticketTiersDataString); /* + validation */ } catch (e) { /* error */ }
    let startAtIso, endAtIso;
    try {
        startAtIso = new Date(`${startDate}T${startTime}`).toISOString();
        endAtIso = new Date(`${endDate}T${endTime}`).toISOString();
        if (new Date(endAtIso) <= new Date(startAtIso)) {
            return res.status(400).json({ message: "End date/time must be after start date/time." });
        }
    } catch (e) {
        console.error("Date parsing error during update:", e);
        return res.status(400).json({ message: "Invalid date or time format provided for update." });
    }
    const category = mapEventTypeToCategory(eventType);
    const venueId = parseInt(venueIdStr, 10); // Parse venueIdStr to venueId
    if (isNaN(venueId) || venueId <= 0) { // Add validation for parsed venueId
        return res.status(400).json({ message: "Invalid Venue ID format." });
    }
    const basePriceForEvent = ticketTiers.length > 0 && ticketTiers[0].price !== undefined ? parseFloat(ticketTiers[0].price) : 0;

    const client = await getClient();
 /* error */    try {
        await client.query('BEGIN');

        const eventCheckQuery = 'SELECT organizer_account_id, hero_image_url FROM events WHERE event_id = $1';
        const eventCheckResult = await client.query(eventCheckQuery, [parsedEventId]);

        if (eventCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found." });
        }

        const eventOwnerId = eventCheckResult.rows[0].organizer_account_id;
        let currentHeroImageUrl = eventCheckResult.rows[0].hero_image_url;

        // 3. Handle Image Updates (Simplified: Delete all old images, then add new ones if provided)
        let newHeroImageUrl = currentHeroImageUrl;
        if (req.files && req.files.length > 0) {
            const oldImagesResult = await client.query('SELECT url FROM event_images WHERE event_id = $1', [parsedEventId]);
            for (const oldImage of oldImagesResult.rows) {
                if (oldImage.url) {
                    try {
                        const imagePath = path.join(projectRootDir, 'uploads', path.basename(oldImage.url));
                        await fs.unlink(imagePath);
                    } catch (fileError) { console.warn(`Could not delete old image file ${oldImage.url}: ${fileError.message}`); }
                }
            }
            await client.query('DELETE FROM event_images WHERE event_id = $1', [parsedEventId]);
            newHeroImageUrl = `/uploads/${req.files[0].filename}`;
            const imageInsertPromises = req.files.map(file => {
                const imageUrl = `/uploads/${file.filename}`;
                return client.query('INSERT INTO event_images (event_id, url, caption) VALUES ($1, $2, $3)',
                    [parsedEventId, imageUrl, file.originalname]);
            });
            await Promise.all(imageInsertPromises);
        }

        // 4. Update basic event fields in 'events' table
        const eventUpdateQuery = `
            UPDATE events SET
                title = $1, description = $2, category = $3, venue_id = $4, rules = $5,
                start_at = $6, end_at = $7, status = $8, base_price = $9, hero_image_url = $10, 
                updated_at = NOW()
            WHERE event_id = $11 AND organizer_account_id = $12; -- Ensure we only update if still owner
        `;
        const eventUpdateValues = [
            title, description, category, venueId, rules || null,
            startAtIso, endAtIso, 'PUBLISHED', basePriceForEvent, newHeroImageUrl,
            parsedEventId, eventOwnerId
        ];
        await client.query(eventUpdateQuery, eventUpdateValues);

        await client.query('DELETE FROM tickets WHERE event_id = $1', [parsedEventId]);
        await client.query('DELETE FROM event_ticket_tiers WHERE event_id = $1', [parsedEventId]);

        for (const tier of ticketTiers) {
            const tierResult = await client.query(
                `INSERT INTO event_ticket_tiers (event_id, tier_name, price, quantity, description)
                 VALUES ($1, $2, $3, $4, $5) RETURNING tier_id;`,
                [parsedEventId, tier.tierName, parseFloat(tier.price), parseInt(tier.quantity), tier.description || null]
            );
            const newTierId = tierResult.rows[0].tier_id;
            const ticketGenerationPromises = [];
            for (let i = 0; i < parseInt(tier.quantity); i++) {
                ticketGenerationPromises.push(
                    client.query(`INSERT INTO tickets (event_id, tier_id, status) VALUES ($1, $2, 'AVAILABLE')`,
                        [parsedEventId, newTierId])
                );
            }
            await Promise.all(ticketGenerationPromises);
        }

        await client.query('COMMIT');
        res.status(200).json({ message: "Event updated successfully", event_id: parsedEventId });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error updating event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) client.release();
    }
};

export const deleteEvent = async (req, res, next) => {
    const { eventId } = req.params;
    const parsedEventId = parseInt(eventId, 10);

    // Organizer ID performing the action, expected from the request body for consistency
    // with your specified pattern for createEvent/updateEvent.
    // For a DELETE, often the identity is purely from the token, but we'll follow your pattern.
    const { organizerAccountId } = req.body;

    if (isNaN(parsedEventId)) {
        return res.status(400).json({ message: "Valid Event ID is required in URL." });
    }
    if (!organizerAccountId) {
        return res.status(400).json({ message: "Organizer Account ID is required in the request body to perform a delete." });
    }
    const parsedPerformingOrganizerId = parseInt(organizerAccountId, 10);
    if (isNaN(parsedPerformingOrganizerId) || parsedPerformingOrganizerId <= 0) {
        return res.status(400).json({ message: "Invalid Organizer Account ID format in request body." });
    }


    const client = await getClient();
    try {
        await client.query('BEGIN');

        const eventCheckQuery = 'SELECT organizer_account_id, title FROM events WHERE event_id = $1';
        const eventCheckResult = await client.query(eventCheckQuery, [parsedEventId]);

        if (eventCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found." });
        }
        const eventOwnerId = eventCheckResult.rows[0].organizer_account_id;
        const eventTitle = eventCheckResult.rows[0].title;


        const oldImagesResult = await client.query('SELECT url FROM event_images WHERE event_id = $1', [parsedEventId]);
        for (const oldImage of oldImagesResult.rows) {
            if (oldImage.url) {
                try {
                    const imagePath = path.join(projectRootDir, 'uploads', path.basename(oldImage.url));
                    await fs.unlink(imagePath);
                } catch (fileError) { console.warn(`Could not delete image file ${oldImage.url} for event ${parsedEventId}: ${fileError.message}`); }
            }
        }

        const deleteEventQuery = 'DELETE FROM events WHERE event_id = $1 AND organizer_account_id = $2';
        const deleteResult = await client.query(deleteEventQuery, [parsedEventId, parsedPerformingOrganizerId]);

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: "Event not found or not owned by the specified organizer during delete." });
        }

        await client.query('COMMIT');
        res.status(200).json({ message: `Event "${eventTitle}" (ID: ${parsedEventId}) deleted successfully.` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error deleting event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) client.release();
    }
};

export const getEventDetailsById = async (req, res, next) => {
    const { eventId } = req.params;
    if (!eventId || isNaN(parseInt(eventId))) {
        return res.status(400).json({ message: "Valid Event ID is required." });
    }
    const parsedEventId = parseInt(eventId, 10);

    // This route could be public, or protected by checkAuth if only logged-in users can view
    // For now, let's make it public-facing, so no req.user check here unless desired.

    const client = await getClient();
    try {
        // Fetch main event data and venue info
        const eventQuery = `
            SELECT
                e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city, v.capacity as venue_capacity, v.is_seated as venue_is_seated,
                o.display_name as organizer_display_name, o.avatar_url as organizer_avatar_url
            FROM events e
            JOIN venues v ON e.venue_id = v.venue_id
            JOIN organizers o ON e.organizer_account_id = o.account_id
            WHERE e.event_id = $1;
        `;
        const eventResult = await client.query(eventQuery, [parsedEventId]);

        if (eventResult.rows.length === 0) {
            return res.status(404).json({ message: "Event not found." });
        }
        const eventDetails = eventResult.rows[0];

        // Fetch event images
        const imagesQuery = 'SELECT image_id, url, caption FROM event_images WHERE event_id = $1 ORDER BY image_id ASC';
        const imagesResult = await client.query(imagesQuery, [parsedEventId]);
        eventDetails.images = imagesResult.rows;

        // Fetch event ticket tiers
        const tiersQuery = 'SELECT tier_id, tier_name, price, quantity, description FROM event_ticket_tiers WHERE event_id = $1 ORDER BY price ASC, tier_name ASC';
        const tiersResult = await client.query(tiersQuery, [parsedEventId]);
        eventDetails.ticket_tiers = tiersResult.rows;

        res.status(200).json(eventDetails);

    } catch (error) {
        console.error(`Error fetching details for event ${parsedEventId}:`, error);
        next(error);
    } finally {
        if (client) client.release();
    }
}