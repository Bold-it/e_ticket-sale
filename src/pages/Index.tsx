import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import TicketStatusChecker from "@/components/TicketStatusChecker";
import AboutContact from "@/components/AboutContact";
import { mockEvents } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const featuredEvents = mockEvents.filter(event => event.featured).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Featured Events</h2>
              <p className="text-muted-foreground">Don't miss out on these popular events</p>
            </div>
            <Link to="/events">
              <Button variant="outline" className="hidden md:flex items-center gap-2">
                View All Events
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          
          <div className="text-center md:hidden">
            <Link to="/events">
              <Button variant="outline" className="items-center gap-2">
                View All Events
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container max-w-4xl">
          <TicketStatusChecker />
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">About & Contact</h2>
          <AboutContact />
        </div>
      </section>

      <footer className="border-t border-border py-8 mt-16">
        <div className="container text-center text-muted-foreground">
          <p>© 2025 EventLink Ghana. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
