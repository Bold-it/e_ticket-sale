import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, MessageCircle, Copy, Calendar, MapPin, Ticket } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { mockEvents } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

const BookingConfirmation = () => {
  const { bookingCode } = useParams();
  const { toast } = useToast();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('booking_code', bookingCode)
        .single();

      if (error) {
        console.error('Error fetching booking:', error);
      } else {
        setBooking(data);
      }
      setLoading(false);
    };

    fetchBooking();
  }, [bookingCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Booking not found</h1>
        </div>
      </div>
    );
  }

  // Get event details from mockData
  const event = mockEvents.find((e: any) => e.id === booking.event_id);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.booking_code);
    toast({
      title: "Copied!",
      description: "Booking code copied to clipboard",
    });
  };

  const handleWhatsAppContact = () => {
    if (!event) return;
    
    const message = encodeURIComponent(
      `Hi, I want to book ${booking.ticket_quantity} ${booking.ticket_type || 'Regular'} ticket(s) for ${booking.event_title}. My booking code is ${booking.booking_code}.`
    );
    
    window.open(`https://wa.me/${event.organizerPhone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12">
        <div className="container max-w-3xl">
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-secondary/10 mb-4">
              <CheckCircle className="h-10 w-10 text-secondary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Booking Created!</h1>
            <p className="text-lg text-muted-foreground">
              Your booking has been successfully created. Follow the steps below to complete your payment.
            </p>
          </div>

          <Card className="mb-6 bg-gradient-card border-border shadow-card">
            <CardHeader>
              <CardTitle className="text-center">Your Booking Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <code className="text-2xl font-bold text-primary">{booking.booking_code}</code>
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <Badge variant="outline" className={
                  booking.status === 'confirmed' 
                    ? "text-green-600 border-green-600" 
                    : "text-yellow-600 border-yellow-600"
                }>
                  {booking.status === 'confirmed' ? 'Payment Confirmed' : 'Payment Pending'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6 bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-semibold text-foreground">{booking.event_title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-semibold text-foreground">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-semibold text-foreground">{booking.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-semibold text-foreground">{booking.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Type</p>
                  <p className="font-semibold text-foreground">{booking.ticket_type || 'Regular'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Number of Tickets</p>
                  <p className="font-semibold text-foreground">{booking.ticket_quantity}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-primary text-xl">{booking.currency} {booking.total_amount}</p>
                </div>
              </div>

              {event && (
                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-semibold text-foreground">
                        {new Date(event.date).toLocaleDateString('en-GB')} at {event.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-secondary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Venue</p>
                      <p className="font-semibold text-foreground">{event.venue}, {event.location}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Contact the Event Organizer</p>
                    <p className="text-sm text-muted-foreground">
                      Click the button below to message the organizer on WhatsApp with your booking details.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Make Payment</p>
                    <p className="text-sm text-muted-foreground">
                      The organizer will provide payment instructions via WhatsApp.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Receive Your Ticket</p>
                    <p className="text-sm text-muted-foreground">
                      After payment confirmation, your ticket will be sent to you.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                onClick={handleWhatsAppContact}
                className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white" 
                size="lg"
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Contact Organizer on WhatsApp
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Save your booking code: <strong>{booking.booking_code}</strong>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default BookingConfirmation;
