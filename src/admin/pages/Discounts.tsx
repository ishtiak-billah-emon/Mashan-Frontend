import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Search, Edit2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Product {
  _id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  discountAmount?: number;
  isOnSale?: boolean;
}

export default function Discounts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [discountAmount, setDiscountAmount] = useState("");
  const [isOnSale, setIsOnSale] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setProducts(res.data);
      setFilteredProducts(res.data);
      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast.error("Failed to fetch products");
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDiscountAmount(product.discountAmount?.toString() || "");
    setIsOnSale(product.isOnSale || false);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    const discountValue = discountAmount ? Number(discountAmount) : 0;
    
    if (discountValue < 0) {
      toast.error("Discount amount cannot be negative");
      return;
    }

    if (discountValue > editingProduct.price) {
      toast.error("Discount amount cannot be greater than product price");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(
        `${API_BASE}/api/admin/products/${editingProduct._id}`,
        {
          discountAmount: discountValue,
          isOnSale: isOnSale && discountValue > 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Discount updated successfully");
      setIsDialogOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      console.error("Error updating discount:", error);
      toast.error(error?.response?.data?.message || "Failed to update discount");
    }
  };

  const handleRemoveDiscount = async (product: Product) => {
    if (!confirm("Are you sure you want to remove the discount from this product?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.put(
        `${API_BASE}/api/admin/products/${product._id}`,
        {
          discountAmount: 0,
          isOnSale: false,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Discount removed successfully");
      fetchProducts();
    } catch (error: any) {
      console.error("Error removing discount:", error);
      toast.error("Failed to remove discount");
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setDiscountAmount("");
    setIsOnSale(false);
  };

  const calculateDiscountedPrice = (price: number, discount: number) => {
    return price - discount;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Discount Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage discounts and sale prices for your products
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Products ({filteredProducts.length})
            {searchQuery && ` - Search: "${searchQuery}"`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No products found matching your search" : "No products found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Original Price</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Discounted Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => {
                    const discount = product.discountAmount || 0;
                    const discountedPrice = calculateDiscountedPrice(product.price, discount);
                    const hasDiscount = discount > 0 && product.isOnSale;

                    return (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://via.placeholder.com/100";
                                }}
                              />
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="uppercase">{product.category}</TableCell>
                        <TableCell className="font-semibold">৳{product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          {hasDiscount ? (
                            <span className="text-red-600 font-semibold">
                              ৳{discount.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasDiscount ? (
                            <span className="font-semibold text-green-600">
                              ৳{discountedPrice.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasDiscount ? (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                              ON SALE
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-sm">Regular</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit2 className="h-4 w-4 mr-1" />
                              {hasDiscount ? "Edit" : "Add Discount"}
                            </Button>
                            {hasDiscount && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRemoveDiscount(product)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Discount Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? `Set Discount for ${editingProduct.name}` : "Add Discount"}
            </DialogTitle>
            <DialogDescription>
              Set a discount amount to put this product on sale
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Original Price</Label>
              <Input
                value={editingProduct?.price || ""}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountAmount">
                Discount Amount (৳) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="discountAmount"
                type="number"
                min="0"
                max={editingProduct?.price || 0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="Enter discount amount"
              />
              <p className="text-xs text-muted-foreground">
                Maximum discount: ৳{editingProduct?.price || 0}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="isOnSale" className="flex items-center gap-2">
                <input
                  id="isOnSale"
                  type="checkbox"
                  checked={isOnSale}
                  onChange={(e) => setIsOnSale(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Put product on sale</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                When enabled, the product will show "ON SALE" badge and discounted price
              </p>
            </div>
            {discountAmount && Number(discountAmount) > 0 && (
              <div className="rounded bg-green-50 p-3">
                <p className="text-sm font-medium text-green-800">
                  Discounted Price: ৳
                  {calculateDiscountedPrice(
                    editingProduct?.price || 0,
                    Number(discountAmount) || 0
                  ).toFixed(2)}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Savings: ৳{Number(discountAmount).toFixed(2)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Discount</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

