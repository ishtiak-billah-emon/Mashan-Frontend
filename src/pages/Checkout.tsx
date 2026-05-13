import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();

  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // SHIPPING
  const cityLower = formData.city.toLowerCase().trim();
  const isDhaka = cityLower === "dhaka";

  const shippingCost = isDhaka ? 80 : 150;

  const discountedTotal = Math.max(0, total + shippingCost - couponDiscount);

  // VALIDATION
  const validate = () => {
    if (!formData.name.trim()) {
      return "Name is required";
    }

    const phone = formData.phone.trim();

    if (!/^01\d{9}$/.test(phone)) {
      return "Phone number must be 11 digits and start with 01";
    }

    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      return "Invalid email format";
    }

    if (!formData.address.trim()) {
      return "Address is required";
    }

    if (!formData.city.trim()) {
      return "City is required";
    }

    return null;
  };

  // APPLY COUPON
  const applyCoupon = async () => {
    const code = couponCode.trim();

    if (!code) {
      toast.error("Enter a coupon code");
      return;
    }

    setCouponLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/coupons/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid or expired coupon");
      }

      const data = await res.json();

      setAppliedCoupon(data.code);
      setCouponDiscount(Number(data.discountAmount) || 0);

      toast.success(`Coupon Applied - ৳${data.discountAmount} OFF`);
    } catch (error: any) {
      setAppliedCoupon(null);
      setCouponDiscount(0);

      toast.error(error?.message || "Invalid or expired coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  // PLACE ORDER
  const placeOrder = async () => {
    const error = validate();

    if (error) {
      toast.error(error);
      return;
    }

    try {
      setLoading(true);

      const emailToSave =
        formData.email.trim() === "" ? "noemail@gmail.com" : formData.email;

      const payload = {
        customer: {
          ...formData,
          email: emailToSave,
        },

        items: items.map((item) => ({
          productId: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),

        subtotal: total,
        shipping: shippingCost,
        total: discountedTotal,

        couponCode: appliedCoupon,
        couponDiscount,

        paymentMethod: "cod",
      };

      await axios.post(`${API_BASE}/api/orders`, payload);

      clearCart();
      setSuccessOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-primary">
            Checkout
          </h1>

          <p className="text-muted-foreground mt-2">
            Complete your order information below.
          </p>
        </div>

        <div className="mb-6 rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-900">
          <p>
            ঢাকার ভিতরে ডেলিভারি চার্জ <strong>৳80</strong> এবং ঢাকার বাইরে{" "}
            <strong>৳150</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SIDE */}
          <div className="lg:col-span-2 space-y-6">
            {/* CUSTOMER INFO */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    name="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInput}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input
                    name="phone"
                    placeholder="01XXXXXXXXX"
                    value={formData.phone}
                    onChange={handleInput}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email (Optional)</Label>
                  <Input
                    name="email"
                    placeholder="example@gmail.com"
                    value={formData.email}
                    onChange={handleInput}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SHIPPING */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Address *</Label>
                  <Input
                    name="address"
                    placeholder="House, Road, Area"
                    value={formData.address}
                    onChange={handleInput}
                  />
                </div>

                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    name="city"
                    placeholder="Dhaka"
                    value={formData.city}
                    onChange={handleInput}
                  />
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="rounded-xl border-2 border-green-500 bg-green-50 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg text-green-800">
                        Cash on Delivery
                      </h3>

                      <p className="text-sm text-green-700 mt-1">
                        Pay with cash when your order is delivered.
                      </p>
                    </div>

                    <div className="h-5 w-5 rounded-full bg-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE */}
          <div>
            <Card className="sticky top-24 shadow-sm">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-medium line-clamp-1">{item.name}</p>

                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity}
                      </p>
                    </div>

                    <p className="font-semibold">
                      ৳{item.price * item.quantity}
                    </p>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>৳{total}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>Delivery Charge</span>
                  <span>৳{shippingCost}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-700 font-medium">
                    <span>Coupon ({appliedCoupon})</span>
                    <span>-৳{couponDiscount}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">৳{discountedTotal}</span>
                </div>

                {/* COUPON */}
                <div className="rounded-xl border p-4 space-y-3 bg-muted/20">
                  <Label>Coupon Code</Label>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                    />

                    <Button
                      type="button"
                      variant="secondary"
                      disabled={couponLoading}
                      onClick={applyCoupon}
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full h-11 text-base"
                  disabled={loading}
                  onClick={() => setConfirmOpen(true)}
                >
                  {loading ? "Processing..." : "Place Order"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CONFIRM MODAL */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>

            <DialogDescription>
              Are you sure you want to place this order?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => {
                setConfirmOpen(false);
                placeOrder();
              }}
            >
              Confirm Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESS MODAL */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>🎉 Order Placed Successfully!</DialogTitle>

            <DialogDescription>
              Thank you for your order. We will contact you soon.
            </DialogDescription>
          </DialogHeader>

          <Button
            className="mt-4 w-full"
            onClick={() => {
              setSuccessOpen(false);
              navigate("/");
            }}
          >
            Go to Homepage
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
