import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, Facebook, Instagram, MapPin } from "lucide-react";
import { MessageCircle } from "lucide-react";

const AboutContact = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle>About EventLink Ghana</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">
            EventLink Ghana is your premier platform for discovering and booking tickets to the best events across Ghana. 
            From music festivals to tech summits, we connect you with unforgettable experiences.
          </p>
          <p className="text-muted-foreground">
            Our mission is to make event booking simple, secure, and accessible to everyone. Join thousands of event-goers 
            who trust EventLink Ghana for their entertainment needs.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-border shadow-card">
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <a 
              href="tel:+233240819270" 
              className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5 text-primary" />
              <span>024 081 9270</span>
            </a>

            <a 
              href="mailto:info@eventlinkghana.com" 
              className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
            >
              <Mail className="h-5 w-5 text-primary" />
              <span>info@eventlinkghana.com</span>
            </a>

            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span>Accra, Ghana</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border">
            <p className="text-sm text-muted-foreground mb-2">Follow us on social media:</p>
            <div className="flex gap-3">
              <a 
                href="https://wa.me/233240819270" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366] text-white hover:opacity-90 transition-opacity"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a 
                href="https://instagram.com/eventlinkghana" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] to-[#d62976] text-white hover:opacity-90 transition-opacity"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="https://facebook.com/eventlinkghana" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white hover:opacity-90 transition-opacity"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutContact;
