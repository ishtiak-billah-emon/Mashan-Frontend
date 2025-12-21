import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MANUAL_ORDERS_EVENT } from "../utils/manualOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

type SalesChannel = "online" | "offline";

type OrderItem = {
  _id?: string;
  productId?: string;
  name?: string;
  productName?: string;
  category?: string;
  quantity: number;
  price: number;
};

type Customer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
};

type Order = {
  _id: string;
  orderId?: string;
  customer: Customer;
  items: OrderItem[];
  subtotal?: number;
  shipping?: number;
  total: number;
  paymentMethod?: string;
  status: "delivered" | "pending" | "cancelled" | "confirmed" | "packaging";
  source?: SalesChannel;
  createdAt: string;
  note?: string;
};

// Simple date helpers
function startOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}
function endOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

// Minimal SVG line chart for last N days
function MiniLineChart({ points }: { points: number[] }) {
  const width = 300;
  const height = 80;
  const max = Math.max(...points, 1);
  const step = width / Math.max(points.length - 1, 1);
  const coords = points
    .map((v, i) => `${i * step},${height - (v / max) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline fill="none" stroke="#06b6d4" strokeWidth={2} points={coords} />
      {points.map((v, i) => {
        const cx = i * step;
        const cy = height - (v / max) * height;
        return <circle key={i} cx={cx} cy={cy} r={2} fill="#075985" />;
      })}
    </svg>
  );
}

type Product = {
  _id: string;
  buyingPrice?: number;
};

export default function Accounts() {
  const [onlineOrders, setOnlineOrders] = useState<Order[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return startOfDayIso(d);
  });
  const [to, setTo] = useState<string>(() => endOfDayIso(new Date()));
  const [quickRange, setQuickRange] = useState<"7" | "28" | "30" | null>("7");

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setError("Admin session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [onlineRes, offlineRes, productsRes] = await Promise.all([
        axios.get<Order[]>(`${API_BASE}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Order[]>(`${API_BASE}/api/admin/manual-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Product[]>(`${API_BASE}/api/admin/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setOnlineOrders(onlineRes.data || []);
      setOfflineOrders(offlineRes.data || []);
      setProducts(productsRes.data || []);
      setError(null);
    } catch (err: any) {
      console.error("Accounts fetch error:", err);
      setError(err?.response?.data?.message || "Failed to load sales data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => fetchOrders();
    window.addEventListener(MANUAL_ORDERS_EVENT, handler);
    return () => {
      window.removeEventListener(MANUAL_ORDERS_EVENT, handler);
    };
  }, [fetchOrders]);

  const orders = useMemo(() => {
    const normalizedOnline = onlineOrders.map((order) => ({
      ...order,
      source: (order.source ?? "online") as SalesChannel,
    }));
    const normalizedOffline = offlineOrders.map((order) => ({
      ...order,
      source: (order.source ?? "offline") as SalesChannel,
    }));
    return [...normalizedOnline, ...normalizedOffline];
  }, [onlineOrders, offlineOrders]);

  // adjust quickRange
  useEffect(() => {
    if (!quickRange) return;
    const d = new Date();
    const n = parseInt(quickRange, 10);
    const fromD = new Date(d);
    fromD.setDate(d.getDate() - (n - 1));
    setFrom(startOfDayIso(fromD));
    setTo(endOfDayIso(d));
  }, [quickRange]);

  const salesOrders = useMemo(() => {
    const f = new Date(from);
    const t = new Date(to);
    return orders.filter((o) => {
      const od = new Date(o.createdAt);
      if (od < f || od > t) return false;
      if (o.source === "online") {
        return o.status === "delivered";
      }
      return true;
    });
  }, [orders, from, to]);

  // Create a map of productId -> buyingPrice for quick lookup
  const productBuyingPriceMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((product) => {
      if (product.buyingPrice !== undefined && product.buyingPrice !== null) {
        map.set(product._id, product.buyingPrice);
      }
    });
    return map;
  }, [products]);

  const totals = useMemo(() => {
    let totalQty = 0;
    let totalAmount = 0;
    let totalProfit = 0;
    const byCategory = new Map<string, { quantity: number; amount: number; profit: number }>();
    const byProduct = new Map<string, { quantity: number; amount: number; profit: number; category: string }>();

    for (const o of salesOrders) {
      for (const it of o.items) {
        totalQty += it.quantity;
        const itemAmount = it.quantity * it.price;
        totalAmount += itemAmount;

        // Calculate profit: (selling price - buying price) * quantity
        const buyingPrice = it.productId ? productBuyingPriceMap.get(it.productId) || 0 : 0;
        const itemProfit = (it.price - buyingPrice) * it.quantity;
        totalProfit += itemProfit;

        const categoryKey = it.category || "Uncategorized";
        const productKey = it.productName || it.name || "Unnamed Product";

        const c = byCategory.get(categoryKey) ?? { quantity: 0, amount: 0, profit: 0 };
        c.quantity += it.quantity;
        c.amount += itemAmount;
        c.profit += itemProfit;
        byCategory.set(categoryKey, c);

        const p =
          byProduct.get(productKey) ?? { quantity: 0, amount: 0, profit: 0, category: categoryKey };
        p.quantity += it.quantity;
        p.amount += itemAmount;
        p.profit += itemProfit;
        byProduct.set(productKey, p);
      }
    }

    const categories = Array.from(byCategory.entries())
      .map(([category, vals]) => ({ category, ...vals }))
      .sort((a, b) => b.amount - a.amount);

    const productList = Array.from(byProduct.entries())
      .map(([productName, vals]) => ({ productName, ...vals }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalQty,
      totalAmount: Number(totalAmount.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      categories,
      products: productList,
    };
  }, [salesOrders, productBuyingPriceMap]);

  const channelSplit = useMemo(() => {
    const base = {
      online: { amount: 0, quantity: 0, orders: 0 },
      offline: { amount: 0, quantity: 0, orders: 0 },
    };

    for (const order of salesOrders) {
      const channel = order.source ?? "online";
      let orderAmount = 0;
      let orderQty = 0;
      for (const it of order.items) {
        orderQty += it.quantity;
        orderAmount += it.quantity * it.price;
      }
      base[channel].orders += 1;
      base[channel].quantity += orderQty;
      base[channel].amount += orderAmount;
    }

    return {
      online: {
        amount: Number(base.online.amount.toFixed(2)),
        quantity: base.online.quantity,
        orders: base.online.orders,
      },
      offline: {
        amount: Number(base.offline.amount.toFixed(2)),
        quantity: base.offline.quantity,
        orders: base.offline.orders,
      },
    };
  }, [salesOrders]);

  function buildTimeseries(days: number) {
    const arr: number[] = [];
    const now = new Date(to);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      let dayAmount = 0;
      for (const o of salesOrders) {
        const od = new Date(o.createdAt);
        if (od >= start && od <= end) {
          for (const it of o.items) {
            dayAmount += it.quantity * it.price;
          }
        }
      }
      arr.push(Number(dayAmount.toFixed(2)));
    }
    return arr;
  }

  const last7 = useMemo(() => buildTimeseries(7), [salesOrders, to]);
  const last28 = useMemo(() => buildTimeseries(28), [salesOrders, to]);

  // Order Details by Status
  const orderDetailsByStatus = useMemo(() => {
    const statusGroups: Record<string, { orders: Order[]; count: number; total: number }> = {
      delivered: { orders: [], count: 0, total: 0 },
      pending: { orders: [], count: 0, total: 0 },
      confirmed: { orders: [], count: 0, total: 0 },
      packaging: { orders: [], count: 0, total: 0 },
      cancelled: { orders: [], count: 0, total: 0 },
    };

    orders.forEach((order) => {
      const status = order.status || "pending";
      if (statusGroups[status]) {
        const orderTotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
        statusGroups[status].orders.push(order);
        statusGroups[status].count += 1;
        statusGroups[status].total += orderTotal;
      }
    });

    // Sort orders by date (newest first) within each status
    Object.keys(statusGroups).forEach((status) => {
      statusGroups[status].orders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });

    return statusGroups;
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "pending":
        return "bg-red-50 text-red-700 border-red-200";
      case "confirmed":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "packaging":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "cancelled":
        return "bg-gray-50 text-gray-700 border-gray-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading sales analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-col gap-4 lg:flex-row">
        <h1 className="text-3xl font-bold">Accounts & Sales Analytics</h1>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium">From</label>
          <input
            type="date"
            value={new Date(from).toISOString().slice(0, 10)}
            onChange={(e) => {
              const d = new Date(e.target.value);
              setFrom(startOfDayIso(d));
              setQuickRange(null);
            }}
            className="border px-2 py-1 rounded"
          />
          <label className="text-sm font-medium">To</label>
          <input
            type="date"
            value={new Date(to).toISOString().slice(0, 10)}
            onChange={(e) => {
              const d = new Date(e.target.value);
              setTo(endOfDayIso(d));
              setQuickRange(null);
            }}
            className="border px-2 py-1 rounded"
          />
          <div className="flex space-x-1">
            <button
              className={`px-3 py-1 rounded ${quickRange === "7" ? "bg-sky-600 text-white" : "border"}`}
              onClick={() => setQuickRange("7")}
            >
              7d
            </button>
            <button
              className={`px-3 py-1 rounded ${quickRange === "28" ? "bg-sky-600 text-white" : "border"}`}
              onClick={() => setQuickRange("28")}
            >
              28d
            </button>
            <button
              className={`px-3 py-1 rounded ${quickRange === "30" ? "bg-sky-600 text-white" : "border"}`}
              onClick={() => setQuickRange("30")}
            >
              30d
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* First Section: Order Details */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Order Details</h2>
          <p className="text-muted-foreground">
            Click on any status card to view detailed orders
          </p>
        </div>

        {/* Status Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(orderDetailsByStatus).map(([status, data]) => (
            <Card
              key={status}
              className={`border-2 ${getStatusColor(status)} cursor-pointer transition-all hover:shadow-lg hover:scale-105`}
              onClick={() => navigate(`/admin/order-details/${status}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{data.count}</div>
                <div className="text-xs opacity-75">Orders</div>
                <div className="text-lg font-semibold mt-2">
                  ৳{data.total.toFixed(2)}
                </div>
                <div className="text-xs opacity-75">Total Amount</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t my-8"></div>

      {/* Sales Analytics Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Sales Analytics</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">Total Quantity Sold</div>
          <div className="text-2xl font-semibold">{totals.totalQty}</div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">Total Sales Amount</div>
          <div className="text-2xl font-semibold">৳{totals.totalAmount.toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">Total Profit</div>
          <div className="text-2xl font-semibold text-green-600">
            ৳{totals.totalProfit.toFixed(2)}
          </div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">Sales Orders</div>
          <div className="text-2xl font-semibold">{salesOrders.length}</div>
        </div>
        <div className="p-4 border rounded bg-white">
          <div className="text-sm text-gray-500">Offline Sales Amount</div>
          <div className="text-2xl font-semibold text-emerald-700">
            ৳{channelSplit.offline.amount.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">
            {channelSplit.offline.orders} orders · {channelSplit.offline.quantity} items
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded bg-white space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Online sales (website)</h3>
            <span className="text-lg font-semibold">৳{channelSplit.online.amount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500">
            Delivered website orders · {channelSplit.online.orders} orders · {channelSplit.online.quantity} items
          </p>
        </div>
        <div className="p-4 border rounded bg-white space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Offline sales (manual)</h3>
            <span className="text-lg font-semibold">৳{channelSplit.offline.amount.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500">
            Confirmed manual orders · {channelSplit.offline.orders} orders · {channelSplit.offline.quantity} items
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-4 border rounded bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Sales Trend (last 7 days)</h2>
            <div className="text-sm text-gray-500">Total: ৳{last7.reduce((a, b) => a + b, 0).toFixed(2)}</div>
          </div>
          <MiniLineChart points={last7} />
        </div>

        <div className="p-4 border rounded bg-white space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Sales Trend (last 28 days)</h2>
            <div className="text-sm text-gray-500">Total: ৳{last28.reduce((a, b) => a + b, 0).toFixed(2)}</div>
          </div>
          <MiniLineChart points={last28} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded bg-white">
          <h3 className="font-semibold mb-3">Category-wise Sales</h3>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-600">
                <th>Category</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Amount (৳)</th>
                <th className="text-right">Profit (৳)</th>
              </tr>
            </thead>
            <tbody>
              {totals.categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-gray-500">
                    No data
                  </td>
                </tr>
              ) : (
                totals.categories.map((c) => (
                  <tr key={c.category} className="border-t">
                    <td className="py-2">{c.category}</td>
                    <td className="py-2 text-right">{c.quantity}</td>
                    <td className="py-2 text-right">৳{c.amount.toFixed(2)}</td>
                    <td className="py-2 text-right text-green-600">৳{c.profit.toFixed(2)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border rounded bg-white">
          <h3 className="font-semibold mb-3">Top Selling Products</h3>
          <ol className="list-decimal list-inside text-sm space-y-2">
            {totals.products.length === 0 ? (
              <li className="text-gray-500">No sales yet</li>
            ) : (
              totals.products.slice(0, 10).map((p) => (
                <li key={p.productName} className="flex justify-between">
                  <span>
                    <div className="font-medium">{p.productName}</div>
                    <div className="text-xs text-gray-500">{p.category}</div>
                  </span>
                  <span className="text-right">
                    <div>Qty: {p.quantity}</div>
                    <div>৳{p.amount.toFixed(2)}</div>
                    <div className="text-xs text-green-600">Profit: ৳{p.profit.toFixed(2)}</div>
                  </span>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>

      <div className="p-4 border rounded bg-white">
        <h3 className="font-semibold mb-3">Sales Orders (delivered online + offline)</h3>
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-600">
                <th>Order</th>
                <th>Date</th>
                <th>Channel</th>
                <th>Status</th>
                <th>Items</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {salesOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gray-500">
                    No sales orders in this range
                  </td>
                </tr>
                ) : (
                salesOrders.slice(0, 50).map((o) => {
                  const amt = o.items.reduce((s, it) => s + it.quantity * it.price, 0);
                  return (
                    <tr key={o._id} className="border-t">
                      <td className="py-2 font-medium">{o.orderId || o._id}</td>
                      <td className="py-2">{new Date(o.createdAt).toLocaleString()}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            o.source === "online"
                              ? "bg-sky-50 text-sky-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {o.source === "online" ? "Online" : "Offline"}
                        </span>
                      </td>
                      <td className="py-2 capitalize text-sm">{o.status}</td>
                      <td className="py-2">
                        {o.items.map((it, idx) => (
                          <div key={it._id || `${it.name || it.productName}-${idx}`} className="text-xs">
                            {(it.name || it.productName || "Product")} × {it.quantity} (
                            {it.category || "Uncategorized"})
                          </div>
                        ))}
                      </td>
                      <td className="py-2 text-right font-semibold">₹{amt.toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Showing up to 50 latest sales orders across both channels.
        </div>
      </div>
    </div>
  );
}