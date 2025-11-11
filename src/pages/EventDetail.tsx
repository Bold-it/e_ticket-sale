import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { mockEvents } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Ticket, User, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const event = mockEvents.find(e => e.id === id);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    ticketType: "Single",
    quantity: 1,
  });

  // Ticket pricing
  const ticketPrices: { [key: string]: number } = {
    Single: 30,
    Double: 55,
    VIP: 65,
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground">Event not found</h1>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(event.date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const ticketPrice = ticketPrices[formData.ticketType] || event.price;
  const totalAmount = ticketPrice * formData.quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address (e.g., name@example.com)",
        variant: "destructive",
      });
      return;
    }
    
    // Generate unique booking code
    const bookingCode = `EVT-${Date.now().toString(36).toUpperCase()}`;
    
    // Store booking in database
    const booking = {
      booking_code: bookingCode,
      event_id: event.id,
      event_title: event.title,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      ticket_type: formData.ticketType,
      ticket_quantity: formData.quantity,
      total_amount: totalAmount,
      currency: event.currency,
      status: 'pending',
      payment_confirmed: false,
    };

    const { error } = await supabase
      .from('bookings')
      .insert([booking]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create booking. Please try again.",
        variant: "destructive",
      });
      console.error('Booking error:', error);
      return;
    }

    toast({
      title: "Booking Created!",
      description: `Your booking code is ${bookingCode}`,
    });

    navigate(`/booking-confirmation/${bookingCode}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Event Details */}
            <div className="space-y-6">
              <div className="relative h-[400px] rounded-xl overflow-hidden">
                <img 
                  src={event.imageUrl} 
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
                {event.featured && (
                  <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <Badge className="mb-2">{event.category}</Badge>
                  <h1 className="text-4xl font-bold text-foreground">{event.title}</h1>
                </div>
                
                <p className="text-lg text-muted-foreground">{event.description}</p>
                
                <Card className="bg-gradient-card border-border">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{formattedDate}</p>
                        <p className="text-sm text-muted-foreground">{event.time}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-secondary mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{event.venue}</p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Ticket className="h-5 w-5 text-accent mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{event.availableTickets} tickets available</p>
                        <p className="text-sm text-muted-foreground">Out of {event.totalTickets} total</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <User className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="font-semibold text-foreground">{event.organizerName}</p>
                        <p className="text-sm text-muted-foreground">Event Organizer</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Booking Form */}
            <div>
              <Card className="sticky top-20 bg-gradient-card border-border shadow-card">
                <CardHeader>
                  <CardTitle className="text-2xl">Book Your Tickets</CardTitle>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Ticket Prices</p>
                    <div className="text-sm space-y-1">
                      <p><span className="font-semibold">Single:</span> {event.currency} 30</p>
                      <p><span className="font-semibold">Double:</span> {event.currency} 55</p>
                      <p><span className="font-semibold">VIP:</span> {event.currency} 65</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+233 XXX XXX XXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="ticketType">Ticket Type *</Label>
                      <Select value={formData.ticketType} onValueChange={(value) => setFormData({ ...formData, ticketType: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ticket type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Single">Single - GHS 30</SelectItem>
                          <SelectItem value="Double">Double - GHS 55</SelectItem>
                          <SelectItem value="VIP">VIP - GHS 65</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Number of Tickets *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        max={event.availableTickets}
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium text-foreground">{event.currency} {totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-foreground">Total</span>
                        <span className="text-primary">{event.currency} {totalAmount}</span>
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-gradient-hero hover:opacity-90 transition-opacity" size="lg">
                      <Ticket className="mr-2 h-5 w-5" />
                      Get Booking Code
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      After booking, you'll receive a unique code. Contact the organizer via WhatsApp to complete payment.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default EventDetail;
