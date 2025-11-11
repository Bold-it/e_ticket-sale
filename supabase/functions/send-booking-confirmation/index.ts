import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";
import jsPDF from "https://esm.sh/jspdf@2.5.2";
import QRCode from "https://esm.sh/qrcode@1.5.4";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "BolTech <onboarding@resend.dev>";
const RESEND_REPLY_TO = Deno.env.get("RESEND_REPLY_TO_EMAIL") || undefined;
const resend = new Resend(RESEND_API_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingConfirmationRequest {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventVenue: string;
  eventLocation: string;
  ticketType: string;
  ticketQuantity: number;
  totalAmount: number;
  currency: string;
  organizerName: string;
  organizerPhone: string;
}

async function generateTicketPDF(booking: BookingConfirmationRequest): Promise<Uint8Array> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(250, 250, 250);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Border
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Header
  doc.setFillColor(20, 83, 45);
  doc.rect(10, 10, pageWidth - 20, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(booking.organizerName, pageWidth / 2, 25, { align: 'center' });
  doc.setFontSize(16);
  doc.text('EVENT TICKET', pageWidth / 2, 38, { align: 'center' });

  // Confirmed Badge
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(pageWidth - 70, 55, 55, 15, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ CONFIRMED', pageWidth - 42.5, 64, { align: 'center' });

  // Event Details
  doc.setTextColor(20, 83, 45);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Event Details', 20, 80);
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const eventDetails = [
    ['Event:', booking.eventTitle],
    ['Date:', booking.eventDate],
    ['Time:', booking.eventTime],
    ['Venue:', booking.eventVenue],
    ['Location:', booking.eventLocation],
  ];

  let yPos = 90;
  eventDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 50, yPos);
    yPos += 8;
  });

  // Customer Details
  doc.setTextColor(20, 83, 45);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', 20, yPos + 10);
  
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const customerDetails = [
    ['Name:', booking.customerName],
    ['Phone:', booking.customerPhone],
    ['Ticket Type:', booking.ticketType],
    ['Quantity:', booking.ticketQuantity.toString()],
    ['Total Amount:', `${booking.currency} ${booking.totalAmount.toFixed(2)}`],
  ];

  yPos += 20;
  customerDetails.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(value, 50, yPos);
    yPos += 8;
  });

  // Booking Code
  doc.setFillColor(218, 165, 32);
  doc.rect(15, yPos + 5, pageWidth - 30, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING CODE', pageWidth / 2, yPos + 14, { align: 'center' });
  doc.setFontSize(16);
  doc.text(booking.bookingCode, pageWidth / 2, yPos + 24, { align: 'center' });

  // QR Code - Generate as text/base64 for server environment
  try {
    // Generate QR code as data URL string (works in Deno without canvas)
    const qrCodeDataUrl = await QRCode.toDataURL(booking.bookingCode, {
      type: 'image/png',
      width: 120,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#145330',
        light: '#ffffff',
      },
    });
    
    doc.addImage(qrCodeDataUrl, 'PNG', pageWidth / 2 - 30, yPos + 35, 60, 60);
    console.log('QR code generated successfully');
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Add text fallback if QR fails
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Scan booking code above at venue', pageWidth / 2, yPos + 65, { align: 'center' });
  }

  // Contact Info
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('For inquiries, contact:', 20, yPos + 110);
  doc.setFont('helvetica', 'bold');
  doc.text(`WhatsApp: ${booking.organizerPhone}`, 20, yPos + 118);

  // Footer
  doc.setDrawColor(218, 165, 32);
  doc.setLineWidth(0.5);
  doc.line(15, pageHeight - 30, pageWidth - 15, pageHeight - 30);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This is your official event ticket. Please present this at the venue.', pageWidth / 2, pageHeight - 22, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

  return doc.output('arraybuffer');
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY env variable");
      return new Response(JSON.stringify({ success: false, error: "Missing RESEND_API_KEY" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const booking: BookingConfirmationRequest = await req.json();
    console.log("Generating ticket PDF for booking:", booking.bookingCode);

    // Generate PDF ticket
    const pdfBuffer = await generateTicketPDF(booking);
    const pdfBase64 = base64Encode(new Uint8Array(pdfBuffer));

    console.log("Sending email to:", booking.customerEmail);

    const html = `<!DOCTYPE html><html><body>
      <div class="container">
        <div class="header">
          <h1>🎉 Booking Confirmed!</h1>
          <p>Your ticket for ${booking.eventTitle}</p>
        </div>
        <div class="content">
          <p>Dear ${booking.customerName},</p>
          <p>Great news! Your booking has been confirmed and payment received. Your ticket is attached to this email.</p>
          
          <div class="booking-code">
            Booking Code: ${booking.bookingCode}
          </div>
          
          <div class="details">
            <h3 style="color: #145330; margin-top: 0;">Event Details</h3>
            <div class="detail-row">
              <span class="detail-label">Event:</span> ${booking.eventTitle}
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span> ${booking.eventDate}
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span> ${booking.eventTime}
            </div>
            <div class="detail-row">
              <span class="detail-label">Venue:</span> ${booking.eventVenue}
            </div>
            <div class="detail-row">
              <span class="detail-label">Location:</span> ${booking.eventLocation}
            </div>
          </div>
          
          <div class="details">
            <h3 style="color: #145330; margin-top: 0;">Ticket Information</h3>
            <div class="detail-row">
              <span class="detail-label">Ticket Type:</span> ${booking.ticketType}
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantity:</span> ${booking.ticketQuantity}
            </div>
            <div class="detail-row">
              <span class="detail-label">Total Paid:</span> ${booking.currency} ${booking.totalAmount.toFixed(2)}
            </div>
          </div>
          
          <p><strong>Important:</strong></p>
          <ul>
            <li>Please download and save your ticket PDF attached to this email</li>
            <li>Present your ticket (printed or on mobile) at the venue entrance</li>
            <li>Your booking code is: <strong>${booking.bookingCode}</strong></li>
          </ul>
          
          <p>If you have any questions, contact us on WhatsApp:</p>
          <a href="https://wa.me/${booking.organizerPhone.replace(/\D/g, '')}" class="button">
            💬 Contact Organizer
          </a>
          
          <div class="footer">
            <p>Thank you for booking with EventLink Ghana!</p>
            <p>See you at the event! 🎊</p>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
    let emailResponse;
    try {
      emailResponse = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [booking.customerEmail],
        reply_to: RESEND_REPLY_TO,
        subject: `✅ Booking Confirmed - ${booking.eventTitle}`,
        html,
        attachments: [
          {
            filename: `ticket-${booking.bookingCode}.pdf`,
            content: pdfBase64,
          },
        ],
      });
    } catch (sendErr) {
      console.error("Primary email send failed, retrying without attachment:", sendErr);
      emailResponse = await resend.emails.send({
        from: RESEND_FROM_EMAIL,
        to: [booking.customerEmail],
        reply_to: RESEND_REPLY_TO,
        subject: `✅ Booking Confirmed - ${booking.eventTitle}`,
        html,
      });
    }

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({
      success: true,
      message: "Booking confirmation email sent successfully",
      emailId: emailResponse.data?.id,
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-booking-confirmation function:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Failed to send confirmation email" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
