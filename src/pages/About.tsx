import { Card, CardContent } from "@/components/ui/card";
import { Award, Users, Leaf, Heart } from "lucide-react";
import aboutFarm from "@/assets/about-farm.jpg";

export default function About() {
  const values = [
    {
      icon: Leaf,
      title: "100% Organic",
      description: "All our products are certified organic and free from harmful chemicals.",
    },
    {
      icon: Heart,
      title: "Health First",
      description: "We prioritize your health by providing nutrient-rich, natural products.",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description: "Every product undergoes rigorous quality testing before reaching you.",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Supporting local farmers and promoting sustainable agriculture.",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={aboutFarm}
            alt="Organic farm"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center text-primary-foreground">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Our Story</h1>
          {/* <p className="text-xl max-w-2xl mx-auto">
            Bringing nature's finest to your table since 2010
          </p> */}
          <p className="text-xl max-w-2xl mx-auto">
            Bringing nature's finest to your table
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-primary">Our Mission</h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
          Masan Natural Basket-এ আমরা বিশ্বাস করি, সবাই বিশুদ্ধ, প্রাকৃতিক এবং রাসায়নিকমুক্ত খাদ্য পাওয়ার যোগ্য। আমাদের লক্ষ্য হলো এমন প্রিমিয়াম অর্গানিক পণ্য সরবরাহ করা, যা আপনার শরীরকে পুষ্টি জোগানোর পাশাপাশি টেকসই কৃষি পদ্ধতি ও স্থানীয় সম্প্রদায়কে সহায়তা করে।
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
          আমরা দেশি অর্গানিক কৃষকদের সাথে সরাসরি কাজ করি এবং একই সঙ্গে বিশ্বের বিভিন্ন দেশ থেকে সর্বোচ্চ মানের বিশুদ্ধ পণ্য আমদানি করি। এতে কৃষকরা ন্যায্য মূল্য পান, আর আপনি পান সর্বোত্তম মানের স্বাস্থ্যকর ও নিরাপদ খাদ্য।

আপনার প্রতিটি কেনাকাটা আপনাকে করে তোলে আরও সুস্থ, আর পৃথিবীকে করে তোলে আরও সবুজ।
          </p>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-card transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-4">
                    <value.icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      {/* <section className="py-16 container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12 text-primary">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {[
            {
              title: "Certified Organic",
              description:
                "All our products are certified by recognized organic certification bodies, ensuring authenticity.",
            },
            {
              title: "Direct from Farmers",
              description:
                "We source directly from farmers, eliminating middlemen and ensuring freshness and fair pricing.",
            },
            {
              title: "Cold-Pressed Processing",
              description:
                "Our oils are extracted using traditional cold-press methods to preserve maximum nutrients.",
            },
            {
              title: "Chemical-Free",
              description:
                "Zero pesticides, herbicides, or artificial additives. Just pure, natural goodness.",
            },
            {
              title: "Sustainable Packaging",
              description:
                "We use eco-friendly packaging materials that are recyclable and biodegradable.",
            },
            {
              title: "Quality Assurance",
              description:
                "Every batch undergoes multiple quality checks to ensure it meets our premium standards.",
            },
          ].map((item, index) => (
            <Card key={index} className="shadow-card">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3 text-primary">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section> */}

      {/* Production Process */}
      {/* <section className="py-16 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-12 text-primary">
            From Farm to Your Table
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-6xl mx-auto">
            {[
              { step: "1", title: "Organic Farming", desc: "Grown naturally" },
              { step: "2", title: "Careful Harvesting", desc: "At peak ripeness" },
              { step: "3", title: "Processing", desc: "Cold-pressed method" },
              { step: "4", title: "Quality Testing", desc: "Rigorous checks" },
              { step: "5", title: "Packaging", desc: "Eco-friendly sealed" },
            ].map((item) => (
              <Card key={item.step} className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Stats Section */}
      {/* <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10+", label: "Years Experience" },
              { number: "50+", label: "Organic Farmers" },
              { number: "10K+", label: "Happy Customers" },
              { number: "100%", label: "Organic Products" },
            ].map((stat, index) => (
              <div key={index}>
                <div className="text-5xl font-bold mb-2 text-accent">{stat.number}</div>
                <div className="text-primary-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}
    </div>
  );
}
