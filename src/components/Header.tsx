import { Link } from "react-router-dom";
import { Ticket } from "lucide-react";
import { Button } from "./ui/button";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-hero">
            <Ticket className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">EventLink Ghana</span>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Browse Events
          </Link>
          <Link to="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Admin
          </Link>
        </nav>

        <Link to="/event/1">
          <Button className="bg-gradient-hero hover:opacity-90 transition-opacity">
            Book Tickets
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
