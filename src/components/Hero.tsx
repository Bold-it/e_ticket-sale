import { Button } from "./ui/button";
import { Calendar, Ticket, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      <div className="absolute inset-0 bg-gradient-hero opacity-10"></div>
      
      <div className="container relative">
        <div className="mx-auto max-w-3xl text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-sm">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-foreground font-medium">Ghana's Premier Event Booking Platform</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
            Discover Amazing Events in
            <span className="bg-gradient-hero bg-clip-text text-transparent"> Ghana</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            From music festivals to tech summits, find and book tickets for the hottest events across Ghana. 
            Secure your spot with instant booking codes.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/events">
              <Button size="lg" className="bg-gradient-hero hover:opacity-90 transition-opacity text-lg px-8 shadow-elevated">
                <Ticket className="mr-2 h-5 w-5" />
                Browse Events
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 border-2">
              <Calendar className="mr-2 h-5 w-5" />
              How It Works
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
            {[
              { icon: Calendar, title: "Browse Events", desc: "Find your perfect event" },
              { icon: Ticket, title: "Book Instantly", desc: "Get your booking code" },
              { icon: Zap, title: "Pay via WhatsApp", desc: "Simple & secure" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card hover:shadow-card transition-all">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-hero">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground text-center">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
