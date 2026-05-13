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
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Upload, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Product {
  _id: string;
  name: string;
  price: number;
  buyingPrice?: number;
  image: string;
  category: string;
  description: string;
  benefits: string[];
  stock: number;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockUpdates, setStockUpdates] = useState<{ [key: string]: number }>(
    {},
  );
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  // Extract unique categories from products
  const existingCategories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean)),
  ).sort();

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    buyingPrice: "",
    image: "",
    category: "",
    description: "",
    benefits: "",
    stock: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      fetchProducts(searchQuery);
    } else {
      setFilteredProducts(products);
    }
  }, [searchQuery, products]);

  const fetchProducts = async (search?: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const params = search ? { search } : {};
      const res = await axios.get(`${API_BASE}/api/admin/products`, {
        params,
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

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Cloudinary
    setUploading(true);
    try {
      const token = localStorage.getItem("admin_token");

      if (!token) {
        toast.error("Please login to upload images");
        setUploading(false);
        return;
      }

      const formData = new FormData();
      formData.append("image", file);

      const res = await axios.post(`${API_BASE}/api/upload/image`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type manually - let axios set it with boundary
        },
      });

      if (res.data.success && res.data.url) {
        setFormData((prev) => ({ ...prev, image: res.data.url }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error("Upload failed: No URL returned");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to upload image. Please check your connection and try again.";
      toast.error(errorMessage);
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setImagePreview("");
    setFormData((prev) => ({ ...prev, image: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.price ||
      !formData.category ||
      formData.stock === ""
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      const benefitsArray = formData.benefits
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b.length > 0);

      const payload = {
        name: formData.name,
        price: Number(formData.price),
        buyingPrice: formData.buyingPrice
          ? Number(formData.buyingPrice)
          : undefined,
        image: formData.image,
        category: formData.category,
        description: formData.description,
        benefits: benefitsArray,
        stock: Number(formData.stock),
      };

      if (editingProduct) {
        // Update existing product
        await axios.put(
          `${API_BASE}/api/admin/products/${editingProduct._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
        toast.success("Product updated successfully");
      } else {
        // Create new product
        await axios.post(`${API_BASE}/api/admin/products`, payload, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        toast.success("Product created successfully");
      }

      // Reset form and close dialog
      resetForm();
      setIsDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast.error(error?.response?.data?.message || "Failed to save product");
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      buyingPrice: product.buyingPrice?.toString() || "",
      image: product.image || "",
      category: product.category,
      description: product.description || "",
      benefits: product.benefits.join(", "),
      stock: product.stock.toString(),
    });
    setImagePreview(product.image || "");
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API_BASE}/api/admin/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  const handleStockChange = (productId: string, value: string) => {
    setStockUpdates((prev) => ({
      ...prev,
      [productId]: Number(value),
    }));
  };

  const handleStockUpdate = async (productId: string) => {
    const newStock = stockUpdates[productId];
    if (newStock === undefined || isNaN(newStock)) {
      toast.error("Please enter a valid stock value");
      return;
    }

    try {
      const token = localStorage.getItem("admin_token");
      await axios.patch(
        `${API_BASE}/api/admin/products/${productId}/stock`,
        { stock: newStock },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      toast.success("Stock updated successfully");
      setStockUpdates((prev) => {
        const updated = { ...prev };
        delete updated[productId];
        return updated;
      });
      fetchProducts();
    } catch (error: any) {
      console.error("Error updating stock:", error);
      toast.error("Failed to update stock");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      buyingPrice: "",
      image: "",
      category: "",
      description: "",
      benefits: "",
      stock: "",
    });
    setEditingProduct(null);
    setImagePreview("");
  };

  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </DialogTitle>
                <DialogDescription>
                  {editingProduct
                    ? "Update product information"
                    : "Fill in the details to add a new product"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price (৳) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="buyingPrice">Buying Price (৳)</Label>
                    <Input
                      id="buyingPrice"
                      name="buyingPrice"
                      type="number"
                      value={formData.buyingPrice}
                      onChange={handleInputChange}
                      min="0"
                      placeholder="Enter buying price"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used to calculate profit
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="category"
                        name="category"
                        list="categories-list"
                        value={formData.category}
                        onChange={handleInputChange}
                        placeholder="Type or select category..."
                        required
                        className="w-full"
                      />
                      <datalist id="categories-list">
                        {existingCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type a new category or select from existing ones
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock">
                      Stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stock"
                      name="stock"
                      type="number"
                      value={formData.stock}
                      onChange={handleInputChange}
                      required
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Product Image</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploading}
                        className="cursor-pointer"
                      />
                      {uploading && (
                        <span className="text-sm text-muted-foreground">
                          Uploading...
                        </span>
                      )}
                    </div>
                    {(imagePreview || formData.image) && (
                      <div className="relative inline-block">
                        <img
                          src={imagePreview || formData.image}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-md border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              "https://via.placeholder.com/128";
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={clearImage}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    {formData.image && (
                      <p className="text-xs text-muted-foreground">
                        Image URL: {formData.image.substring(0, 50)}...
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Upload an image file or enter a URL below
                    </p>
                    <Input
                      id="image"
                      name="image"
                      type="url"
                      value={formData.image}
                      onChange={handleInputChange}
                      placeholder="Or enter image URL manually"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Product description..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="benefits">Benefits (comma-separated)</Label>
                  <Input
                    id="benefits"
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleInputChange}
                    placeholder="Benefit 1, Benefit 2, Benefit 3"
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingProduct ? "Update Product" : "Add Product"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
              {searchQuery
                ? "No products found matching your search"
                : "No products found"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Benefits</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product._id}>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell className="uppercase">
                        {product.category}
                      </TableCell>
                      <TableCell>৳{product.price}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            defaultValue={product.stock}
                            onChange={(e) =>
                              handleStockChange(product._id, e.target.value)
                            }
                            className="w-20"
                            min="0"
                          />
                          {stockUpdates[product._id] !== undefined && (
                            <Button
                              size="sm"
                              onClick={() => handleStockUpdate(product._id)}
                            >
                              Update
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://via.placeholder.com/100";
                            }}
                          />
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            No image
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {product.description || "No description"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {product.benefits && product.benefits.length > 0 ? (
                            product.benefits.slice(0, 2).map((benefit, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                              >
                                {benefit}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              None
                            </span>
                          )}
                          {product.benefits && product.benefits.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{product.benefits.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(product._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
