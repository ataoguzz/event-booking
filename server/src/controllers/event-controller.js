/* controllers/events.js */
import { query, getClient } from '../utils/db.js';
import { calculateDiscount, applyPromoCode } from './promo-controller.js';

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
                e.avg_rating,
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
            avg_rating: event.avg_rating ? parseFloat(event.avg_rating) : null,
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