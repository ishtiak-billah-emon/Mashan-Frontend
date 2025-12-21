import { useEffect, useState } from "react";
import axios from "axios";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// TYPE FOR PRODUCT FROM BACKEND
interface Product {
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

// Converts Mongo product to frontend-friendly format
const toFrontendProduct = (p: Product) => ({
  id: p._id,
  name: p.name,
  price: p.price,
  image: p.image,
  category: p.category,
  description: p.description,
  benefits: p.benefits,
  stock: p.stock,
  discountAmount: p.discountAmount,
  isOnSale: p.isOnSale,
});

export default function Shop() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [loading, setLoading] = useState(true);

  // 🔥 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch products from backend
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/products`)
      .then((res) => {
        const formatted = res.data.map(toFrontendProduct);
        // Debug: Log products to check image URLs
        console.log("Products with images:", formatted.map(p => ({ name: p.name, image: p.image })));
        setProducts(formatted);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setLoading(false);
      });
  }, []);

  // Reset pagination when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, sortBy]);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  // FILTER + SORT
  const filteredProducts = products
    .filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.category === selectedCategory;

      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price-low") return a.price - b.price;
      if (sortBy === "price-high") return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  // 🔥 PAGINATION CALCULATION
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + itemsPerPage);

  if (loading)
    return (
      <div className="text-center py-16">
        <p className="text-xl">Loading products...</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary mb-4">Our Products</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Explore our premium collection of organic products
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow-card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "All Categories" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        <div className="flex gap-2 mt-4">
          {selectedCategory !== "all" && (
            <Button variant="secondary" size="sm" onClick={() => setSelectedCategory("all")}>
              {selectedCategory} ✕
            </Button>
          )}
          {searchQuery && (
            <Button variant="secondary" size="sm" onClick={() => setSearchQuery("")}>
              "{searchQuery}" ✕
            </Button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-10 gap-2">
            <Button
              variant="outline"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              Prev
            </Button>

            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? "default" : "outline"}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-muted-foreground">
            No products found matching your criteria.
          </p>
          <Button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
