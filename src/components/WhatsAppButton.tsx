import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WhatsAppButton = () => {
  const whatsappNumber = "8801310903819"; // Replace with actual number

  return (
    <a
      href={`https://wa.me/${whatsappNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 animate-bounce"
    >
      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-gold bg-accent hover:bg-accent/90 text-accent-foreground"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </a>
  );
};
