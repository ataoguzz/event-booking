import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export const generateTicketPDF = async (ticketData) => {
    const {
        ticket_id,
        qr_token,
        guest_full_name,
        guest_email,
        price_at_purchase,
        event_name,
        start_at,
        end_at,
        venue_name,
        venue_address,
        venue_city,
        tier_name,
        section,
        row_label,
        seat_number,
        organizer_name
    } = ticketData;

    try {
        const qrData = {
            ticket_id: ticket_id,
            qr_token: qr_token,
            guest_name: guest_full_name,
            seat: seat_number ? `${section}${row_label}${seat_number}` : tier_name,
            date: new Date(start_at).toISOString().split('T')[0],
            verification_hash: Buffer.from(`${ticket_id}-${qr_token}`).toString('base64')
        };

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
            qrCodeBuffer = null;
        }

        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        
        return new Promise((resolve, reject) => {
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });

            doc.on('error', reject);

            doc.fontSize(24).fillColor('#2563eb').text('EVENT TICKET', { align: 'center' });
            doc.moveDown(0.5);
            
            doc.fontSize(20).fillColor('#000').text(event_name, { align: 'center' });
            doc.moveDown(0.3);
            
            doc.fontSize(12).fillColor('#666').text(`Presented by ${organizer_name}`, { align: 'center' });
            doc.moveDown(1);

            doc.fontSize(10).fillColor('#999').text(`Ticket ID: ${ticket_id}`, { align: 'right' });
            doc.moveDown(0.5);

            const leftColumnX = 50;
            const rightColumnX = 300;
            let currentY = doc.y;
            doc.fontSize(14).fillColor('#000').text('EVENT DETAILS', leftColumnX, currentY);
            currentY += 25;

            doc.fontSize(11).fillColor('#333');
            doc.text('Date:', leftColumnX, currentY);
            doc.text(new Date(start_at).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }), leftColumnX + 60, currentY);
            currentY += 20;

            doc.text('Time:', leftColumnX, currentY);
            doc.text(new Date(start_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }), leftColumnX + 60, currentY);
            currentY += 20;

            doc.text('Venue:', leftColumnX, currentY);
            doc.text(venue_name, leftColumnX + 60, currentY);
            currentY += 20;

            doc.text('Address:', leftColumnX, currentY);
            doc.text(`${venue_address}, ${venue_city}`, leftColumnX + 60, currentY);
            currentY += 30;

            doc.fontSize(14).fillColor('#000').text('TICKET DETAILS', leftColumnX, currentY);
            currentY += 25;

            doc.fontSize(11).fillColor('#333');
            doc.text('Guest:', leftColumnX, currentY);
            doc.text(guest_full_name, leftColumnX + 60, currentY);
            currentY += 20;

            if (guest_email) {
                doc.text('Email:', leftColumnX, currentY);
                doc.text(guest_email, leftColumnX + 60, currentY);
                currentY += 20;
            }

            doc.text('Seat/Tier:', leftColumnX, currentY);
            const seatInfo = seat_number 
                ? `${section} ${row_label}-${seat_number}`
                : tier_name;
            doc.text(seatInfo, leftColumnX + 60, currentY);
            currentY += 20;

            doc.text('Price:', leftColumnX, currentY);
            const price = price_at_purchase ? parseFloat(price_at_purchase) : 0;
            doc.text(`$${price.toFixed(2)}`, leftColumnX + 60, currentY);

            const qrY = doc.y - 150;
            doc.fontSize(14).fillColor('#000').text('SCAN FOR ENTRY', rightColumnX, qrY);
            
            if (qrCodeBuffer) {
                try {
                    doc.image(qrCodeBuffer, rightColumnX, qrY + 25, { width: 150, height: 150 });
                } catch (imageError) {
                    console.error('Failed to add QR code to PDF:', imageError);
                    doc.fontSize(10).fillColor('#999').text('QR Code unavailable', rightColumnX, qrY + 75);
                }
            } else {
                doc.fontSize(10).fillColor('#999').text('QR Code unavailable', rightColumnX, qrY + 75);
            }

            doc.moveDown(3);
            currentY = doc.y + 100;
            
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
            
            doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60).stroke('#ddd');
            doc.end();
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}; 