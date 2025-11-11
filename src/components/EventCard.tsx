import { Calendar, MapPin, Ticket } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Event } from "@/types/event";
import { Link } from "react-router-dom";

interface EventCardProps {
  event: Event;
}

const EventCard = ({ event }: EventCardProps) => {
  const formattedDate = new Date(event.date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const availability = ((event.availableTickets / event.totalTickets) * 100).toFixed(0);

  return (
    <Card className="group overflow-hidden border-border hover:shadow-elevated transition-all duration-300 bg-gradient-card">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={event.imageUrl} 
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {event.featured && (
          <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
            Featured
          </Badge>
        )}
        <Badge className="absolute top-3 right-3 bg-background/90 text-foreground">
          {event.category}
        </Badge>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <h3 className="text-xl font-bold text-foreground line-clamp-1">
          {event.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {event.description}
        </p>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>{formattedDate} at {event.time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-secondary" />
            <span className="line-clamp-1">{event.venue}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ticket className="h-4 w-4 text-accent" />
            <span>{availability}% available</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-primary">
            {event.currency} {event.price}
          </p>
          <p className="text-xs text-muted-foreground">per ticket</p>
        </div>
        <Link to={`/event/${event.id}`}>
          <Button className="bg-gradient-hero hover:opacity-90 transition-opacity">
            Book Now
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
