import { query, getClient } from "../utils/db.js";

export const getAllVenues = async (req, res, next) => {
    const client = await getClient();
    try {
        const { rows } = await client.query('SELECT venue_id, name, address, city, capacity, is_seated FROM venues ORDER BY name ASC');
        const venues = rows.map(v => ({
            id: v.venue_id,
            name: v.name,
            address: `${v.address}, ${v.city}`,
            capacity: v.capacity,
            isSeated: v.is_seated
        }));
        res.status(200).json(venues);
    } catch (error) {
        console.error('Error fetching venues:', error);
        next(error);
    } finally {
        client.release();
    }
};


export const getCities = async (_req, res) => {
    try {
      const { rows } = await query('SELECT city FROM venue_cities;');
      res.json(rows.map(r => r.city)); 
    } catch (e) { res.status(500).json({ error: e.message }); }
  };

export const getVenueSeats = async (req, res) => {
    try {
        const { venueId } = req.params;
        
        if (!venueId || isNaN(parseInt(venueId))) {
            return res.status(400).json({ error: 'Invalid venue ID' });
        }

        const venueIdInt = parseInt(venueId);

        const venueQuery = `
            SELECT venue_id, name, is_seated, capacity
            FROM venues
            WHERE venue_id = $1
        `;
        const { rows: venueRows } = await query(venueQuery, [venueIdInt]);
        
        if (venueRows.length === 0) {
            return res.status(404).json({ error: 'Venue not found' });
        }

        const venue = venueRows[0];

        if (!venue.is_seated) {
            return res.json({
                venue: {
                    venue_id: venue.venue_id,
                    name: venue.name,
                    is_seated: venue.is_seated,
                    capacity: venue.capacity
                },
                seat_layout: null,
                seat_ranges: null,
                message: 'This venue uses general admission (no assigned seats)'
            });
        }

        const seatsQuery = `
            SELECT 
                s.seat_id,
                s.section,
                s.row_label,
                s.seat_number
            FROM seats s
            WHERE s.venue_id = $1
            ORDER BY s.section, s.row_label, CAST(s.seat_number AS INT)
        `;
        
        const { rows: seatRows } = await query(seatsQuery, [venueIdInt]);

        // Get seat ranges for layout
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
        const { rows: seatRangeRows } = await query(seatRangeQuery, [venueIdInt]);

        // Build seat layout structure
        const seatLayout = {};
        seatRows.forEach(seat => {
            if (!seatLayout[seat.section]) {
                seatLayout[seat.section] = {};
            }
            if (!seatLayout[seat.section][seat.row_label]) {
                seatLayout[seat.section][seat.row_label] = [];
            }
            
            seatLayout[seat.section][seat.row_label].push({
                seat_id: seat.seat_id,
                seat_number: seat.seat_number,
                section: seat.section,
                row_label: seat.row_label
            });
        });

        // Build seat ranges structure
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

        const response = {
            venue: {
                venue_id: venue.venue_id,
                name: venue.name,
                is_seated: venue.is_seated,
                capacity: venue.capacity
            },
            seat_layout: seatLayout,
            seat_ranges: seatRanges,
            total_seats: seatRows.length
        };

        res.json(response);

    } catch (err) {
        console.error('Error fetching venue seats:', err);
        res.status(500).json({ error: 'Failed to fetch venue seats', details: err.message });
    }
};