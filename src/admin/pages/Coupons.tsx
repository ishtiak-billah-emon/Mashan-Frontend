import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Edit2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

type Coupon = {
  _id: string;
  code: string;
  discountAmount: number;
  remainingUses: number;
  isActive: boolean;
};

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState({
    code: "",
    discountAmount: "",
    remainingUses: "",
    isActive: true,
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      const res = await axios.get(`${API_BASE}/api/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCoupons(res.data);
    } catch (error: any) {
      console.error("Error fetching coupons:", error);
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditing(coupon);
      setForm({
        code: coupon.code,
        discountAmount: coupon.discountAmount.toString(),
        remainingUses: coupon.remainingUses.toString(),
        isActive: coupon.isActive,
      });
    } else {
      setEditing(null);
      setForm({
        code: "",
        discountAmount: "",
        remainingUses: "",
        isActive: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discountAmount || !form.remainingUses) {
      toast.error("Code, discount, and remaining uses are required");
      return;
    }

    const payload = {
      code: form.code,
      discountAmount: Number(form.discountAmount),
      remainingUses: Number(form.remainingUses),
      isActive: form.isActive,
    };

    try {
      const token = localStorage.getItem("admin_token");
      if (editing) {
        await axios.put(
          `${API_BASE}/api/admin/coupons/${editing._id}`,
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        toast.success("Coupon updated");
      } else {
        await axios.post(`${API_BASE}/api/admin/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Coupon created");
      }
      setIsDialogOpen(false);
      fetchCoupons();
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      toast.error(error?.response?.data?.message || "Failed to save coupon");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      const token = localStorage.getItem("admin_token");
      await axios.delete(`${API_BASE}/api/admin/coupons/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Coupon deleted");
      fetchCoupons();
    } catch (error: any) {
      console.error("Error deleting coupon:", error);
      toast.error("Failed to delete coupon");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Coupons</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Edit Coupon" : "Add Coupon"}
              </DialogTitle>
              <DialogDescription>
                Code is case-insensitive on checkout; stored in uppercase.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  value={form.code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="FIRST50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Amount (৳)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    value={form.discountAmount}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, discountAmount: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remaining">Remaining Uses</Label>
                  <Input
                    id="remaining"
                    type="number"
                    min="0"
                    value={form.remainingUses}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, remainingUses: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((p) => ({ ...p, isActive: checked }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">{editing ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center text-muted-foreground py-6">
              No coupons yet
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon._id}>
                      <TableCell className="font-semibold">
                        {coupon.code}
                      </TableCell>
                      <TableCell>৳{coupon.discountAmount}</TableCell>
                      <TableCell>{coupon.remainingUses}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            coupon.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {coupon.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDialog(coupon)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(coupon._id)}
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
