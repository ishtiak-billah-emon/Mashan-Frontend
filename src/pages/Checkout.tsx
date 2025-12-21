import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import axios from "axios";

// PREMIUM SHADCN MODAL
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart } = useCart();

  const [successOpen, setSuccessOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
  });

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashTrxID, setBkashTrxID] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // SHIPPING LOGIC
  const cityLower = formData.city.toLowerCase().trim();
  const isDhaka = cityLower === "dhaka";
  const shippingCost = isDhaka ? 80 : 150;
  const discountedTotal = Math.max(0, total + shippingCost - couponDiscount);

  // VALIDATION
  const validate = () => {
    if (!formData.name.trim()) return "Name is required";

    const phone = formData.phone.trim();
    if (!/^01\d{9}$/.test(phone))
      return "Invalid phone number. Must start with 01 and be 11 digits";

    if (formData.email.trim() && !/^\S+@\S+\.\S+$/.test(formData.email))
      return "Invalid email format";

    if (!formData.address.trim()) return "Address is required";
    if (!formData.city.trim()) return "City is required";

    // For Bkash payment
    if (paymentMethod === "bkash") {
      if (!/^01\d{9}$/.test(bkashNumber))
        return "Enter a valid 11-digit Bkash number";
    }

    return null;
  };

  // ORDER SUBMIT
  const placeOrder = async () => {
    const err = validate();
    if (err) return toast.error(err);

    const emailToSave =
      formData.email.trim() === "" ? "noemail@gmail.com" : formData.email;

    const payload = {
      customer: { ...formData, email: emailToSave },
      items: items.map((i) => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: total,
      shipping: shippingCost,
      total: discountedTotal,
      couponCode: appliedCoupon,
      couponDiscount,
      paymentMethod,
      bkashInfo:
        paymentMethod === "bkash"
          ? { number: bkashNumber, trxID: bkashTrxID }
          : null,
    };

    try {
      await axios.post(`${API_BASE}/api/orders`, payload);
      clearCart();
      setSuccessOpen(true);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Order failed");
    }
  };

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid or expired coupon");
      }
      const data = await res.json();
      setAppliedCoupon(data.code);
      setCouponDiscount(Number(data.discountAmount) || 0);
      toast.success(`Coupon applied: -৳${data.discountAmount}`);
    } catch (error: any) {
      setAppliedCoupon(null);
      setCouponDiscount(0);
      toast.error(error?.message || "Invalid or expired coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8 text-primary">Checkout</h1>

        <div className="text-sm mb-4 p-3 bg-amber-100 rounded">
          ঢাকার ভিতরে ডেলিভারি চার্জ **৮০ টাকা**, ঢাকার বাইরে **১৫০ টাকা**।
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FORM SECTION */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name *</Label>
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInput}
                  />
                </div>

                <div>
                  <Label>Phone Number *</Label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInput}
                  />
                </div>

                <div>
                  <Label>Email (optional)</Label>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleInput}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shipping Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Address *</Label>
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleInput}
                  />
                </div>

                <div>
                  <Label>City *</Label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleInput}
                  />
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT METHOD */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* COD OPTION */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${
                    paymentMethod === "cod"
                      ? "border-green-600 bg-green-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod("cod")}
                >
                  <Label className="text-lg font-semibold cursor-pointer">
                    Cash on Delivery
                  </Label>
                </div>

                {/* BKASH OPTION */}
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${
                    paymentMethod === "bkash"
                      ? "border-pink-600 bg-pink-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => setPaymentMethod("bkash")}
                >
                  <Label className="text-lg font-semibold cursor-pointer">
                    Bkash Payment
                  </Label>

                  {paymentMethod === "bkash" && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <Label>Bkash Number *</Label>
                        <Input
                          value={bkashNumber}
                          onChange={(e) => setBkashNumber(e.target.value)}
                          placeholder="01XXXXXXXXX"
                        />
                      </div>

                      <div>
                        <Label>Transaction ID (optional)</Label>
                        <Input
                          value={bkashTrxID}
                          onChange={(e) => setBkashTrxID(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SUMMARY SECTION */}
          <div>
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>৳{item.price * item.quantity}</span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{total}</span>
                </div>

                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>৳{shippingCost}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon ({appliedCoupon})</span>
                    <span>-৳{couponDiscount}</span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">৳{discountedTotal}</span>
                </div>

                <div className="border rounded-md p-3 space-y-2 bg-muted/30">
                  <Label className="text-sm">Coupon Code</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={applyCoupon}
                      disabled={couponLoading}
                    >
                      {couponLoading ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Only one coupon can be applied at a time.
                  </p>
                </div>

                <Button className="w-full" onClick={() => setConfirmOpen(true)}>
                  Place Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to place this order?
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>

            <Button
              onClick={() => {
                setConfirmOpen(false);
                placeOrder();
              }}
            >
              Yes, Place Order
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
