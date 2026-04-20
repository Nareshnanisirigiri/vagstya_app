import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "./AuthContext";

const OrdersContext = createContext(null);

function makeOrderId() {
  return `ORD-${Date.now().toString(36).toUpperCase()}`;
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token, user } = useAuth();

  function mapBackendOrder(order) {
    return {
      id: `ORD-${order.id}`,
      backendOrderId: Number(order.id),
      createdAt: order.created_at,
      items: Array.isArray(order.items)
        ? order.items.map((item) => ({
            productId: Number(item.product_id),
            qty: Number(item.quantity || 0),
            name: item.product_name || "Product",
          }))
        : [],
      address: {
        fullName: order.name || "",
        phone: order.phone || "",
        street: order.address_line || "",
        city: order.city || "",
        state: order.area || "",
        pincode: order.post_code || "",
      },
      totals: {
        subtotal: Number(order.total_amount || 0),
        deliveryFee: Number(order.delivery_charge || 0),
        grandTotal: Number(order.payable_amount || 0),
      },
      paymentMethod: order.payment_method || "Online",
      paymentStatus: String(order.payment_status || "pending").toLowerCase(),
      orderStatus: order.order_status || "Pending",
      orderCode: order.order_code || "",
    };
  }

  const refreshOrders = useCallback(async () => {
    if (!token) {
      setOrders([]);
      return;
    }

    setLoading(true);
    try {
      const payload = await apiRequest("/orders", { token });
      const list = Array.isArray(payload?.orders) ? payload.orders.map(mapBackendOrder) : [];
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token || !user) {
      setOrders([]);
      return;
    }
    refreshOrders();
  }, [token, user, refreshOrders]);

  const value = useMemo(() => {
    function placeOrder({
      items,
      address,
      totals,
      paymentMethod = "COD",
      paymentStatus = "pending",
      upiQrPayload = "",
    }) {
      const order = {
        id: makeOrderId(),
        createdAt: new Date().toISOString(),
        items,
        address,
        totals,
        paymentMethod,
        paymentStatus,
        upiQrPayload,
      };
      setOrders((prev) => [order, ...prev]);
      return order;
    }

    function markOrderPaid(orderId) {
      setOrders((prev) =>
        prev.map((ord) => (ord.id === orderId ? { ...ord, paymentStatus: "paid" } : ord))
      );
    }

    return { orders, loading, refreshOrders, placeOrder, markOrderPaid };
  }, [orders, loading, refreshOrders]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used inside OrdersProvider");
  return ctx;
}
