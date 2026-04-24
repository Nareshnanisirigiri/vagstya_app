import { useMemo, useCallback, useState } from "react";
import { View, Text, StyleSheet, Platform, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { useRoute, useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOrders } from "../context/OrdersContext";
import { useProducts } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";
import { colors, spacing } from "../theme/theme";

function fmtDate(iso) {
  if (!iso) return "N/A";
  try {
    const d = new Date(iso);
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

function formatMoney(value) {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function normalizeOrderStatus(status) {
  const value = String(status || "Pending").trim().toLowerCase();
  if (value === "out for delivery" || value === "out_for_delivery") return "Out for Delivery";
  if (value === "return / refund" || value === "return_refund" || value === "returned") return "Return / Refund";
  if (value === "shipped") return "Shipped";
  if (value === "packed") return "Packed";
  if (value === "delivered") return "Delivered";
  if (value === "cancelled" || value === "canceled") return "Cancelled";
  return "Pending";
}

function statusStyle(status) {
  const value = String(status || "").toLowerCase();
  if (value.includes("delivered")) return "delivered";
  if (value.includes("out for delivery")) return "outForDelivery";
  if (value.includes("shipped")) return "shipped";
  if (value.includes("packed")) return "packed";
  if (value.includes("return")) return "returnRefund";
  if (value.includes("cancel")) return "cancelled";
  return "pending";
}

export default function OrdersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const focusOrderId = route.params?.focusOrderId;
  const { orders, loading, refreshOrders } = useOrders();
  const { products } = useProducts();
  const { user } = useAuth();
  const { addToCart } = useStore();

  const [activeTab, setActiveTab] = useState("Orders");
  const [timeframe, setTimeframe] = useState("past 3 months");

  const TABS = ["Orders", "Buy Again", "Not Yet Shipped"];

  const rows = useMemo(() => {
    return orders.map((ord) => {
      const lines = ord.items
        .map((it) => {
          const p = products.find((x) => x.id === it.productId);
          return {
            productId: it.productId,
            name: p?.name || it.name || "Product",
            qty: it.qty,
            size: it.size,
            image: p?.image || it.image,
            price: p?.price || it.price,
          };
        })
        .filter(Boolean);
      return { ...ord, lines };
    });
  }, [orders, products]);

  // Filtering logic for tabs (mocked / simple)
  const filteredRows = useMemo(() => {
    if (activeTab === "Not Yet Shipped") {
      return rows.filter(r => !["delivered", "cancelled"].includes(r.orderStatus?.toLowerCase()));
    }
    if (activeTab === "Buy Again") {
        return rows.filter(r => r.orderStatus?.toLowerCase() === "delivered");
    }
    return rows;
  }, [rows, activeTab]);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        refreshOrders();
      }
    }, [user, refreshOrders])
  );

  const handleBuyAgain = (productId) => {
    addToCart(productId, 1);
    navigation.navigate("Cart");
  };

  const handleTrackPackage = (orderId) => {
    navigation.navigate("TrackOrder", { orderId });
  };

  const handleWriteReview = (productId) => {
    navigation.navigate("WriteReview", { productId });
  };

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={styles.title}>Your Orders</Text>
          
          <View style={styles.tabBar}>
            {TABS.map(tab => (
              <Pressable 
                key={tab} 
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {!user ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Please sign in to view your order list.</Text>
          </View>
        ) : loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading your orders...</Text>
          </View>
        ) : filteredRows.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No orders yet.</Text>
          </View>
        ) : (
          <View>
            <View style={styles.summaryRow}>
              <Text style={styles.orderCount}>{filteredRows.length} orders placed in</Text>
              <View style={styles.dropdownBtn}>
                <Text style={styles.dropdownText}>{timeframe}</Text>
                <Ionicons name="chevron-down" size={16} color={colors.subtleText} />
              </View>
            </View>

            {filteredRows.map((ord) => {
              const focused = focusOrderId && ord.id === focusOrderId;
              const lifecycleStatus = normalizeOrderStatus(ord.orderStatus);
              const isDelivered = lifecycleStatus === "Delivered";
              const isReturned = lifecycleStatus === "Return / Refund";

              return (
                <View key={ord.id} style={[styles.card, focused && styles.cardFocus]}>
                  {/* Order Header (Gray Area) */}
                  <View style={styles.cardHeader}>
                    <View style={styles.headerInfo}>
                      <View style={styles.headerField}>
                        <Text style={styles.headerLabel}>ORDER PLACED</Text>
                        <Text style={styles.headerValue}>{fmtDate(ord.createdAt)}</Text>
                      </View>
                      <View style={styles.headerField}>
                        <Text style={styles.headerLabel}>TOTAL</Text>
                        <Text style={styles.headerValue}>{formatMoney(ord.totals?.grandTotal)}</Text>
                      </View>
                      <View style={styles.headerField}>
                        <Text style={styles.headerLabel}>SHIP TO</Text>
                        <View style={styles.shipToContainer}>
                          <Text style={[styles.headerValue, { color: '#007185' }]}>{ord.address.fullName || "NARESH"}</Text>
                          <Ionicons name="chevron-down" size={14} color="#007185" style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    </View>
                    <View style={styles.headerActionsRight}>
                      <Text style={styles.headerOrderId}>ORDER # {ord.id}</Text>
                      <View style={styles.headerLinks}>
                        <Text style={styles.headerLink}>View order details</Text>
                        <View style={styles.vDivider} />
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.headerLink}>Invoice</Text>
                          <Ionicons name="chevron-down" size={14} color="#007185" style={{ marginLeft: 2 }} />
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Order Body */}
                  <View style={styles.cardContent}>
                    <View style={styles.mainCol}>
                      <Text style={styles.statusTitle}>
                        {isDelivered ? "Delivered" : isReturned ? "Return complete" : lifecycleStatus}
                      </Text>
                      <Text style={styles.statusDesc}>
                        {isDelivered ? "Package was handed to resident" : isReturned ? "Your return is complete." : `Order is currently ${lifecycleStatus.toLowerCase()}`}
                      </Text>

                      {ord.lines.map((line, idx) => (
                        <View key={`${ord.id}-${idx}`} style={styles.productRow}>
                          <Pressable 
                            style={styles.itemImageContainer}
                            onPress={() => navigation.navigate("ProductDetails", { productId: line.productId })}
                          >
                            {line.image ? (
                              <Image source={{ uri: line.image }} style={styles.itemImage} contentFit="cover" transition={200} />
                            ) : (
                              <View style={[styles.itemImage, styles.itemImageFallback]}>
                                <Ionicons name="image-outline" size={24} color={colors.muted} />
                              </View>
                            )}
                          </Pressable>
                          <View style={styles.productInfo}>
                            <Pressable onPress={() => navigation.navigate("ProductDetails", { productId: line.productId })}>
                              <Text style={styles.productName} numberOfLines={3}>{line.name}</Text>
                            </Pressable>
                            <View style={styles.productActionsInner}>
                              <Pressable style={styles.buyAgainBtn} onPress={() => handleBuyAgain(line.productId)}>
                                <View style={styles.buyAgainIcon}>
                                  <Ionicons name="cart" size={14} color="#333" />
                                </View>
                                <Text style={styles.buyAgainText}>Buy it again</Text>
                              </Pressable>
                              <Pressable style={styles.viewItemBtn} onPress={() => navigation.navigate("ProductDetails", { productId: line.productId })}>
                                <Text style={styles.viewItemText}>View your item</Text>
                              </Pressable>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>

                    {/* Right-side Action Column */}
                    <View style={styles.actionCol}>
                      {isReturned && (
                        <Pressable style={styles.primaryActionBtn} onPress={() => handleTrackPackage(ord.id)}>
                          <Text style={styles.primaryActionText}>View Return/Refund Status</Text>
                        </Pressable>
                      )}
                      {!isReturned && (
                        <Pressable style={styles.primaryActionBtn} onPress={() => handleTrackPackage(ord.id)}>
                          <Text style={styles.primaryActionText}>Track package</Text>
                        </Pressable>
                      )}
                      <Pressable style={styles.secondaryActionBtn}>
                        <Text style={styles.secondaryActionText}>Leave seller feedback</Text>
                      </Pressable>
                      <Pressable 
                        style={styles.secondaryActionBtn} 
                        onPress={() => handleWriteReview(ord.lines[0]?.productId)}
                      >
                        <Text style={styles.secondaryActionText}>Write a product review</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  pageHeader: { marginTop: spacing.lg, marginBottom: spacing.lg },
  title: {
    color: colors.ink,
    fontSize: 28,
    fontWeight: "400",
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e7e7e7",
    gap: spacing.lg,
  },
  tab: {
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: "#e47911", // Amazon Orange
  },
  tabText: {
    fontSize: 14,
    color: "#007185", // Amazon Blue link
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.ink,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: 8,
  },
  orderCount: { fontSize: 14, color: colors.ink, fontWeight: "700" },
  dropdownBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f2f2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d5d9d9",
    boxShadow: "0 2px 5px rgba(213,217,217,.5)",
  },
  dropdownText: { fontSize: 13, color: colors.ink, marginRight: 4 },
  empty: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d5d9d9",
    padding: spacing.xl,
    alignItems: "center",
  },
  emptyText: { color: colors.subtleText, fontWeight: "600" },
  card: {
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d5d9d9",
    overflow: "hidden",
  },
  cardFocus: { borderColor: "#e47911", borderWidth: 2 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f2f2",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#d5d9d9",
    flexWrap: 'wrap',
    gap: 16,
  },
  headerInfo: { flexDirection: "row", gap: spacing.lg, flexWrap: 'wrap' },
  headerField: { gap: 4 },
  headerLabel: { fontSize: 10, color: "#565959", fontWeight: "700" },
  headerValue: { fontSize: 12, color: "#565959", fontWeight: "500" },
  shipToContainer: { flexDirection: 'row', alignItems: 'center' },
  headerActionsRight: { alignItems: 'flex-end', flex: 1, minWidth: 150 },
  headerOrderId: { fontSize: 11, color: "#565959", fontWeight: "500", marginBottom: 4 },
  headerLinks: { flexDirection: 'row', alignItems: 'center' },
  headerLink: { fontSize: 12, color: "#007185", fontWeight: "00" },
  vDivider: { width: 1, height: 12, backgroundColor: '#d5d9d9', marginHorizontal: 8 },
  cardContent: {
    padding: 16,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: 20,
  },
  mainCol: { flex: 3 },
  statusTitle: { fontSize: 18, fontWeight: "700", color: colors.ink, marginBottom: 4 },
  statusDesc: { fontSize: 13, color: "#565959", marginBottom: 16 },
  productRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: spacing.lg,
  },
  itemImageContainer: {
    width: 90,
    height: 90,
    backgroundColor: '#fff',
    borderRadius: 4,
    padding: 4,
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImageFallback: {
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: '#eee',
  },
  productInfo: { flex: 1 },
  productName: {
    fontSize: 14,
    color: "#007185",
    lineHeight: 20,
    marginBottom: 8,
  },
  productActionsInner: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  buyAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.highlight,
  },
  buyAgainIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 87, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  buyAgainText: { fontSize: 12, fontWeight: '600', color: colors.ink },
  viewItemBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D5D9D9',
  },
  viewItemText: { fontSize: 12, fontWeight: '500', color: '#0F1111' },
  actionCol: { flex: 1, minWidth: 200, gap: 8 },
  primaryActionBtn: {
    backgroundColor: colors.highlight,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.highlight,
    boxShadow: '0 2px 5px rgba(246, 181, 30, 0.3)',
  },
  primaryActionText: { fontSize: 13, fontWeight: '500', color: colors.ink },
  secondaryActionBtn: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5D9D9',
    boxShadow: '0 2px 5px rgba(213,217,217,.5)',
  },
  secondaryActionText: { fontSize: 13, fontWeight: '500', color: '#0F1111' },
});
