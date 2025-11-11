import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking } from '@/types/event';
import { mockEvents } from './mockData';

export const generateTicketPDF = async (booking: Booking) => {
  const event = mockEvents.find(e => e.id === booking.eventId);
  
  if (!event) {
    throw new Error('Event not found');
  }

  // Create new PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Background and border
  pdf.setFillColor(240, 240, 240);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  
  pdf.setDrawColor(218, 165, 32); // Gold border
  pdf.setLineWidth(2);
  pdf.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Header - Event Name
  pdf.setFillColor(34, 139, 34); // Green background
  pdf.rect(15, 15, pageWidth - 30, 30, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('EVENTLINK GHANA', pageWidth / 2, 28, { align: 'center' });
  
  pdf.setFontSize(16);
  pdf.text('EVENT TICKET', pageWidth / 2, 38, { align: 'center' });

  // Confirmed Badge
  if (booking.status === 'confirmed') {
    pdf.setFillColor(34, 139, 34);
    pdf.roundedRect(pageWidth - 60, 50, 45, 12, 3, 3, 'F');
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('✓ CONFIRMED', pageWidth - 37.5, 58, { align: 'center' });
  }

  // Event Details Section
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(event.title, pageWidth / 2, 70, { align: 'center' });

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  
  let yPos = 85;
  const leftMargin = 25;
  const lineHeight = 8;

  // Event Information
  pdf.setFont('helvetica', 'bold');
  pdf.text('Date & Time:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${new Date(event.date).toLocaleDateString('en-GB')} at ${event.time}`, leftMargin + 35, yPos);
  
  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Venue:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(event.venue, leftMargin + 35, yPos);
  
  yPos += lineHeight;
  pdf.text(event.location, leftMargin + 35, yPos);

  // Separator
  yPos += 12;
  pdf.setDrawColor(218, 165, 32);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPos, pageWidth - 20, yPos);

  // Customer Details Section
  yPos += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 139, 34);
  pdf.text('TICKET HOLDER INFORMATION', pageWidth / 2, yPos, { align: 'center' });

  yPos += 10;
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  
  pdf.setFont('helvetica', 'bold');
  pdf.text('Name:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(booking.customerName, leftMargin + 35, yPos);
  
  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Phone:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(booking.customerPhone, leftMargin + 35, yPos);
  
  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Ticket Type:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(booking.ticketType || 'Regular', leftMargin + 35, yPos);
  
  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Quantity:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${booking.ticketQuantity} ticket(s)`, leftMargin + 35, yPos);
  
  yPos += lineHeight;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Total Amount:', leftMargin, yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${booking.currency} ${booking.totalAmount}`, leftMargin + 35, yPos);

  // Booking Code Section
  yPos += 15;
  pdf.setFillColor(255, 215, 0, 0.3);
  pdf.roundedRect(20, yPos - 5, pageWidth - 40, 20, 3, 3, 'F');
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BOOKING CODE:', pageWidth / 2, yPos + 3, { align: 'center' });
  pdf.setFontSize(16);
  pdf.setTextColor(218, 165, 32);
  pdf.text(booking.bookingCode, pageWidth / 2, yPos + 12, { align: 'center' });

  // Generate QR Code
  yPos += 30;
  try {
    const qrCodeData = await QRCode.toDataURL(booking.bookingCode, {
      width: 400,
      margin: 1,
    });
    
    const qrSize = 50;
    pdf.addImage(qrCodeData, 'PNG', (pageWidth - qrSize) / 2, yPos, qrSize, qrSize);
    yPos += qrSize + 10;
  } catch (error) {
    console.error('QR Code generation failed:', error);
  }

  // Separator
  pdf.setDrawColor(218, 165, 32);
  pdf.setLineWidth(0.5);
  pdf.line(20, yPos, pageWidth - 20, yPos);

  // Organizer Contact Section
  yPos += 8;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(34, 139, 34);
  pdf.text('ORGANIZER CONTACT', pageWidth / 2, yPos, { align: 'center' });

  yPos += 8;
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${event.organizerName}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  pdf.text(`Phone: ${event.organizerPhone}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 6;
  pdf.text('WhatsApp | Instagram | Facebook', pageWidth / 2, yPos, { align: 'center' });

  // Footer
  yPos = pageHeight - 25;
  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('This ticket is valid only when confirmed. Please present this ticket at the event venue.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  pdf.text(`Generated on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  pdf.save(`EventLink-Ticket-${booking.bookingCode}.pdf`);
};
