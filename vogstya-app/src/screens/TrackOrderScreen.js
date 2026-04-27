import { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Platform, Pressable } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOrders } from "../context/OrdersContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { colors, spacing } from "../theme/theme";

const STATUS_STAGES = [
  { key: "packed", label: "Packed", sub: "Order is being prepared" },
  { key: "shipped", label: "Shipped", sub: "Order has left the warehouse" },
  { key: "out for delivery", label: "Out for Delivery", sub: "Arriving today" },
  { key: "delivered", label: "Delivered", sub: "Successfully received" },
];

function extractRawOrderId(routeParams) {
  const direct = String(routeParams?.orderId || "").trim();
  if (direct) return direct;

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search || "");
    return String(params.get("orderId") || "").trim();
  }

  return "";
}

function toBackendOrderId(rawOrderId) {
  const text = String(rawOrderId || "").trim();
  if (!text) return 0;

  const match = text.match(/(\d+)$/);
  return match ? Number(match[1]) : Number(text || 0);
}

export default function TrackOrderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const rawOrderId = useMemo(() => extractRawOrderId(route.params || {}), [route.params]);
  const orderId = useMemo(() => toBackendOrderId(rawOrderId), [rawOrderId]);
  const { orders } = useOrders();
  const { user, token } = useAuth();
  
  const [localOrder, setLocalOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!orderId || !token) {
        console.log("[TRACK] Missing ID or Token:", { orderId, hasToken: !!token });
        setLoading(false);
        return;
      }

      console.log("[TRACK] Attempting to find order:", orderId);

      // 1. Try to find in existing context first
      const found = orders.find(
        (o) => Number(o.backendOrderId) === orderId || String(o.id) === rawOrderId
      );
      if (found) {
        console.log("[TRACK] Found in context:", found.id);
        setLocalOrder(found);
        setLoading(false);
        return;
      }

      // 2. Fetch directly from API
      try {
        console.log("[TRACK] Fetching from API...");
        const payload = await apiRequest(`/orders/${orderId}`, { token });
        if (payload?.order) {
          console.log("[TRACK] Received from API:", payload.order.order_code);
          // Map to context format
          const mapped = {
            id: `ORD-${payload.order.id}`,
            backendOrderId: Number(payload.order.id),
            createdAt: payload.order.created_at,
            items: Array.isArray(payload.items)
              ? payload.items.map((item) => ({
                  productId: Number(item.product_id),
                  qty: Number(item.quantity || 0),
                  name: item.product_name || "Product",
                }))
              : [],
            address: {
              fullName: payload.order.shipping_name || payload.order.name || "",
              phone: payload.order.shipping_phone || payload.order.phone || "",
              street: payload.order.address_line || "",
              city: payload.order.city || "",
              state: payload.order.area || "",
              pincode: payload.order.post_code || "",
            },
            totals: {
              subtotal: Number(payload.order.total_amount || 0),
              deliveryFee: Number(payload.order.delivery_charge || 0),
              grandTotal: Number(payload.order.payable_amount || 0),
            },
            paymentMethod: payload.order.payment_method || "Online",
            paymentStatus: String(payload.order.payment_status || "pending").toLowerCase(),
            orderStatus: payload.order.order_status || "Pending",
            orderCode: payload.order.order_code || "",
          };
          setLocalOrder(mapped);
          setApiError(null);
        } else {
          console.log("[TRACK] API returned success but no order object");
          setApiError("Order data is missing from server response.");
        }
      } catch (err) {
        console.error("[TRACK] Fetch error:", err.message);
        setApiError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, rawOrderId, token, orders]);

  const order = localOrder;

  if (loading) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Connecting to VOGSTYA Secure Server...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>
             {apiError || (!token ? "Please sign in to track your order." : "Order not found.")}
          </Text>
          {!token ? (
            <View style={{ marginTop: 16, alignItems: 'center' }}>
               <Text style={{ marginBottom: 10, color: colors.subtleText }}>Sign in to view your secure tracking data</Text>
               <Pressable style={styles.loginBtn} onPress={() => navigation.navigate("Login")}>
                 <Text style={styles.loginBtnText}>Go To Login</Text>
               </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ marginTop: 10, color: colors.subtleText, fontSize: 12 }}>ID Requested: {rawOrderId || orderId}</Text>
              <Pressable style={[styles.loginBtn, { marginTop: 20 }]} onPress={() => navigation.navigate("Orders")}>
                 <Text style={styles.loginBtnText}>View All Orders</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  }

  const currentStatus = String(order.orderStatus || "Pending").toLowerCase();
  const isReturned = currentStatus.includes("return") || currentStatus.includes("refund");
  
  const activeIndex = STATUS_STAGES.findIndex(s => s.key === currentStatus);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadText}>Your Account › Your Orders › Order Summary › </Text>
          <Text style={[styles.breadText, { color: '#e47911', fontWeight: '700' }]}>Delivery Tracking</Text>
        </View>

        <Text style={styles.title}>Delivery Tracking</Text>

        <View style={styles.trackingCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>
              {isReturned ? "Return / Refund" : activeIndex >= 0 ? STATUS_STAGES[activeIndex].label : "In Transit : On Schedule"}
            </Text>
            <Text style={styles.expectedText}>
              Expected delivery: <Text style={{ color: '#008a00', fontWeight: '700' }}>{new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toDateString()}</Text>
            </Text>
          </View>

          {isReturned ? (
            <View style={styles.returnSection}>
               <Ionicons name="reload-circle" size={40} color="#b91c1c" />
               <View style={{ marginLeft: 12 }}>
                 <Text style={styles.returnTitle}>Return complete</Text>
                 <Text style={styles.returnDesc}>Your return is complete. The refund has been processed to your original payment method.</Text>
               </View>
            </View>
          ) : (
            <View style={styles.horizontalTimelineWrapper}>
              <View style={styles.horizontalTimeline}>
                {STATUS_STAGES.map((stage, index) => {
                  const isCompleted = index <= activeIndex;
                  const isCurrent = index === activeIndex;
                  const isLast = index === STATUS_STAGES.length - 1;
                  const hasNextLine = !isLast;
                  const isLineCompleted = index < activeIndex;

                  return (
                    <View key={stage.key} style={[styles.timelineItem, { flex: isLast ? 0 : 1 }]}>
                      {/* Line & Dot */}
                      <View style={styles.dotLineRow}>
                        <View style={[styles.dot, isCompleted && styles.dotCompleted]}>
                           {isCompleted && <View style={styles.dotInner} />}
                        </View>
                        {hasNextLine && (
                          <View style={[styles.horizontalLine, isLineCompleted && styles.lineCompleted]} />
                        )}
                      </View>
                      
                      {/* Label */}
                      <View style={styles.labelContainer}>
                        <Text style={[styles.stageLabel, isCompleted && styles.stageLabelActive]}>
                          {stage.label}
                        </Text>
                        {isCurrent && <Text style={styles.stageSub}>{stage.sub}</Text>}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          <View style={styles.footerInfo}>
             <Ionicons name="location-outline" size={20} color={colors.subtleText} />
             <Text style={styles.addressText}>
               Shipping to: {order.address.fullName}, {order.address.city}, {order.address.pincode}
             </Text>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  body: { padding: 20 },
  breadcrumb: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap' },
  breadText: { fontSize: 13, color: '#565959' },
  title: { fontSize: 26, fontWeight: "500", color: "#111", marginBottom: 20 },
  trackingCard: {
    borderWidth: 1,
    borderColor: "#d5d9d9",
    borderRadius: 8,
    padding: 20,
    backgroundColor: "#fff",
  },
  statusHeader: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 20 },
  statusTitle: { fontSize: 22, fontWeight: "700", color: "#e47911", marginBottom: 8 },
  expectedText: { fontSize: 14, color: "#111" },
  
  horizontalTimelineWrapper: {
    marginVertical: 30,
    paddingHorizontal: 10,
  },
  horizontalTimeline: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineItem: {
    alignItems: 'flex-start',
  },
  dotLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9e9e9',
    borderWidth: 4,
    borderColor: '#fff',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : { elevation: 2 }),
  },
  dotCompleted: {
    backgroundColor: '#e47911',
  },
  dotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  horizontalLine: {
    height: 6,
    flex: 1,
    backgroundColor: '#e9e9e9',
    marginHorizontal: -2,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: '#e47911',
  },
  labelContainer: {
    marginTop: 12,
    width: 100,
    marginLeft: -38,
    alignItems: 'center',
  },
  stageLabel: {
    fontSize: 12,
    color: "#565959",
    fontWeight: "500",
    textAlign: 'center',
  },
  stageLabelActive: {
    color: "#111",
    fontWeight: "800",
  },
  stageSub: {
    fontSize: 10,
    color: "#008a00",
    marginTop: 4,
    fontWeight: '700',
    textAlign: 'center',
  },

  returnSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, backgroundColor: '#fdf2f2', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20 },
  returnTitle: { fontSize: 18, fontWeight: '700', color: '#b91c1c' },
  returnDesc: { fontSize: 13, color: '#7f1d1d', marginTop: 2 },
  footerInfo: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 20, flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 14, color: "#565959", marginLeft: 8 },
  errorText: { fontSize: 16, color: colors.error },
  loginBtn: {
    marginTop: 16,
    backgroundColor: colors.ink,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: {
    color: colors.white,
    fontWeight: "800",
  },
  loadingText: {
    fontSize: 15,
    color: colors.accent,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
