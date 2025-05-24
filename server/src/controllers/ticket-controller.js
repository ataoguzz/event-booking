import { query } from '../utils/db.js';
import PDFDocument from 'pdfkit';
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

        // Format tickets for frontend
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
                eventDescription: ticket.event_description,
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
                venueAddress: ticket.venue_address,
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

        // Generate QR code data with verification info
        const qrData = {
            ticket_id: ticket.ticket_id,
            event_id: ticket.event_id,
            qr_token: ticket.qr_token,
            guest_name: ticket.guest_full_name,
            seat: ticket.seat_number ? `${ticket.section}${ticket.row_label}${ticket.seat_number}` : ticket.tier_name,
            date: ticket.start_at.toISOString().split('T')[0],
            verification_hash: Buffer.from(`${ticket.ticket_id}-${ticket.qr_token}-${ticket.event_id}`).toString('base64')
        };

        // Generate QR code as buffer directly
        let qrCodeBuffer;
        try {
            qrCodeBuffer = await QRCode.toBuffer(JSON.stringify(qrData), {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                type: 'png'
            });
        } catch (qrError) {
            console.error('QR Code generation failed:', qrError);
            // Continue without QR code if generation fails
            qrCodeBuffer = null;
        }

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${ticket.ticket_id}.pdf"`);
        
        // Create PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Pipe PDF to response
        doc.pipe(res);

        // PDF Header
        doc.fontSize(24).fillColor('#2563eb').text('EVENT TICKET', { align: 'center' });
        doc.moveDown(0.5);
        
        // Event Title
        doc.fontSize(20).fillColor('#000').text(ticket.event_name, { align: 'center' });
        doc.moveDown(0.3);
        
        // Organizer
        doc.fontSize(12).fillColor('#666').text(`Presented by ${ticket.organizer_name}`, { align: 'center' });
        doc.moveDown(1);

        // Ticket ID
        doc.fontSize(10).fillColor('#999').text(`Ticket ID: ${ticket.ticket_id}`, { align: 'right' });
        doc.moveDown(0.5);

        // Main content in two columns
        const leftColumnX = 50;
        const rightColumnX = 300;
        let currentY = doc.y;

        // Left Column - Event Details
        doc.fontSize(14).fillColor('#000').text('EVENT DETAILS', leftColumnX, currentY);
        currentY += 25;

        doc.fontSize(11).fillColor('#333');
        doc.text('Date:', leftColumnX, currentY);
        doc.text(ticket.start_at.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }), leftColumnX + 60, currentY);
        currentY += 20;

        doc.text('Time:', leftColumnX, currentY);
        doc.text(ticket.start_at.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }), leftColumnX + 60, currentY);
        currentY += 20;

        doc.text('Venue:', leftColumnX, currentY);
        doc.text(ticket.venue_name, leftColumnX + 60, currentY);
        currentY += 20;

        doc.text('Address:', leftColumnX, currentY);
        doc.text(`${ticket.venue_address}, ${ticket.venue_city}`, leftColumnX + 60, currentY);
        currentY += 30;

        // Ticket Details
        doc.fontSize(14).fillColor('#000').text('TICKET DETAILS', leftColumnX, currentY);
        currentY += 25;

        doc.fontSize(11).fillColor('#333');
        doc.text('Guest:', leftColumnX, currentY);
        doc.text(ticket.guest_full_name, leftColumnX + 60, currentY);
        currentY += 20;

        if (ticket.guest_email) {
            doc.text('Email:', leftColumnX, currentY);
            doc.text(ticket.guest_email, leftColumnX + 60, currentY);
            currentY += 20;
        }

        doc.text('Seat/Tier:', leftColumnX, currentY);
        const seatInfo = ticket.seat_number 
            ? `${ticket.section} ${ticket.row_label}-${ticket.seat_number}`
            : ticket.tier_name;
        doc.text(seatInfo, leftColumnX + 60, currentY);
        currentY += 20;

        doc.text('Price:', leftColumnX, currentY);
        const price = ticket.price_at_purchase ? parseFloat(ticket.price_at_purchase) : 0;
        doc.text(`$${price.toFixed(2)}`, leftColumnX + 60, currentY);

        // Right Column - QR Code
        const qrY = doc.y - 150;
        doc.fontSize(14).fillColor('#000').text('SCAN FOR ENTRY', rightColumnX, qrY);
        
        // Add QR code image from buffer if available
        if (qrCodeBuffer) {
            try {
                doc.image(qrCodeBuffer, rightColumnX, qrY + 25, { width: 150, height: 150 });
            } catch (imageError) {
                console.error('Failed to add QR code to PDF:', imageError);
                // Add placeholder text if QR code fails
                doc.fontSize(10).fillColor('#999').text('QR Code unavailable', rightColumnX, qrY + 75);
            }
        } else {
            // Add placeholder text if no QR code
            doc.fontSize(10).fillColor('#999').text('QR Code unavailable', rightColumnX, qrY + 75);
        }

        // Footer
        doc.moveDown(3);
        currentY = doc.y + 100;
        
        // Important notices
        doc.fontSize(10).fillColor('#666');
        doc.text('IMPORTANT NOTICES:', 50, currentY, { align: 'left' });
        currentY += 15;
        
        doc.fontSize(9);
        doc.text('• This ticket is non-transferable and must be presented for entry', 50, currentY);
        currentY += 12;
        doc.text('• Please arrive 30 minutes before the event starts', 50, currentY);
        currentY += 12;
        doc.text('• Valid photo ID may be required for entry', 50, currentY);
        currentY += 12;
        doc.text('• No refunds or exchanges unless event is cancelled', 50, currentY);
        
        // Border
        doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#ddd');

        // End PDF - this should be the last operation
        doc.end();

    } catch (err) {
        console.error('Error generating ticket PDF:', err);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Failed to generate PDF', details: err.message });
        }
    }
}; 