import { useMemo } from "react";
import { View, Text, StyleSheet, Platform, ScrollView } from "react-native";
import { useRoute } from "@react-navigation/native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOrders } from "../context/OrdersContext";
import { useProducts } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `₹${amount.toFixed(2)}`;
}

export default function OrdersScreen() {
  const route = useRoute();
  const focusOrderId = route.params?.focusOrderId;
  const { orders, loading } = useOrders();
  const { products } = useProducts();
  const { user } = useAuth();

  const rows = useMemo(() => {
    return orders.map((ord) => {
      const lines = ord.items
        .map((it) => {
          const p = products.find((x) => x.id === it.productId);
          return `${p?.name || it.name || "Product"} x${it.qty}`;
        })
        .filter(Boolean);
      return { ...ord, lines };
    });
  }, [orders, products]);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Orders</Text>
        <Text style={styles.sub}>{user ? `${rows.length} orders for ${user.name}` : "Sign in to see your orders"}</Text>

        {!user ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Please sign in to view your order list.</Text>
          </View>
        ) : loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading your orders...</Text>
          </View>
        ) : rows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No orders yet.</Text>
          </View>
        ) : (
          rows.map((ord) => {
            const focused = focusOrderId && ord.id === focusOrderId;
            return (
              <View key={ord.id} style={[styles.card, focused && styles.cardFocus]}>
                <View style={styles.row}>
                  <Text style={styles.orderId}>{ord.id}</Text>
                  <Text style={[styles.status, ord.paymentStatus === "paid" ? styles.paid : styles.pending]}>
                    {ord.paymentStatus.toUpperCase()}
                  </Text>
                </View>
                {ord.orderCode ? <Text style={styles.meta}>Order Code: {ord.orderCode}</Text> : null}
                <Text style={styles.meta}>{fmtDate(ord.createdAt)}</Text>
                <Text style={styles.meta}>Payment: {ord.paymentMethod}</Text>
                {ord.orderStatus ? <Text style={styles.meta}>Order Status: {ord.orderStatus}</Text> : null}
                {ord.address.fullName ? <Text style={styles.meta}>Customer: {ord.address.fullName}</Text> : null}
                {ord.address.phone ? <Text style={styles.meta}>Phone: {ord.address.phone}</Text> : null}
                <Text style={styles.meta}>
                  Address: {ord.address.street}, {ord.address.city}, {ord.address.state} {ord.address.pincode}
                </Text>
                <View style={styles.linesWrap}>
                  {ord.lines.map((line, idx) => (
                    <Text key={`${ord.id}-${idx}`} style={styles.line}>
                      {"\u2022"} {line}
                    </Text>
                  ))}
                </View>
                <View style={styles.sumRow}>
                  <Text style={styles.sumLabel}>Grand Total</Text>
                  <Text style={styles.sumValue}>{formatMoney(ord.totals?.grandTotal)}</Text>
                </View>
              </View>
            );
          })
        )}
        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  sub: { marginTop: 6, color: colors.subtleText, fontWeight: "700", marginBottom: spacing.lg },
  empty: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.10)",
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: { color: colors.subtleText, fontWeight: "700" },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.10)",
    padding: spacing.md,
  },
  cardFocus: { borderColor: colors.accent, borderWidth: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderId: { color: colors.ink, fontWeight: "900" },
  status: { fontWeight: "900", fontSize: 11, letterSpacing: 0.8 },
  paid: { color: colors.accent },
  pending: { color: "#a05b00" },
  meta: { marginTop: 4, color: colors.subtleText, fontSize: 12, fontWeight: "600" },
  linesWrap: { marginTop: 8 },
  line: { marginTop: 2, color: colors.ink, fontWeight: "600" },
  sumRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  sumLabel: { color: colors.subtleText, fontWeight: "700" },
  sumValue: { color: colors.ink, fontWeight: "900" },
});
