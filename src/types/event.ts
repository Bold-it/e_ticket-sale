export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  category: string;
  price: number;
  currency: string;
  availableTickets: number;
  totalTickets: number;
  imageUrl: string;
  organizerName: string;
  organizerPhone: string;
  featured?: boolean;
}

export interface Booking {
  id: string;
  bookingCode: string;
  eventId: string;
  eventTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketType: string;
  ticketQuantity: number;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  paymentConfirmed?: boolean;
}
