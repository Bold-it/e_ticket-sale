import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Ticket, DollarSign, Users, ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  ticket_type: string;
  ticket_quantity: number;
  total_amount: number;
  currency: string;
  status: string;
  created_at: string;
  booking_code: string;
}

interface TicketSalesData {
  name: string;
  quantity: number;
  revenue: number;
}

const AdminAnalytics = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/admin-login');
      return;
    }

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      navigate('/admin-login');
      return;
    }

    loadBookings();
  };

  const loadBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading bookings:', error);
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  // Calculate analytics data
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + parseFloat(b.total_amount.toString()), 0);
  const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.ticket_quantity, 0);
  const totalCustomers = new Set(confirmedBookings.map(b => b.customer_email)).size;

  // Ticket sales by type
  const ticketSalesByType: { [key: string]: TicketSalesData } = {};
  confirmedBookings.forEach(booking => {
    const type = booking.ticket_type || 'Single';
    if (!ticketSalesByType[type]) {
      ticketSalesByType[type] = { name: type, quantity: 0, revenue: 0 };
    }
    ticketSalesByType[type].quantity += booking.ticket_quantity;
    ticketSalesByType[type].revenue += parseFloat(booking.total_amount.toString());
  });

  const ticketSalesData = Object.values(ticketSalesByType);

  // Status breakdown
  const statusData = [
    { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length },
    { name: 'Pending', value: bookings.filter(b => b.status === 'pending').length },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length },
  ].filter(item => item.value > 0);

  const COLORS = {
    Single: 'hsl(var(--primary))',
    Double: 'hsl(var(--secondary))',
    VIP: 'hsl(var(--accent))',
    Confirmed: 'hsl(142, 76%, 36%)',
    Pending: 'hsl(48, 96%, 53%)',
    Cancelled: 'hsl(0, 84%, 60%)',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-12 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-8">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
              <p className="text-muted-foreground">Track ticket sales and revenue performance</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">GHS {totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">From confirmed bookings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tickets Sold</CardTitle>
                <Ticket className="h-4 w-4 text-secondary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalTicketsSold}</div>
                <p className="text-xs text-muted-foreground mt-1">Confirmed tickets</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bookings</CardTitle>
                <TrendingUp className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{bookings.length}</div>
                <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                <Users className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique customers</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Ticket Sales by Type */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Ticket Sales by Type</CardTitle>
                <p className="text-sm text-muted-foreground">Number of tickets sold per type</p>
              </CardHeader>
              <CardContent>
                {ticketSalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ticketSalesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--foreground))" />
                      <YAxis stroke="hsl(var(--foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }} 
                      />
                      <Legend />
                      <Bar dataKey="quantity" fill="hsl(var(--primary))" name="Tickets Sold" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No ticket sales data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Revenue by Ticket Type */}
            <Card className="bg-gradient-card border-border">
              <CardHeader>
                <CardTitle>Revenue by Ticket Type</CardTitle>
                <p className="text-sm text-muted-foreground">Revenue breakdown by ticket category</p>
              </CardHeader>
              <CardContent>
                {ticketSalesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={ticketSalesData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="hsl(var(--primary))"
                        dataKey="revenue"
                      >
                        {ticketSalesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || 'hsl(var(--primary))'} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                        formatter={(value: number) => `GHS ${value.toFixed(2)}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No revenue data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Booking Status Overview */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle>Booking Status Overview</CardTitle>
              <p className="text-sm text-muted-foreground">Distribution of booking statuses</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {statusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="hsl(var(--primary))"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                      No booking data available
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground mb-4">Revenue Breakdown</h3>
                  {ticketSalesData.map((ticket, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded" 
                          style={{ backgroundColor: COLORS[ticket.name as keyof typeof COLORS] || 'hsl(var(--primary))' }}
                        />
                        <div>
                          <p className="font-medium text-foreground">{ticket.name} Tickets</p>
                          <p className="text-sm text-muted-foreground">{ticket.quantity} sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-foreground">GHS {ticket.revenue.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {totalRevenue > 0 ? ((ticket.revenue / totalRevenue) * 100).toFixed(1) : 0}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AdminAnalytics;
