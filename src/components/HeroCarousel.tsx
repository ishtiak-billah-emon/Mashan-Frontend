import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import heroImage from "@/assets/hero-organic.jpg";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Banner {
  _id: string;
  imageUrl: string;
  title?: string;
  description?: string;
}

export function HeroCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/banners`);
      if (!res.ok) throw new Error("Failed to load banners");
      const data = await res.json();
      setBanners(data);
    } catch (err) {
      console.error("Error loading banners:", err);
    } finally {
      setLoading(false);
    }
  };

  // Autoplay plugin with 2 second delay
  const autoplayPlugin = Autoplay({
    delay: 4000,
    stopOnInteraction: false,
    stopOnMouseEnter: false,
  });

  // Combine fixed image with dynamic banners
  const carouselItems = [
    {
      _id: "fixed-hero",
      imageUrl: heroImage,
      isFixed: true,
    },
    ...banners.map((banner) => ({
      ...banner,
      isFixed: false,
    })),
  ];

  if (loading) {
    return (
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-muted">
        <div className="text-muted-foreground">Loading...</div>
      </section>
    );
  }

  return (
    <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
      {carouselItems.length > 0 ? (
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[autoplayPlugin]}
          className="w-full h-full"
        >
          <CarouselContent className="h-[600px]">
            {carouselItems.map((item) => (
              <CarouselItem key={item._id} className="h-full">
                {item.isFixed ? (
                  // Fixed banner with zoom, gradient, and buttons
                  <div className="relative h-full w-full">
                    <div className="absolute inset-0">
                      <img
                        src={item.imageUrl}
                        alt="Hero banner"
                        className="w-full h-full object-cover scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
                    </div>

                    <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
                      <div className="text-center text-primary-foreground w-full">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                          Pure. Natural. <span className="text-accent">Organic.</span>
                        </h1>
                        <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                          Discover premium organic products that nourish your body and soul
                        </p>
                        <div className="flex gap-4 justify-center flex-wrap">
                          <Link to="/shop">
                            <Button
                              size="lg"
                              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
                            >
                              Shop Now <ArrowRight className="ml-2" />
                            </Button>
                          </Link>
                          {/* <Link to="/about">
                            <Button
                              size="lg"
                              variant="outline"
                              className="text-black border-primary-foreground hover:bg-primary-foreground/10 text-lg px-8"
                            >
                              Learn More
                            </Button>
                          </Link> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Dynamic banners - simple, no zoom, no gradient, no buttons
                  <div className="relative h-full w-full">
                    <img
                      src={item.imageUrl}
                      alt={item.title || "Banner"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="!left-4 !-translate-x-0 bg-white/20 hover:bg-white/40 border-white/30 text-white" />
          <CarouselNext className="!right-4 !-translate-x-0 bg-white/20 hover:bg-white/40 border-white/30 text-white" />
        </Carousel>
      ) : (
        // Fallback to fixed image if no banners
        <div className="relative h-full w-full">
          <div className="absolute inset-0">
            <img
              src={heroImage}
              alt="Organic lifestyle"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/60" />
          </div>
          <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground h-full flex items-center">
            <div className="w-full">
              <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
                Pure. Natural. <span className="text-accent">Organic.</span>
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
                Discover premium organic products that nourish your body and soul
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link to="/shop">
                  <Button
                    size="lg"
                    className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
                  >
                    Shop Now <ArrowRight className="ml-2" />
                  </Button>
                </Link>
                <Link to="/about">
                  <Button
                    size="lg"
                    variant="outline"
                    className="text-black border-primary-foreground hover:bg-primary-foreground/10 text-lg px-8"
                  >
                    Learn More
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

