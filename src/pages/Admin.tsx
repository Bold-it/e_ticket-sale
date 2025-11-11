import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search, Ticket, Download, LogOut, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTicketPDF } from "@/lib/pdfGenerator";
import { mockEvents } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Admin = () => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and admin role
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/admin-login');
        return;
      }

      // Check if user has admin role
      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .single();

      if (error || !roleData) {
        toast({
          title: "Access Denied",
          description: "Admin privileges required",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate('/admin-login');
        return;
      }

      loadBookings();
    };

    checkAdminAccess();
  }, [navigate, toast]);

  const loadBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
      toast({
        title: "Error",
        description: "Failed to load bookings",
        variant: "destructive",
      });
    } else {
      setBookings(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin-login');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const updateBookingStatus = async (bookingCode: string, status: 'confirmed' | 'cancelled') => {
    const { error } = await supabase
      .from('bookings')
      .update({ 
        status, 
        payment_confirmed: status === 'confirmed' 
      })
      .eq('booking_code', bookingCode);

    if (error) {
      console.error('Error updating booking:', error);
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive",
      });
      return;
    }

    // Reload bookings
    loadBookings();
    
    if (status === 'confirmed') {
      // Send email notification
      const booking = bookings.find(b => b.booking_code === bookingCode);
      if (booking) {
        // Find event details
        const event = mockEvents.find(e => e.id === booking.event_id);
        
        try {
          const { error: emailError } = await supabase.functions.invoke('send-booking-confirmation', {
            body: {
              bookingCode: booking.booking_code,
              customerName: booking.customer_name,
              customerEmail: booking.customer_email,
              customerPhone: booking.customer_phone,
              eventTitle: booking.event_title,
              eventDate: event?.date || new Date(booking.created_at).toLocaleDateString(),
              eventTime: event?.time || '7:00 PM',
              eventVenue: event?.venue || 'Event Venue',
              eventLocation: event?.location || 'Accra, Ghana',
              ticketType: booking.ticket_type || 'Regular',
              ticketQuantity: booking.ticket_quantity,
              totalAmount: booking.total_amount,
              currency: booking.currency,
              organizerName: event?.organizerName || 'BolTech',
              organizerPhone: event?.organizerPhone || '+233240819270',
            },
          });

          if (!emailError) {
            toast({
              title: "✓ Payment Confirmed & Email Sent!",
              description: `Booking ${bookingCode} confirmed. Confirmation email with ticket PDF sent to ${booking.customer_email}`,
            });
          } else {
            console.error('Email error:', emailError);
            toast({
              title: "✓ Payment Confirmed",
              description: `Booking ${bookingCode} confirmed, but email could not be sent`,
              variant: "default",
            });
          }
        } catch (error) {
          console.error('Email sending error:', error);
          toast({
            title: "✓ Payment Confirmed",
            description: `Booking ${bookingCode} confirmed, but email could not be sent`,
            variant: "default",
          });
        }
      }
    } else {
      toast({
        title: "✗ Booking Cancelled",
        description: `Booking ${bookingCode} has been cancelled`,
        variant: "destructive",
      });
    }
  };

  const handleGenerateTicket = async (booking: any) => {
    try {
      // Convert database format to expected format
      const bookingForPDF = {
        ...booking,
        bookingCode: booking.booking_code,
        eventId: booking.event_id,
        eventTitle: booking.event_title,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        ticketType: booking.ticket_type,
        ticketQuantity: booking.ticket_quantity,
        totalAmount: booking.total_amount,
        paymentConfirmed: booking.payment_confirmed,
        createdAt: booking.created_at,
      };
      
      await generateTicketPDF(bookingForPDF);
      toast({
        title: "Ticket Generated",
        description: `PDF ticket for ${booking.booking_code} has been downloaded`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate ticket PDF",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter(booking =>
    booking.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    booking.event_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-12">
        <div className="container">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage all event bookings</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/analytics')} className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                    <p className="text-3xl font-bold text-foreground">{stats.total}</p>
                  </div>
                  <Ticket className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <span className="text-yellow-600 font-bold">!</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Confirmed</p>
                    <p className="text-3xl font-bold text-secondary">{stats.confirmed}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-secondary" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Cancelled</p>
                    <p className="text-3xl font-bold text-destructive">{stats.cancelled}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Table */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by booking code, name, or event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking Code</TableHead>
                      <TableHead>Event</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-mono text-sm">{booking.booking_code}</TableCell>
                          <TableCell className="font-medium">{booking.event_title}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{booking.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{booking.customer_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{booking.ticket_type || 'Regular'}</Badge>
                          </TableCell>
                          <TableCell>{booking.ticket_quantity}</TableCell>
                          <TableCell className="font-semibold">
                            {booking.currency} {booking.total_amount}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                booking.status === 'confirmed'
                                  ? 'default'
                                  : booking.status === 'cancelled'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className={
                                booking.status === 'confirmed'
                                  ? 'bg-secondary text-secondary-foreground'
                                  : booking.status === 'pending'
                                  ? 'text-yellow-600 border-yellow-600'
                                  : ''
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {booking.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-secondary border-secondary hover:bg-secondary hover:text-secondary-foreground"
                                    onClick={() => updateBookingStatus(booking.booking_code, 'confirmed')}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => updateBookingStatus(booking.booking_code, 'cancelled')}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {booking.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-primary border-primary hover:bg-primary hover:text-primary-foreground"
                                  onClick={() => handleGenerateTicket(booking)}
                                >
                                  <Download className="h-4 w-4 mr-1" />
                                  Ticket
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Admin;
