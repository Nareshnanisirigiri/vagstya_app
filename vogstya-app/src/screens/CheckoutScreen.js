import { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Platform, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useStore } from "../context/StoreContext";
import { useOrders } from "../context/OrdersContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useProducts } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { colors, spacing } from "../theme/theme";

const DELIVERY_FEE = 8;

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { cartItems, clearCart } = useStore();
  const { placeOrder, refreshOrders } = useOrders();
  const { showMessage } = useSnackbar();
  const { products } = useProducts();
  const { token } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState("razorpay");
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    street: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await apiRequest("/orders/payment-gateways");
        const rows = payload?.gateways || [];
        if (mounted) {
          setGateways(rows);
          if (rows[0]?.id) setSelectedGateway(rows[0].id);
        }
      } catch {
        if (mounted) setGateways([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    return cartItems
      .map((ci) => {
        const p = products.find((x) => x.id === ci.id);
        if (!p) return null;
        return { ...p, qty: ci.qty };
      })
      .filter(Boolean);
  }, [cartItems, products]);

  const subtotal = useMemo(() => rows.reduce((sum, r) => sum + r.price * r.qty, 0), [rows]);
  const grandTotal = subtotal + (rows.length ? DELIVERY_FEE : 0);

  function updateField(key, value) {
    setAddress((prev) => ({ ...prev, [key]: value }));
  }

  function validateAddress() {
    if (address.fullName.trim().length < 2) return "Enter full name.";
    if (!/^\d{10}$/.test(address.phone.trim())) return "Enter a valid 10-digit phone number.";
    if (!/^\d{6}$/.test(address.pincode.trim())) return "Enter a valid 6-digit pincode.";
    if (address.city.trim().length < 2) return "Enter city.";
    if (address.state.trim().length < 2) return "Enter state.";
    if (address.street.trim().length < 5) return "Enter full street address.";
    return "";
  }

  async function onPlaceOrder() {
    if (submitting) return;
    if (rows.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!token) {
      setError("Please sign in to place and track your order.");
      navigation.navigate("Login");
      return;
    }
    const err = validateAddress();
    if (err) {
      setError(err);
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const startPayload = await apiRequest("/orders/checkout/start", {
        method: "POST",
        token,
        body: {
          items: rows.map((r) => ({ productId: r.id, quantity: r.qty, size: r.size || null })),
          paymentMethod: paymentMethod === "COD" ? "cod" : "upi_qr",
          paymentGateway: selectedGateway,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            line1: address.street,
            line2: "",
            city: address.city,
            state: address.state,
            postalCode: address.pincode,
            country: "India",
          },
          note: "Order from vogstya app",
        },
      });

      const backendOrder = startPayload?.order;
      const paymentMeta = startPayload?.payment || {};
      if (!backendOrder?.id) throw new Error("Checkout start failed.");

      if (paymentMethod === "COD") {
        const completePayload = await apiRequest("/orders/checkout/complete", {
          method: "POST",
          token,
          body: {
            orderId: backendOrder.id,
            status: "cod_confirmed",
            gatewayTransactionId: `cod_${Date.now()}`,
            gatewayOrderId: paymentMeta.gatewayOrderId || "",
            gatewaySignature: "",
          },
        });

        const finalOrder = completePayload?.order || {};
        placeOrder({
          items: rows.map((r) => ({ productId: r.id, qty: r.qty })),
          address: { ...address },
          totals: { subtotal, deliveryFee: DELIVERY_FEE, grandTotal },
          paymentMethod: "COD",
          paymentStatus: String(finalOrder.paymentStatus || "").toLowerCase() === "paid" ? "paid" : "pending",
        });
        await refreshOrders();
        clearCart();
        showMessage("Order placed successfully");
        navigation.replace("Orders", { focusOrderId: `ORD-${backendOrder.id}` });
        return;
      }

      navigation.navigate("UpiQr", {
        orderId: backendOrder.id,
        displayOrderId: `ORD-${backendOrder.id}`,
        amount: paymentMeta.amount || grandTotal,
        gatewayOrderId: paymentMeta.gatewayOrderId || "",
        gatewayLabel: paymentMeta.gateway?.label || "Razorpay",
        gatewayId: paymentMeta.gateway?.id || selectedGateway,
        upiHandle: paymentMeta.gateway?.upiHandle || "merchant@razorpay",
      });
    } catch (e) {
      setError(e.message || "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Checkout</Text>

        <View style={[styles.topGrid, !isWide && styles.topGridStack]}>
          <View style={[styles.section, styles.addressCard]}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <View style={styles.row2}>
              <Field label="Full Name" value={address.fullName} onChange={(v) => updateField("fullName", v)} />
              <Field
                label="Phone"
                value={address.phone}
                keyboardType="number-pad"
                onChange={(v) => updateField("phone", v.replace(/[^\d]/g, ""))}
              />
            </View>
            <View style={styles.row2}>
              <Field
                label="Pincode"
                value={address.pincode}
                keyboardType="number-pad"
                onChange={(v) => updateField("pincode", v.replace(/[^\d]/g, ""))}
              />
              <Field label="City" value={address.city} onChange={(v) => updateField("city", v)} />
            </View>
            <View style={styles.row2}>
              <Field label="State" value={address.state} onChange={(v) => updateField("state", v)} />
              <Field label="Street Address" value={address.street} onChange={(v) => updateField("street", v)} />
            </View>
          </View>

          <View style={[styles.section, styles.summaryCard]}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            <Row k="Items" v={`${rows.length}`} />
            <Row k="Subtotal" v={`₹${subtotal.toFixed(2)}`} />
            <Row k="Delivery" v={`₹${rows.length ? DELIVERY_FEE.toFixed(2) : "0.00"}`} />
            <Row k="Grand Total" v={`₹${grandTotal.toFixed(2)}`} strong />
            <Pressable style={[styles.cta, styles.summaryCta, submitting && styles.disabled]} onPress={onPlaceOrder} disabled={submitting}>
              <Text style={styles.ctaText}>{paymentMethod === "COD" ? "Place Order" : "Proceed to Payment"}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <MethodRow
            active={paymentMethod === "COD"}
            title="Cash on Delivery"
            subtitle="Pay when product is delivered"
            onPress={() => setPaymentMethod("COD")}
          />
          <MethodRow
            active={paymentMethod === "RazorpayDemo"}
            title="Online Payment"
            subtitle="Gateway checkout (UPI/Card/Netbanking)"
            onPress={() => setPaymentMethod("RazorpayDemo")}
          />
          {paymentMethod === "RazorpayDemo" ? (
            <View style={styles.gatewayWrap}>
              {gateways.length ? (
                gateways.map((gw) => (
                  <Pressable
                    key={gw.id}
                    onPress={() => setSelectedGateway(gw.id)}
                    style={[styles.gatewayChip, selectedGateway === gw.id && styles.gatewayChipOn]}
                  >
                    <Text style={[styles.gatewayText, selectedGateway === gw.id && styles.gatewayTextOn]}>
                      {gw.label}
                    </Text>
                  </Pressable>
                ))
              ) : (
                <Text style={styles.note}>No gateway metadata received, defaulting to Razorpay.</Text>
              )}
            </View>
          ) : null}
          <Text style={styles.note}>
            Backend payment orchestration enabled via <Text style={styles.noteStrong}>/api/orders</Text>
          </Text>
        </View>

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle-outline" size={18} color="#7a1f1f" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, keyboardType = "default" }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        style={styles.input}
        placeholder={label}
        placeholderTextColor={colors.muted}
      />
    </View>
  );
}

function MethodRow({ active, title, subtitle, onPress }) {
  return (
    <Pressable style={[styles.method, active && styles.methodOn]} onPress={onPress}>
      <View style={[styles.radio, active && styles.radioOn]}>{active ? <View style={styles.dot} /> : null}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.methodTitle}>{title}</Text>
        <Text style={styles.methodSub}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function Row({ k, v, strong }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumK, strong && styles.sumStrong]}>{k}</Text>
      <Text style={[styles.sumV, strong && styles.sumStrong]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  section: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.10)",
    padding: spacing.md,
  },
  topGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  topGridStack: {
    flexDirection: "column",
  },
  addressCard: {
    flex: 1.4,
  },
  summaryCard: {
    flex: 0.9,
    minWidth: 300,
  },
  summaryCta: {
    marginTop: spacing.md,
  },
  sectionTitle: { color: colors.ink, fontWeight: "900", marginBottom: spacing.sm, fontSize: 16 },
  row2: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  fieldWrap: { flex: 1, minWidth: 160, marginBottom: 8 },
  label: { color: colors.subtleText, fontSize: 12, fontWeight: "700", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.18)",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.ink,
    fontWeight: "600",
  },
  method: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.15)",
    borderRadius: 12,
    marginBottom: 8,
  },
  methodOn: { backgroundColor: colors.highlightSoft },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(13, 87, 49, 0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.ink },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: colors.ink },
  methodTitle: { color: colors.ink, fontWeight: "800" },
  methodSub: { color: colors.subtleText, marginTop: 2, fontSize: 12 },
  note: { marginTop: 6, color: colors.subtleText, fontSize: 12 },
  noteStrong: { color: colors.ink, fontWeight: "900" },
  gatewayWrap: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gatewayChip: {
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.2)",
    backgroundColor: colors.surface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  gatewayChipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  gatewayText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 12,
  },
  gatewayTextOn: {
    color: colors.white,
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 8 },
  sumK: { color: colors.subtleText, fontWeight: "700" },
  sumV: { color: colors.ink, fontWeight: "800" },
  sumStrong: { color: colors.ink, fontWeight: "900", fontSize: 16 },
  error: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#ffe9e9",
    borderColor: "#ffd0d0",
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  errorText: { color: "#7a1f1f", fontWeight: "700", flex: 1 },
  cta: {
    marginTop: spacing.md,
    backgroundColor: colors.ink,
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 15,
  },
  ctaText: { color: colors.white, fontWeight: "900", fontSize: 16, letterSpacing: 0.3 },
  disabled: { opacity: 0.6 },
});
