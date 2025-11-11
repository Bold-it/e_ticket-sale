import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle, Clock, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const TicketStatusChecker = () => {
  const [bookingCode, setBookingCode] = useState("");
  const [searchResult, setSearchResult] = useState<any>(null);
  const { toast } = useToast();

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookingCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a booking code",
        variant: "destructive",
      });
      return;
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('booking_code', bookingCode.trim())
      .single();

    if (error || !booking) {
      toast({
        title: "Not Found",
        description: "No booking found with this code",
        variant: "destructive",
      });
      setSearchResult(null);
    } else {
      setSearchResult(booking);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      confirmed: "default",
      pending: "outline",
      cancelled: "destructive",
    };
    
    return (
      <Badge variant={variants[status] || "outline"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <Card className="bg-gradient-card border-border shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Check Ticket Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheckStatus} className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter your booking code (e.g., EVT-12345)"
              value={bookingCode}
              onChange={(e) => setBookingCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Check
            </Button>
          </div>

          {searchResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(searchResult.status)}
                  <span className="font-semibold">Status:</span>
                </div>
                {getStatusBadge(searchResult.status)}
              </div>
              
              <div className="text-sm space-y-1">
                <p><strong>Event:</strong> {searchResult.event_title}</p>
                <p><strong>Customer:</strong> {searchResult.customer_name}</p>
                <p><strong>Tickets:</strong> {searchResult.ticket_quantity} x {searchResult.ticket_type || 'Regular'}</p>
                <p><strong>Amount:</strong> {searchResult.currency} {searchResult.total_amount}</p>
              </div>

              {searchResult.status === 'pending' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Your booking is pending payment confirmation. Please contact the organizer to complete payment.
                </p>
              )}
              {searchResult.status === 'confirmed' && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Your ticket has been confirmed! Check your email for the ticket PDF.
                </p>
              )}
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default TicketStatusChecker;
