import { query } from '../utils/db.js';
import { generateTicketPDF } from '../utils/pdfGenerator.js';
import QRCode from 'qrcode';

export const getUserTickets = async (req, res) => {
    try {
        const { accountId } = req.user;

        const ticketsQuery = `
            SELECT 
                t.ticket_id,
                t.qr_token,
                t.guest_full_name,
                t.guest_email,
                t.price_at_purchase,
                t.status,
                t.created_at,
                e.event_id,
                e.title AS event_name,
                e.start_at,
                e.end_at,
                e.hero_image_url,
                v.name AS venue_name,
                v.city AS venue_city,
                ett.tier_name,
                s.section,
                s.row_label,
                s.seat_number,
                tx.tx_id,
                tx.created_at AS purchase_date
            FROM tickets t
            JOIN events e ON e.event_id = t.event_id
            JOIN venues v ON v.venue_id = e.venue_id
            JOIN event_ticket_tiers ett ON ett.tier_id = t.tier_id
            LEFT JOIN seats s ON s.seat_id = t.seat_id
            JOIN transactions tx ON tx.tx_id = t.tx_id
            WHERE t.attendee_account_id = $1
            ORDER BY e.start_at DESC, t.created_at DESC
        `;

        const { rows: tickets } = await query(ticketsQuery, [accountId]);

        const formattedTickets = tickets.map(ticket => {
            const isUpcoming = new Date(ticket.start_at) > new Date();
            const seatInfo = ticket.seat_number 
                ? `${ticket.section} ${ticket.row_label}-${ticket.seat_number}`
                : ticket.tier_name;

            return {
                id: ticket.ticket_id,
                qr_token: ticket.qr_token,
                eventId: ticket.event_id,
                eventName: ticket.event_name,
                date: ticket.start_at.toISOString().split('T')[0],
                time: ticket.start_at.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                }),
                endTime: ticket.end_at ? ticket.end_at.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: false 
                }) : null,
                venue: ticket.venue_name,
                location: ticket.venue_city,
                seat: seatInfo,
                tierName: ticket.tier_name,
                price: ticket.price_at_purchase ? parseFloat(ticket.price_at_purchase) : 0,
                purchaseDate: ticket.purchase_date.toISOString().split('T')[0],
                status: isUpcoming ? 'upcoming' : 'past',
                ticketStatus: ticket.status,
                guestName: ticket.guest_full_name,
                guestEmail: ticket.guest_email,
                imageUrl: ticket.hero_image_url || `https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1740&q=80`,
                transactionId: ticket.tx_id
            };
        });

        res.json(formattedTickets);

    } catch (err) {
        console.error('Error fetching user tickets:', err);
        res.status(500).json({ error: 'Failed to fetch tickets', details: err.message });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { accountId } = req.user;

        const ticketQuery = `
            SELECT 
                t.ticket_id,
                t.qr_token,
                t.guest_full_name,
                t.guest_email,
                t.price_at_purchase,
                t.status,
                t.created_at,
                e.event_id,
                e.title AS event_name,
                e.description AS event_description,
                e.start_at,
                e.end_at,
                e.hero_image_url,
                v.name AS venue_name,
                v.address AS venue_address,
                v.city AS venue_city,
                ett.tier_name,
                s.section,
                s.row_label,
                s.seat_number,
                tx.tx_id,
                tx.created_at AS purchase_date,
                o.display_name AS organizer_name
            FROM tickets t
            JOIN events e ON e.event_id = t.event_id
            JOIN venues v ON v.venue_id = e.venue_id
            JOIN event_ticket_tiers ett ON ett.tier_id = t.tier_id
            LEFT JOIN seats s ON s.seat_id = t.seat_id
            JOIN transactions tx ON tx.tx_id = t.tx_id
            JOIN organizers o ON o.account_id = e.organizer_account_id
            WHERE t.ticket_id = $1 AND t.attendee_account_id = $2
        `;

        const { rows: tickets } = await query(ticketQuery, [ticketId, accountId]);

        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = tickets[0];
        const seatInfo = ticket.seat_number 
            ? `${ticket.section} ${ticket.row_label}-${ticket.seat_number}`
            : ticket.tier_name;

        const formattedTicket = {
            id: ticket.ticket_id,
            qr_token: ticket.qr_token,
            eventId: ticket.event_id,
            eventName: ticket.event_name,
            eventDescription: ticket.event_description,
            date: ticket.start_at,
            endDate: ticket.end_at,
            venue: ticket.venue_name,
            venueAddress: ticket.venue_address,
            location: ticket.venue_city,
            seat: seatInfo,
            tierName: ticket.tier_name,
            price: ticket.price_at_purchase ? parseFloat(ticket.price_at_purchase) : 0,
            purchaseDate: ticket.purchase_date,
            ticketStatus: ticket.status,
            guestName: ticket.guest_full_name,
            guestEmail: ticket.guest_email,
            organizerName: ticket.organizer_name,
            transactionId: ticket.tx_id
        };

        res.json(formattedTicket);

    } catch (err) {
        console.error('Error fetching ticket:', err);
        res.status(500).json({ error: 'Failed to fetch ticket', details: err.message });
    }
};

export const downloadTicketPDF = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { accountId } = req.user;

        // Get ticket details
        const ticketQuery = `
            SELECT 
                t.ticket_id,
                t.qr_token,
                t.guest_full_name,
                t.guest_email,
                t.price_at_purchase,
                t.status,
                t.created_at,
                e.event_id,
                e.title AS event_name,
                e.description AS event_description,
                e.start_at,
                e.end_at,
                v.name AS venue_name,
                v.address AS venue_address,
                v.city AS venue_city,
                ett.tier_name,
                s.section,
                s.row_label,
                s.seat_number,
                o.display_name AS organizer_name
            FROM tickets t
            JOIN events e ON e.event_id = t.event_id
            JOIN venues v ON v.venue_id = e.venue_id
            JOIN event_ticket_tiers ett ON ett.tier_id = t.tier_id
            LEFT JOIN seats s ON s.seat_id = t.seat_id
            JOIN organizers o ON o.account_id = e.organizer_account_id
            WHERE t.ticket_id = $1 AND t.attendee_account_id = $2
        `;

        const { rows: tickets } = await query(ticketQuery, [ticketId, accountId]);

        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = tickets[0];

        // Generate PDF using the utility function
        const pdfBuffer = await generateTicketPDF(ticket);

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.ticket_id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Send the PDF buffer
        res.send(pdfBuffer);

    } catch (err) {
        console.error('Error generating ticket PDF:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
        }
    }
}; 