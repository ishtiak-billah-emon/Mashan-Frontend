import { createContext, useContext, useState, ReactNode } from "react";
import { toast } from "sonner";

// -----------------------------
// TYPES
// -----------------------------
export interface Product {
  _id?: string;       // from MongoDB
  id?: string;        // fallback if frontend uses id
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  benefits: string[];
  stock: number;
}

export interface CartItem {
  id: string;         // ALWAYS the normalized final ID
  name: string;
  price: number;
  image: string;
  category: string;
  description: string;
  benefits: string[];
  stock: number;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// -----------------------------
// NORMALIZER — always extracts correct MongoDB id
// -----------------------------
const normalizeProduct = (product: Product): CartItem | null => {
  const finalId = product._id || product.id;

  if (!finalId) {
    console.error("Product missing _id:", product);
    return null;
  }

  return {
    id: finalId,             // normalized ID used everywhere
    name: product.name,
    price: product.price,
    image: product.image,
    category: product.category,
    description: product.description,
    benefits: product.benefits,
    stock: product.stock,
    quantity: 0,             // will be set later
  };
};

// -----------------------------
// CART PROVIDER
// -----------------------------
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // -----------------------------
  // ADD TO CART
  // -----------------------------
  const addToCart = (product: Product, quantity: number = 1) => {
    const normalized = normalizeProduct(product);

    if (!normalized) {
      toast.error("Invalid product data");
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === normalized.id);

      // Increase quantity if product already in cart
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, existing.stock);

        if (newQty === existing.quantity) {
          toast.error("Stock limit reached");
          return prev;
        }

        toast.success("Updated cart quantity");

        return prev.map((item) =>
          item.id === normalized.id
            ? { ...item, quantity: newQty }
            : item
        );
      }

      // Add new product
      if (quantity > normalized.stock) {
        toast.error("Not enough stock available");
        return prev;
      }

      toast.success("Added to cart");

      return [...prev, { ...normalized, quantity }];
    });
  };

  // -----------------------------
  // REMOVE ITEM
  // -----------------------------
  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
    toast.success("Removed from cart");
  };

  // -----------------------------
  // UPDATE QTY (safe stock)
  // -----------------------------
  const updateQuantity = (productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== productId) return item;

        const safeQty = Math.min(quantity, item.stock);

        if (safeQty === item.quantity) {
          toast.error("Stock limit reached");
          return item;
        }

        return { ...item, quantity: safeQty };
      })
    );
  };

  // -----------------------------
  // CLEAR CART
  // -----------------------------
  const clearCart = () => {
    setItems([]);
  };

  // -----------------------------
  // TOTAL
  // -----------------------------
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

// -----------------------------
// HOOK
// -----------------------------
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};
