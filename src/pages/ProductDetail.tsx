import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "@/hooks/useCart";
import { ProductCard } from "@/components/ProductCard";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Product type from backend
interface ProductResponse {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  benefits: string[];
  stock: number;
  discountAmount?: number;
  isOnSale?: boolean;
}

// Convert backend shape → frontend shape
const toFrontendProduct = (p: ProductResponse) => ({
  id: p._id,
  name: p.name,
  price: p.price,
  image: p.image,
  category: p.category,
  description: p.description,
  benefits: p.benefits,
  stock: p.stock,
});

export default function ProductDetail() {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch product + related
  useEffect(() => {
    if (!id) return;

    const loadProduct = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        const prod = toFrontendProduct(res.data);
        setProduct(prod);

        // Fetch all for related items
        const allRes = await axios.get(`${API_BASE}/api/products`);
        const allProducts = allRes.data.map(toFrontendProduct);

        const related = allProducts
          .filter((p: any) => p.category === prod.category && p.id !== prod.id)
          .slice(0, 4);

        setRelatedProducts(related);
      } catch (error) {
        console.error("Error loading product:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-xl font-semibold">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product not found</h1>
        <Link to="/shop">
          <Button>Back to Shop</Button>
        </Link>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;

  // benefits fallback
  const benefits =
    product.benefits?.length > 0
      ? product.benefits
      : [
          "100% Organic & Natural",
          "No Chemical Additives",
          "Cold-Pressed Method",
          "Premium Quality Assured",
          "Sustainably Sourced",
          "Rich in Nutrients",
        ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Link to="/shop">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Shop
        </Button>
      </Link>

      {/* Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Image */}
        <div className="relative">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full rounded-lg shadow-premium"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/600x600?text=No+Image";
              }}
            />
          ) : (
            <div className="w-full aspect-square flex items-center justify-center bg-gray-200 rounded-lg shadow-premium">
              <span className="text-muted-foreground text-lg">No Image Available</span>
            </div>
          )}

          <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
            {product.category}
          </Badge>

          {isOutOfStock && (
            <div className="absolute bottom-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
              OUT OF STOCK
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4 text-primary">{product.name}</h1>

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {product.isOnSale && product.discountAmount && product.discountAmount > 0 ? (
              <>
                <span className="text-4xl font-bold text-primary">
                  ৳{(product.price - product.discountAmount).toFixed(2)}
                </span>
                <span className="text-2xl text-muted-foreground line-through">
                  ৳{product.price.toFixed(2)}
                </span>
                <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-800">
                  ৳{product.discountAmount.toFixed(0)} OFF
                </span>
              </>
            ) : (
              <span className="text-4xl font-bold text-primary">৳{product.price.toFixed(2)}</span>
            )}
          </div>

          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
            {product.description}
          </p>

          {/* Stock Info */}
          {!isOutOfStock && (
            <p className="text-sm text-green-600 font-medium mb-4">
              {product.stock < 5
                ? `Only ${product.stock} left in stock!`
                : `In stock: ${product.stock}`}
            </p>
          )}

          {isOutOfStock && (
            <p className="text-sm text-red-600 font-bold mb-4">
              This product is currently unavailable.
            </p>
          )}

          {/* Benefits */}
          <div className="mb-8">
            <h3 className="font-semibold text-lg mb-4">Key Benefits:</h3>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit: string, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Quantity</label>

            <div className="flex items-center gap-4">
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={quantity <= 1 || isOutOfStock}
                  onClick={() => setQuantity(quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>

                <span className="px-6 py-2 font-semibold">{quantity}</span>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={quantity >= product.stock || isOutOfStock}
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <span className="text-muted-foreground">
                Total: ৳{((product.isOnSale && product.discountAmount ? product.price - product.discountAmount : product.price) * quantity).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Add to Cart Button */}
          {isOutOfStock ? (
            <Button
              disabled
              size="lg"
              className="w-full bg-red-600 text-white cursor-not-allowed"
            >
              Out of Stock
            </Button>
          ) : (
            <Button
              size="lg"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg"
              onClick={() => addToCart(product, quantity)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
          )}

          {/* Shipping Info */}
          <Card className="mt-6 bg-accent/5 border-accent/20">
            <CardContent className="p-4">
              <p className="text-sm text-foreground/80">
                ✓ Free shipping on orders above TK 999<br />
                ✓ Easy returns within 7 days<br />
                ✓ 100% satisfaction guaranteed
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-8 text-primary">
            You May Also Like
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
