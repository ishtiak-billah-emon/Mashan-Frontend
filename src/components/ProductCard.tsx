import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    description: string;
    benefits: string[];
    stock: number;
    discountAmount?: number;
    isOnSale?: boolean;
  };
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();

  const isOutOfStock = product.stock === 0;
  const hasDiscount = product.isOnSale && product.discountAmount && product.discountAmount > 0;
  const discountedPrice = hasDiscount
    ? product.price - (product.discountAmount || 0)
    : product.price;

  return (
    <Card className="group overflow-hidden hover:shadow-premium transition-all duration-300">
      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden aspect-square bg-gray-100">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x400?text=No+Image";
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-muted-foreground text-sm">No Image</span>
            </div>
          )}
          
          {/* ON SALE Badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-teal-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              ON SALE
            </div>
          )}
          
          {/* Discount Amount Badge */}
          {hasDiscount && (
            <div className="absolute top-3 right-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full border-2 border-white">
              ৳{product.discountAmount?.toFixed(0)} DISCOUNT
            </div>
          )}

          {/* Category Badge - only show if no discount badge */}
          {!hasDiscount && (
            <div className="absolute top-3 right-3 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 rounded-full">
              {product.category}
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute bottom-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded">
              Out of Stock
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/product/${product.id}`}>
          <h3 className="font-semibold text-lg mb-2 group-hover:text-accent transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {product.description}
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {hasDiscount ? (
            <>
              <span className="text-xl font-bold text-primary">৳{discountedPrice.toFixed(2)}</span>
              <span className="text-sm text-muted-foreground line-through">৳{product.price.toFixed(2)}</span>
            </>
          ) : (
            <span className="text-xl font-bold text-primary">৳{product.price.toFixed(2)}</span>
          )}
        </div>
        {product.stock === 0 && (
          <span className="text-xs text-muted-foreground block mt-1">Out of Stock</span>
        )}
        {product.stock > 0 && product.stock < 5 && (
          <span className="text-xs text-muted-foreground block mt-1">Only {product.stock} left</span>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {isOutOfStock ? (
          <Button
            disabled
            className="w-full bg-red-600 text-white cursor-not-allowed"
          >
            Out of Stock
          </Button>
        ) : (
          <Button
            onClick={() => addToCart(product)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
