import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface OrderItem {
  _id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
}

interface Order {
  _id: string;
  orderId: string;
  customer: Customer;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: "pending" | "confirmed" | "packaging" | "delivered" | "cancelled";
  source?: "online" | "offline";
  createdAt: string;
  updatedAt: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-red-50 hover:bg-red-100 border-l-4 border-red-500";
    case "confirmed":
      return "bg-yellow-50 hover:bg-yellow-100 border-l-4 border-yellow-500";
    case "packaging":
      return "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500";
    case "delivered":
      return "bg-green-50 hover:bg-green-100 border-l-4 border-green-500";
    case "cancelled":
      return "bg-red-950 hover:bg-red-900 border-l-4 border-red-950 text-white";
    default:
      return "bg-gray-50 hover:bg-gray-100";
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

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [phoneSearch, setPhoneSearch] = useState<string>("");
  const [downloadingPosId, setDownloadingPosId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters
  useEffect(() => {
    if (phoneSearch.trim()) {
      fetchOrdersByPhone(phoneSearch);
    } else if (dateFilter) {
      fetchOrdersByDate(dateFilter);
    } else {
      setFilteredOrders(orders);
    }
  }, [phoneSearch, dateFilter, orders]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(res.data);
      setFilteredOrders(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch orders");
      setLoading(false);
    }
  };

  const fetchOrdersByDate = async (date: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/orders`, {
        params: { date },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFilteredOrders(res.data);
    } catch (error) {
      toast.error("Failed to filter orders by date");
    }
  };

  const fetchOrdersByPhone = async (phone: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/orders`, {
        params: { phone },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFilteredOrders(res.data);
    } catch (error) {
      toast.error("Failed to search orders by phone");
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      await axios.patch(
        `${API_BASE}/api/admin/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus as any } : order
        )
      );

      toast.success("Order status updated");
    } catch {
      toast.error("Failed to update order status");
    }
  };

  const handleDownloadPos = async (order: Order) => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      toast.error("Admin session expired");
      return;
    }

    try {
      setDownloadingPosId(order._id);

      const response = await fetch(
        `${API_BASE}/api/admin/orders/${order._id}/pos`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to download POS");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${order.orderId}-pos.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 500);
    } catch (err: any) {
      toast.error(err.message || "POS download failed");
    } finally {
      setDownloadingPosId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders</h1>

        <div className="flex items-center gap-4">
          {/* Phone Search */}
          <Input
            type="text"
            placeholder="Search by phone"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            className="w-48"
          />

          {phoneSearch && (
            <Button variant="outline" onClick={() => setPhoneSearch("")}>
              Clear
            </Button>
          )}

          {/* Date Filter */}
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-48"
          />

          {dateFilter && (
            <Button variant="outline" onClick={() => setDateFilter("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No orders found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>POS</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order._id}
                      className={getStatusColor(order.status)}
                    >
                      <TableCell>{order.orderId}</TableCell>

                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {order.customer.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer.email || "No email"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.customer.address}, {order.customer.city}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{order.customer.phone}</TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          {order.items.map((item) => (
                            <div key={item._id} className="text-sm">
                              {item.name} × {item.quantity} = ৳
                              {item.price * item.quantity}
                            </div>
                          ))}
                        </div>
                      </TableCell>

                      <TableCell className="font-semibold">
                        ৳{order.total}
                      </TableCell>

                      <TableCell className="uppercase">
                        {order.paymentMethod}
                      </TableCell>

                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderStatus(order._id, value)
                          }
                        >
                          <SelectTrigger className="w-36">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="packaging">Packaging</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>{formatDate(order.createdAt)}</TableCell>

                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleDownloadPos(order)}
                          disabled={downloadingPosId === order._id}
                        >
                          {downloadingPosId === order._id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Preparing
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
