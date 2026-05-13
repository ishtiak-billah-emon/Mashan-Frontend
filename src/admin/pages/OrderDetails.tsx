import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { MANUAL_ORDERS_EVENT } from "../utils/manualOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function OrderDetails() {
  const { status } = useParams<{ status: string }>();
  const navigate = useNavigate();
  const [onlineOrders, setOnlineOrders] = useState<Order[]>([]);
  const [offlineOrders, setOfflineOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      setError("Admin session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [onlineRes, offlineRes] = await Promise.all([
        axios.get<Order[]>(`${API_BASE}/api/admin/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<Order[]>(`${API_BASE}/api/admin/manual-orders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      setOnlineOrders(onlineRes.data || []);
      setOfflineOrders(offlineRes.data || []);
      setError(null);
    } catch (err: any) {
      console.error("OrderDetails fetch error:", err);
      setError(err?.response?.data?.message || "Failed to load orders");
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

  const filteredOrders = useMemo(() => {
    if (!status) return [];
    return orders
      .filter((order) => order.status === status)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [orders, status]);

  const totalAmount = useMemo(() => {
    return filteredOrders.reduce((sum, order) => {
      const orderTotal = order.items.reduce(
        (s, item) => s + item.quantity * item.price,
        0,
      );
      return sum + orderTotal;
    }, 0);
  }, [filteredOrders]);

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (
    !status ||
    !["delivered", "pending", "confirmed", "packaging", "cancelled"].includes(
      status,
    )
  ) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Invalid status</p>
        <Button onClick={() => navigate("/admin/accounts")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Accounts
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/accounts")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold capitalize">{status} Orders</h1>
            <p className="text-muted-foreground mt-1">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "order" : "orders"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className={`${getStatusColor(status)}`}>
          <CardTitle className="capitalize flex items-center justify-between">
            <span>
              {status} Orders ({filteredOrders.length})
            </span>
            <span className="text-lg font-semibold">
              ৳{totalAmount.toFixed(2)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No {status} orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const orderTotal = order.items.reduce(
                      (sum, item) => sum + item.quantity * item.price,
                      0,
                    );
                    return (
                      <TableRow key={order._id}>
                        <TableCell className="font-medium">
                          {order.orderId || order._id.slice(-8)}
                        </TableCell>
                        <TableCell>{order.customer.name}</TableCell>
                        <TableCell>{order.customer.phone}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(order.createdAt)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              order.source === "online"
                                ? "bg-sky-100 text-sky-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {order.source === "online" ? "Online" : "Offline"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="text-xs">
                                {item.name || item.productName || "Product"} ×{" "}
                                {item.quantity}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-xs text-muted-foreground">
                                +{order.items.length - 2} more
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize text-sm">
                          {order.paymentMethod || "COD"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ৳{orderTotal.toFixed(2)}
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
    </div>
  );
}
