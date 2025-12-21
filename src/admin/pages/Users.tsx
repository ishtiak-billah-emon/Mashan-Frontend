import { useEffect, useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Consumer {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
  createdAt: string;
}

export default function Users() {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [filtered, setFiltered] = useState<Consumer[]>([]);
  const [loading, setLoading] = useState(true);
  const [phoneSearch, setPhoneSearch] = useState("");

  useEffect(() => {
    fetchConsumers();
  }, []);

  useEffect(() => {
    if (phoneSearch.trim()) {
      fetchConsumersByPhone(phoneSearch);
    } else {
      setFiltered(consumers);
    }
  }, [phoneSearch, consumers]);

  const fetchConsumers = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/consumers`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setConsumers(res.data);
      setFiltered(res.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to load consumers");
      setLoading(false);
    }
  };

  const fetchConsumersByPhone = async (phone: string) => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/consumers`, {
        params: { phone },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiltered(res.data);
    } catch (error) {
      toast.error("Search failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading consumers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Consumers</h1>

        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Search by phone"
            value={phoneSearch}
            onChange={(e) => setPhoneSearch(e.target.value)}
            className="w-56"
          />

          {phoneSearch && (
            <Button variant="outline" onClick={() => setPhoneSearch("")}>
              Clear
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Consumers ({filtered.length})</CardTitle>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No consumers found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Total Orders</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.phone}</TableCell>
                      <TableCell>{c.email || "N/A"}</TableCell>
                      <TableCell>{c.address}</TableCell>
                      <TableCell>{c.city}</TableCell>
                      <TableCell>{c.ordersCount}</TableCell>
                      <TableCell>৳{c.totalSpent}</TableCell>
                      <TableCell>
                        {new Date(c.createdAt).toLocaleDateString()}
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
