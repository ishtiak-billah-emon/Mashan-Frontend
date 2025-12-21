import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ChevronsUpDown, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  API_BASE,
  createManualOrder,
  emitManualOrdersUpdated,
  fetchManualOrders,
  ManualOrder as OfflineOrder,
  ManualOrderItemInput,
  ManualOrderInput,
} from "../utils/manualOrders";

const emptyConsumer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
};

type AdminProductOption = {
  _id: string;
  name: string;
  category?: string;
  price?: number;
  buyingPrice?: number;
  stock?: number;
  image?: string;
};

type ManualOrderFormItem = ManualOrderItemInput & {
  productStock?: number;
  buyingPrice?: number;
};

const createEmptyItem = (): ManualOrderFormItem => ({
  productId: "",
  productName: "",
  category: "",
  quantity: 1,
  price: 0,
  buyingPrice: 0,
  productStock: undefined,
});

export default function ManualOrder() {
  const [consumer, setConsumer] = useState(emptyConsumer);
  const [items, setItems] = useState<ManualOrderFormItem[]>([createEmptyItem()]);
  const [shipping, setShipping] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [manualOrders, setManualOrders] = useState<OfflineOrder[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [downloadingPosId, setDownloadingPosId] = useState<string | null>(null);
  const productSearchCache = useRef<Map<string, AdminProductOption[]>>(new Map());
  const productSearchController = useRef<AbortController | null>(null);

  const loadManualOrders = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("Admin session expired. Please log in again.");
      return;
    }

    try {
      setFetchingOrders(true);
      const data = await fetchManualOrders(token);
      setManualOrders(data);
    } catch (error: any) {
      toast.error(error?.message || "Unable to load manual orders");
    } finally {
      setFetchingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadManualOrders();
  }, [loadManualOrders]);

  useEffect(() => {
    return () => {
      productSearchController.current?.abort();
    };
  }, []);

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => {
        if (!item.productName || !item.category) return sum;
        return sum + Number(item.quantity || 0) * Number(item.price || 0);
      }, 0),
    [items]
  );
  const total = useMemo(() => subtotal + Number(shipping || 0), [shipping, subtotal]);

  const stats = useMemo(() => {
    return manualOrders.reduce(
      (acc, order) => {
        acc.amount += order.total;
        acc.quantity += order.items.reduce((sum, item) => sum + item.quantity, 0);
        return acc;
      },
      { amount: 0, quantity: 0 }
    );
  }, [manualOrders]);

  const handleConsumerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConsumer((prev) => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (
    index: number,
    field: keyof ManualOrderFormItem,
    value: string | number
  ) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        if (field === "quantity") {
          const parsed = Math.max(1, Number(value) || 1);
          const limited =
            typeof item.productStock === "number"
              ? Math.min(parsed, item.productStock)
              : parsed;
          return { ...item, quantity: limited };
        }

        if (field === "price") {
          const parsedPrice = Math.max(0, Number(value) || 0);
          return { ...item, price: parsedPrice };
        }

        if (field === "buyingPrice") {
          const parsedBuyingPrice = Math.max(0, Number(value) || 0);
          return { ...item, buyingPrice: parsedBuyingPrice };
        }

        return { ...item, [field]: value };
      })
    );
  };

  const handleProductSelect = useCallback((index: number, product: AdminProductOption) => {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;

        const stock =
          typeof product.stock === "number" && !Number.isNaN(product.stock)
            ? product.stock
            : undefined;
        const baseQuantity = Math.max(1, item.quantity || 1);
        const adjustedQuantity =
          stock !== undefined ? (stock > 0 ? Math.min(baseQuantity, stock) : 1) : baseQuantity;

        const resolvedPrice =
          typeof product.price === "number" && !Number.isNaN(product.price)
            ? product.price
            : item.price;

        const resolvedBuyingPrice =
          typeof product.buyingPrice === "number" && !Number.isNaN(product.buyingPrice)
            ? product.buyingPrice
            : item.buyingPrice || 0;

        return {
          ...item,
          productId: product._id,
          productName: product.name,
          category: product.category || "",
          price: resolvedPrice,
          buyingPrice: resolvedBuyingPrice,
          quantity: adjustedQuantity,
          productStock: stock,
        };
      })
    );
  }, []);

  const searchProducts = useCallback(
    async (query: string) => {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        toast.error("Admin session expired. Please log in again.");
        return [];
      }

      const trimmedQuery = query.trim();
      if (!trimmedQuery || trimmedQuery.length < 2) {
        return [];
      }

      if (productSearchCache.current.has(trimmedQuery)) {
        return productSearchCache.current.get(trimmedQuery)!;
      }

      try {
        productSearchController.current?.abort();
        const controller = new AbortController();
        productSearchController.current = controller;

        const response = await fetch(
          `${API_BASE}/api/admin/products/search?q=${encodeURIComponent(trimmedQuery)}&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to search products");
        }

        const data = (await response.json()) as AdminProductOption[];
        productSearchCache.current.set(trimmedQuery, data);
        return data;
      } catch (error: any) {
        if (error?.name === "AbortError") {
          return [];
        }
        console.error("Product search error:", error);
        toast.error(error?.message || "Unable to search products");
        return [];
      } finally {
        productSearchController.current = null;
      }
    },
    []
  );

  const addItemRow = () => setItems((prev) => [...prev, createEmptyItem()]);

  const removeItemRow = (index: number) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const resetForm = () => {
    setConsumer(emptyConsumer);
    setItems([createEmptyItem()]);
    setShipping("0");
    setPaymentMethod("cash");
    setNote("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredConsumerFields: (keyof typeof consumer)[] = [
      "name",
      "phone",
      "address",
      "city",
    ];

    for (const field of requiredConsumerFields) {
      if (!consumer[field].trim()) {
        toast.error(`Please fill ${field} field`);
        return;
      }
    }

    const formattedItems = items
      .filter((item) => item.productId && item.productName?.trim() && item.category.trim())
      .map(({ productStock, ...item }) => ({
        productId: item.productId!,
        productName: item.productName?.trim() || "",
        category: item.category.trim(),
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
      }));

    if (!formattedItems.length) {
      toast.error("Select at least one product from your catalog");
      return;
    }

    const stockIssue = items.find(
      (item) =>
        item.productId &&
        typeof item.productStock === "number" &&
        item.quantity > item.productStock
    );

    if (stockIssue) {
      toast.error(
        `Only ${stockIssue.productStock} units available for ${
          stockIssue.productName || "the selected product"
        }`
      );
      return;
    }

    const payload: ManualOrderInput = {
      consumer: {
        name: consumer.name.trim(),
        phone: consumer.phone.trim(),
        email: consumer.email.trim() || undefined,
        address: consumer.address.trim(),
        city: consumer.city.trim(),
      },
      items: formattedItems,
      shipping: Number(shipping) || 0,
      paymentMethod,
      note: note.trim() || undefined,
    };

    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("Admin session expired. Please log in again.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createManualOrder(token, payload);
      toast.success("Manual order recorded");
      resetForm();
      await loadManualOrders();
      emitManualOrdersUpdated();
    } catch (error: any) {
      toast.error(error?.message || "Unable to save manual order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPos = async (orderId: string, friendlyId: string) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("Admin session expired. Please log in again.");
      return;
    }

    try {
      setDownloadingPosId(orderId);
      const response = await fetch(`${API_BASE}/api/admin/orders/${orderId}/pos`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to download POS");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${friendlyId}-pos.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error("POS download error:", error);
      toast.error(error?.message || "Unable to download POS");
    } finally {
      setDownloadingPosId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manual / Offline Orders</h1>
          <p className="text-sm text-muted-foreground">
            Record walk-in, phone or WhatsApp orders. All manual entries get a confirmed status.
          </p>
        </div>
        <div className="rounded border p-3 text-right">
          <div className="text-xs uppercase text-gray-500">Offline revenue (all time)</div>
          <div className="text-2xl font-semibold">৳{stats.amount.toFixed(2)}</div>
          <div className="text-xs text-gray-500">
            {manualOrders.length} orders · {stats.quantity} items
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>New Manual Order</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Customer Name *</Label>
                  <Input id="name" name="name" value={consumer.name} onChange={handleConsumerChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={consumer.phone}
                    onChange={handleConsumerChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={consumer.email}
                    onChange={handleConsumerChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" name="city" value={consumer.city} onChange={handleConsumerChange} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    rows={2}
                    value={consumer.address}
                    onChange={(e) =>
                      setConsumer((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Order Items *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItemRow}>
                    + Add product
                  </Button>
                </div>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="rounded border p-3 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:items-start md:gap-2"
                    >
                      <div className="space-y-1 md:col-span-3">
                        <Label className="text-xs text-muted-foreground">Product</Label>
                        <ProductCombobox
                          item={item}
                          onSelect={(product) => handleProductSelect(index, product)}
                          searchProducts={searchProducts}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Category</Label>
                        <Input
                          value={item.category}
                          onChange={(e) => handleItemChange(index, "category", e.target.value)}
                          placeholder="Auto-filled after selecting product"
                          disabled={!item.productId}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs text-muted-foreground">Quantity</Label>
                        <Input
                          type="number"
                          min={1}
                          value={item.quantity}
                          disabled={!item.productId}
                          onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        />
                        {typeof item.productStock === "number" && (
                          <p
                            className={cn(
                              "text-xs",
                              item.quantity > item.productStock ? "text-destructive" : "text-muted-foreground"
                            )}
                          >
                            In stock: {item.productStock}
                          </p>
                        )}
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Unit Price (৳)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.price}
                          disabled={!item.productId}
                          onChange={(e) => handleItemChange(index, "price", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs text-muted-foreground">Base Price (৳)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={item.buyingPrice || 0}
                          disabled={!item.productId}
                          onChange={(e) => handleItemChange(index, "buyingPrice", Number(e.target.value))}
                          placeholder="Buying price"
                        />
                        <p className="text-xs text-muted-foreground">For profit calculation</p>
                      </div>
                      <div className="flex items-end justify-between gap-2 md:col-span-2">
                        <div className="text-sm font-semibold">
                          ৳{(Number(item.quantity || 0) * Number(item.price || 0)).toFixed(2)}
                        </div>
                        {items.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItemRow(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Shipping (৳)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="bank">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded border bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Subtotal</p>
                  <p className="text-xl font-semibold">৳{subtotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total (incl. shipping)</p>
                  <p className="text-2xl font-bold text-primary">৳{total.toFixed(2)}</p>
                </div>
                <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Manual Order"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Performance Snapshot</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Orders logged</p>
              <p className="text-2xl font-semibold">{manualOrders.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items sold</p>
              <p className="text-2xl font-semibold">{stats.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Average ticket size</p>
              <p className="text-2xl font-semibold">
                ৳{manualOrders.length ? (stats.amount / manualOrders.length).toFixed(2) : "0.00"}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              Metrics update automatically from the offline orders saved in the database, so everyone on the
              admin team sees the same numbers.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Orders ({manualOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingOrders ? (
            <div className="py-10 text-center text-muted-foreground">Loading manual orders...</div>
          ) : manualOrders.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No manual orders recorded yet</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>POS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualOrders.map((order) => (
                    <TableRow key={order._id}>
                      <TableCell className="font-medium">{order.orderId}</TableCell>
                      <TableCell>
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-xs text-muted-foreground">{order.customer.phone}</div>
                        <div className="text-xs text-muted-foreground">
                          {order.customer.city} • {order.customer.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item, idx) => (
                            <div key={item._id || `${item.productName || item.name}-${idx}`} className="text-xs">
                              {item.productName || item.name || "Product"} × {item.quantity} (
                              {item.category || "Uncategorized"})
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">৳{order.total.toFixed(2)}</TableCell>
                      <TableCell className="uppercase text-sm">{order.paymentMethod}</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {new Date(order.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleDownloadPos(order._id, order.orderId || order._id)}
                          disabled={downloadingPosId === order._id}
                        >
                          {downloadingPosId === order._id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Preparing...
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4" />
                              Download
                            </>
                          )}
                        </Button>
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

type ProductComboboxProps = {
  item: ManualOrderFormItem;
  onSelect: (product: AdminProductOption) => void;
  searchProducts: (query: string) => Promise<AdminProductOption[]>;
};

function ProductCombobox({ item, onSelect, searchProducts }: ProductComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [options, setOptions] = useState<AdminProductOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = window.setTimeout(() => setSearchQuery(inputValue.trim()), 300);
    return () => window.clearTimeout(handler);
  }, [inputValue, open]);

  useEffect(() => {
    if (!open) return;
    if (searchQuery.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    searchProducts(searchQuery)
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchQuery, open, searchProducts]);

  useEffect(() => {
    if (!open) {
      setInputValue("");
      setSearchQuery("");
      setOptions([]);
      setLoading(false);
    }
  }, [open]);

  const handleSelect = (value: string) => {
    const selected = options.find((option) => option._id === value);
    if (selected) {
      onSelect(selected);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-1">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {item.productId && item.productName ? (
              <div className="flex flex-col items-start text-left">
                <span className="font-medium">{item.productName}</span>
                <span className="text-xs text-muted-foreground">
                  {item.category || "Uncategorized"}
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground">Search & select product</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0 sm:w-[420px]">
          <Command shouldFilter={false}>
            <CommandInput
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Type at least 2 letters..."
            />
            <CommandList>
              <CommandEmpty>
                {loading ? (
                  <span className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching products...
                  </span>
                ) : inputValue.trim().length < 2 ? (
                  "Start typing to search products"
                ) : (
                  "No products found"
                )}
              </CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option._id}
                    value={option._id}
                    onSelect={handleSelect}
                    className="flex items-start gap-2"
                  >
                    <Check
                      className={cn(
                        "mt-1 h-4 w-4 text-primary",
                        item.productId === option._id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.category || "Uncategorized"} · ৳
                        {typeof option.price === "number"
                          ? option.price.toFixed(2)
                          : "0.00"}{" "}
                        · Stock {typeof option.stock === "number" ? option.stock : "—"}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {item.productId ? (
        <p className="text-xs text-muted-foreground">
          Linked to inventory · Stock:{" "}
          {typeof item.productStock === "number" ? item.productStock : "—"}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">Link a product to update stock</p>
      )}
    </div>
  );
}