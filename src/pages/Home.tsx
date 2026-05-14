import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Leaf, Shield, Heart, Award, Trash } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FeaturedProductModal } from "@/components/admin/FeaturedProductModal";
import { useAdminAuth } from "@/admin/hooks/AdminAuthContext";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Home() {
  const { role } = useAdminAuth();
  const isAdmin = !!role || !!localStorage.getItem("admin_role");

  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [openFeaturedModal, setOpenFeaturedModal] = useState(false);

  // Get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  const [showDbNotice, setShowDbNotice] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowDbNotice(false);
    }, 9000);

    return () => clearTimeout(timer);
  }, []);

  // Load featured products from backend
  async function loadFeatured() {
    try {
      console.log("Fetching from:", `${API_BASE}/api/products/featured`);
      const res = await fetch(`${API_BASE}/api/products/featured`);
      console.log("Response status:", res.status, res.statusText);
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `Failed to load featured products: ${res.status} ${res.statusText}`,
        );
      }
      const data = await res.json();
      console.log("Featured products loaded:", data);
      setFeaturedProducts(data);
    } catch (err: any) {
      console.error("Error loading featured", err);
      const errorMsg = err.message || "Failed to load featured products";
      console.error("Full error:", err);
      toast.error(errorMsg);
    }
  }

  useEffect(() => {
    loadFeatured();
  }, []);

  // Remove from featured
  async function removeFeatured(id: string) {
    if (
      !confirm("Are you sure you want to remove this product from featured?")
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}/featured`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 401) {
          toast.error("Please login as admin");
          return;
        }
        throw new Error("Failed to remove featured");
      }

      toast.success("Product removed from featured");
      loadFeatured();
    } catch (err: any) {
      console.error("Error removing featured", err);
      toast.error("Failed to remove product from featured");
    }
  }

  const categories = [
    { name: "Oils", icon: "🫒", description: "Cold-pressed & pure" },
    { name: "Honey", icon: "🍯", description: "Raw & natural" },
    { name: "Spices", icon: "🌶️", description: "Organic & fresh" },
    { name: "Wellness", icon: "🌿", description: "Health essentials" },
  ];

  return (
    <div className="min-h-screen">
      {/* Floating DB Notice */}
      {showDbNotice && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-500">
          <div className="bg-black/85 text-white px-5 py-4 rounded-xl shadow-2xl max-w-sm border border-white/10 backdrop-blur-sm">
            <p className="text-sm leading-relaxed">
              Products may take a few seconds to load due to database inactivity
              on the free hosting tier.
            </p>
          </div>
        </div>
      )}
      {/* Hero Section - Carousel */}
      <HeroCarousel />

      {/* Categories Section */}
      {/* <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">
            Shop by Category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link key={category.name} to="/shop">
                <Card className="hover:shadow-card transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                  <CardContent className="p-8 text-center">
                    <div className="text-6xl mb-4">{category.icon}</div>
                    <h3 className="text-xl font-semibold mb-2">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section> */}

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">
            Why Choose ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Leaf,
                title: "100% Organic",
                desc: "Organic products",
              },
              {
                icon: Shield,
                title: "Chemical-Free",
                desc: "No harmful additives",
              },
              {
                icon: Heart,
                title: "Cold-Pressed",
                desc: "Preserves nutrients",
              },
              {
                icon: Award,
                title: "Premium Quality",
                desc: "Rigorously tested",
              },
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
                  <benefit.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ⭐ FEATURED PRODUCTS SECTION ⭐ */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-4xl font-bold text-primary">
              Featured Products
            </h2>

            <div className="flex items-center gap-3">
              <Link to="/shop">
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              {isAdmin && (
                <Button
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => setOpenFeaturedModal(true)}
                >
                  + Add Featured Product
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product: any) => (
              <div key={product._id} className="relative">
                <ProductCard product={product} />

                {/* REMOVE FEATURED BUTTON */}
                {isAdmin && (
                  <button
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 shadow-lg"
                    onClick={() => removeFeatured(product._id)}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal for adding featured */}
      <FeaturedProductModal
        open={openFeaturedModal}
        setOpen={setOpenFeaturedModal}
        onFeaturedAdded={loadFeatured}
      />

      {/* Testimonials */}
      {/* <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Priya Sharma",
                comment:
                  "Best organic products I've ever used. The quality is outstanding!",
                rating: 5,
              },
              {
                name: "Rajesh Kumar",
                comment:
                  "Love the cold-pressed oils. You can really taste the difference.",
                rating: 5,
              },
              {
                name: "Anita Desai",
                comment:
                  "Finally found authentic organic honey. Highly recommend!",
                rating: 5,
              },
            ].map((testimonial, index) => (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-accent">
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.comment}"
                  </p>
                  <p className="font-semibold text-primary">
                    {testimonial.name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}
    </div>
  );
}
