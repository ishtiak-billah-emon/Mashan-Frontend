export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const MANUAL_ORDERS_EVENT = "manual-orders-updated";

export type ManualOrderItemInput = {
  productId?: string;
  productName?: string;
  category: string;
  quantity: number;
  price: number;
};

export type ManualOrderItem = ManualOrderItemInput & {
  _id?: string;
  productId?: string;
  name?: string;
  image?: string;
};

export type ManualOrderConsumer = {
  name: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
};

export type ManualOrder = {
  _id: string;
  orderId: string;
  customer: ManualOrderConsumer;
  items: ManualOrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  note?: string;
  status: string;
  source: "offline";
  createdAt: string;
};

export type ManualOrderInput = {
  orderId?: string;
  consumer: ManualOrderConsumer;
  items: ManualOrderItemInput[];
  shipping?: number;
  paymentMethod?: string;
  note?: string;
};

function withAuthHeaders(token: string) {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export async function fetchManualOrders(token: string, params?: { from?: string; to?: string }) {
  const search = new URLSearchParams();
  if (params?.from) search.append("from", params.from);
  if (params?.to) search.append("to", params.to);

  const response = await fetch(
    `${API_BASE}/api/admin/manual-orders${search.toString() ? `?${search}` : ""}`,
    {
      headers: withAuthHeaders(token),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch manual orders");
  }

  return (await response.json()) as ManualOrder[];
}

export async function createManualOrder(token: string, payload: ManualOrderInput) {
  const response = await fetch(`${API_BASE}/api/admin/manual-orders`, {
    method: "POST",
    headers: withAuthHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || "Failed to save manual order");
  }

  return (await response.json()) as { message: string; order: ManualOrder };
}

export function emitManualOrdersUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(MANUAL_ORDERS_EVENT));
}

