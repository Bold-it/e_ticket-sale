import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, XCircle, Search, Ticket, Download, LogOut, BarChart3, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateTicketPDF } from "@/lib/pdfGenerator";
import { mockEvents } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
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
              organizerName: event?.organizerName || 'EventLink Ghana',
              organizerPhone: event?.organizerPhone || '+233244123456',
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

  const handleBulkDelete = async () => {
    if (selectedBookings.length === 0) return;

    const { error } = await supabase
      .from('bookings')
      .delete()
      .in('id', selectedBookings);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete bookings",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: `${selectedBookings.length} booking(s) deleted successfully`,
    });

    setSelectedBookings([]);
    setShowDeleteDialog(false);
    loadBookings();
  };

  const toggleSelectAll = () => {
    if (selectedBookings.length === filteredBookings.length) {
      setSelectedBookings([]);
    } else {
      setSelectedBookings(filteredBookings.map(b => b.id));
    }
  };

  const toggleSelectBooking = (bookingId: string) => {
    setSelectedBookings(prev =>
      prev.includes(bookingId)
        ? prev.filter(id => id !== bookingId)
        : [...prev, bookingId]
    );
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.booking_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.event_title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    const bookingDate = new Date(booking.created_at);
    const matchesDateFrom = !dateFrom || bookingDate >= dateFrom;
    const matchesDateTo = !dateTo || bookingDate <= dateTo;
    
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
  });

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
              <div className="flex items-center justify-between">
                <CardTitle>All Bookings</CardTitle>
                {selectedBookings.length > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Selected ({selectedBookings.length})
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-popover" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {(statusFilter !== "all" || dateFrom || dateTo) && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStatusFilter("all");
                      setDateFrom(undefined);
                      setDateTo(undefined);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedBookings.length === filteredBookings.length && filteredBookings.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
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
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedBookings.includes(booking.id)}
                              onCheckedChange={() => toggleSelectBooking(booking.id)}
                            />
                          </TableCell>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bookings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedBookings.length} booking(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
