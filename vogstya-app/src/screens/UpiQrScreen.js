import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, Linking, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Image } from "expo-image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOrders } from "../context/OrdersContext";
import { useStore } from "../context/StoreContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { colors, spacing } from "../theme/theme";

const UPI_APPS = [
  { id: "gpay", label: "Google Pay" },
  { id: "phonepe", label: "PhonePe" },
  { id: "paytm", label: "Paytm" },
  { id: "bhim", label: "BHIM" },
];

export default function UpiQrScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { markOrderPaid, refreshOrders } = useOrders();
  const { clearCart } = useStore();
  const { showMessage } = useSnackbar();
  const { token } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { orderId, displayOrderId, gatewayOrderId, gatewayLabel, gatewayId, upiHandle, amount } = route.params || {};
  const { orders } = useOrders();

  // Find current order in context to get items/totals if needed (usually for OrderSuccess nav)
  const currentOrder = orders.find(o => o.backendOrderId === Number(orderId) || o.id === orderId);
  const items = currentOrder?.items || [];
  const totals = currentOrder?.totals || {};
  const address = currentOrder?.address || {};

  const upiPayload = useMemo(() => {
    const query = [
      ["pa", upiHandle || "merchant@razorpay"],
      ["pn", "Vogstya"],
      ["am", Number(amount || 0).toFixed(2)],
      ["cu", "INR"],
      ["tn", `Order ${displayOrderId || orderId}`],
    ]
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join("&");
    return `upi://pay?${query}`;
  }, [amount, displayOrderId, orderId, upiHandle]);

  const qrUrl = useMemo(() => {
    const data = encodeURIComponent(upiPayload || "");
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${data}`;
  }, [upiPayload]);

  async function openUpiApp(appId) {
    const deepLink = `${upiPayload}&tr=${encodeURIComponent(`${appId}_${orderId}`)}`;
    try {
      await Linking.openURL(deepLink);
    } catch {
      showMessage("UPI app could not be opened on this device. Please scan the QR instead.");
    }
  }

  async function confirmPayment() {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiRequest("/orders/checkout/complete", {
        method: "POST",
        token,
        body: {
          orderId,
          status: "paid",
          gatewayTransactionId: `txn_${Date.now()}`,
          gatewayOrderId,
          gatewaySignature: gatewayId === "razorpay" ? "test_signature" : "manual_capture",
        },
      });
      markOrderPaid(displayOrderId || `ORD-${orderId}`);
      await refreshOrders();
      clearCart();
      showMessage("Payment confirmed");
      navigation.replace("OrderSuccess", {
        orderId, displayOrderId: displayOrderId || `ORD-${orderId}`
      });
    } catch (error) {
      showMessage(error.message || "Payment confirmation failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={styles.title}>{gatewayLabel || "Razorpay"} UPI Payment</Text>
          <Text style={styles.sub}>Scan the QR code or open directly in any UPI app for a premium one-tap checkout flow.</Text>

          <View style={styles.card}>
            <Image source={{ uri: qrUrl }} style={styles.qr} contentFit="contain" transition={200} />
            <Text style={styles.amount}>Amount: Rs.{Number(amount || 0).toFixed(2)}</Text>
            <Text style={styles.meta}>Order: {displayOrderId || `ORD-${orderId}`}</Text>
            <Text style={styles.keyLine}>UPI ID: {upiHandle || "merchant@razorpay"}</Text>
          </View>

          <View style={styles.appsWrap}>
            {UPI_APPS.map((app) => (
              <Pressable key={app.id} style={styles.appChip} onPress={() => openUpiApp(app.id)}>
                <Text style={styles.appChipText}>{app.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={[styles.cta, submitting && styles.disabled]}
            onPress={confirmPayment}
            disabled={submitting}
          >
            <Text style={styles.ctaText}>{submitting ? "Confirming..." : "I Have Paid"}</Text>
          </Pressable>

          <Pressable
            style={styles.secondary}
            onPress={() => {
              clearCart();
              navigation.replace("OrderSuccess", {
                orderId, displayOrderId: displayOrderId || `ORD-${orderId}`
              });
            }}
          >
            <Text style={styles.secondaryText}>Mark Pending & Continue</Text>
          </Pressable>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollBody: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  body: {
    padding: spacing.lg,
    alignItems: "center",
    width: "100%",
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  sub: { marginTop: 6, color: colors.subtleText, fontWeight: "700", textAlign: "center", marginBottom: spacing.lg },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.10)",
    padding: spacing.lg,
    alignItems: "center",
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 35px rgba(13, 87, 49, 0.10)" } : {}),
  },
  qr: { width: 260, height: 260, borderRadius: 12, backgroundColor: colors.surface },
  amount: { marginTop: 12, color: colors.ink, fontSize: 18, fontWeight: "900" },
  meta: { marginTop: 4, color: colors.subtleText, fontWeight: "700" },
  keyLine: { marginTop: 4, color: colors.subtleText, fontSize: 12 },
  appsWrap: {
    width: "100%",
    maxWidth: 420,
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  appChip: {
    backgroundColor: colors.card,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.16)",
  },
  appChipText: { color: colors.ink, fontWeight: "800", fontSize: 13 },
  cta: {
    marginTop: spacing.lg,
    backgroundColor: colors.ink,
    borderRadius: 12,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    paddingVertical: 14,
  },
  ctaText: { color: colors.white, fontWeight: "900", fontSize: 15 },
  disabled: { opacity: 0.7 },
  secondary: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.2)",
    borderRadius: 12,
    width: "100%",
    maxWidth: 420,
    alignItems: "center",
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  secondaryText: { color: colors.ink, fontWeight: "800" },
});
