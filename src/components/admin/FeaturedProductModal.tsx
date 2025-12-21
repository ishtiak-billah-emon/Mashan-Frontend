import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function FeaturedProductModal({
  open,
  setOpen,
  onFeaturedAdded,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  onFeaturedAdded: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Get auth token
  const getAuthHeaders = () => {
    const token = localStorage.getItem("admin_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  };

  // Load products for admin
  useEffect(() => {
    if (!open) {
      setSearch("");
      setProducts([]);
      return;
    }

    async function fetchProducts() {
      setLoading(true);
      try {
        let url: string;
        
        // If search is empty, get all products, otherwise search
        if (search.trim()) {
          url = `${API_BASE}/api/admin/products/search?q=${encodeURIComponent(search.trim())}`;
        } else {
          url = `${API_BASE}/api/admin/products`;
        }

        const res = await fetch(url, {
          headers: getAuthHeaders(),
          credentials: "include",
        });

        if (!res.ok) {
          if (res.status === 401) {
            toast.error("Please login as admin");
            setOpen(false);
            return;
          }
          throw new Error("Failed to load products");
        }

        const data = await res.json();
        setProducts(data);
      } catch (err: any) {
        console.error("Failed to load products", err);
        toast.error("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    // Debounce search
    const timeoutId = setTimeout(() => {
      fetchProducts();
    }, search.trim() ? 300 : 0);

    return () => clearTimeout(timeoutId);
  }, [open, search]);

  // Toggle featured
  async function toggleFeatured(id: string, currentStatus: boolean) {
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
        throw new Error("Failed to update featured status");
      }

      const data = await res.json();
      toast.success(
        data.product.isFeatured
          ? "Product added to featured"
          : "Product removed from featured"
      );

      // Update local state
      setProducts((prev) =>
        prev.map((p) =>
          p._id === id ? { ...p, isFeatured: data.product.isFeatured } : p
        )
      );

      onFeaturedAdded(); // reload home page featured
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to update featured status");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Featured Products</DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading products...</span>
            </div>
          )}

          {!loading && products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {search.trim()
                ? "No products found matching your search"
                : "No products available"}
            </div>
          )}

          {!loading &&
            products.map((product) => (
              <div
                key={product._id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors flex items-center gap-4"
              >
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold truncate">{product.name}</p>
                    {product.isFeatured && (
                      <Badge variant="default" className="bg-yellow-500">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {product.category} • ₹{product.price}
                  </p>
                </div>

                <Button
                  size="sm"
                  variant={product.isFeatured ? "destructive" : "default"}
                  onClick={() => toggleFeatured(product._id, product.isFeatured)}
                >
                  {product.isFeatured ? "Remove" : "Add"}
                </Button>
              </div>
            ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
