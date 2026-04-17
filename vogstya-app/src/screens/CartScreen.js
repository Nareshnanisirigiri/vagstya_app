import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, useWindowDimensions, TextInput } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useStore } from "../context/StoreContext";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";

export default function CartScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1080;
  const isTablet = width >= 720;
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const { cartItems, cartCount, setCartQty, removeFromCart } = useStore();
  const { products } = useProducts();

  const rows = useMemo(() => {
    return cartItems
      .map((ci) => {
        const p = products.find((x) => x.id === ci.id);
        if (!p) return null;
        return { ...p, qty: ci.qty };
      })
      .filter(Boolean);
  }, [cartItems, products]);

  const total = useMemo(() => rows.reduce((sum, r) => sum + r.price * r.qty, 0), [rows]);
  const discount = appliedCoupon === "VOGSTYA20" ? total * 0.2 : 0;
  const discountedSubtotal = Math.max(total - discount, 0);
  const delivery = rows.length ? 8 : 0;
  const grandTotal = discountedSubtotal + delivery;

  function formatPrice(amount) {
    return `₹${Number(amount || 0).toFixed(2)}`;
  }

  function applyCoupon() {
    const normalized = String(couponCode || "").trim().toUpperCase();
    if (normalized === "VOGSTYA20") {
      setAppliedCoupon(normalized);
      setCouponCode(normalized);
      return;
    }
    setAppliedCoupon("");
  }

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.pageShell}>
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="bag-outline" size={34} color={colors.muted} />
              <Text style={styles.emptyTitle}>Your cart is empty.</Text>
              <Text style={styles.emptyText}>Add a few favorites and come back here to review them.</Text>
            </View>
          ) : (
            <View style={styles.cartShell}>
              <View style={[styles.cartHeaderRow, !isTablet && styles.cartHeaderRowStack]}>
                <Text style={styles.cartCountText}>You have {cartCount} products in your cart</Text>
                <Text style={styles.deliveryHint}>
                  Expected Delivery: <Text style={styles.deliveryHintStrong}>Friday</Text>
                </Text>
              </View>

              <View style={[styles.contentRow, !isDesktop && styles.contentRowStack]}>
                <View style={styles.itemsColumn}>
                  <View style={styles.itemsWrap}>
                    {rows.map((r) => (
                      <View key={r.id} style={[styles.itemRow, !isTablet && styles.itemRowMobile]}>
                        <View style={[styles.itemInfoCard, !isDesktop && styles.itemInfoCardCompact]}>
                          <View style={styles.productBlock}>
                            <View style={styles.imageFrame}>
                              <Image source={{ uri: r.image }} style={styles.image} contentFit="cover" transition={120} />
                              <Pressable onPress={() => removeFromCart(r.id)} hitSlop={10} style={styles.removeBadge}>
                                <Ionicons name="trash-outline" size={14} color="#6e1d1d" />
                              </Pressable>
                            </View>

                            <View style={styles.productMeta}>
                              <Text style={styles.name}>{r.name}</Text>
                              <Text style={styles.metaLine}>
                                Color: <Text style={styles.metaStrong}>Signature Green</Text>
                              </Text>
                              <Text style={styles.metaLine}>
                                Size: <Text style={styles.metaStrong}>XL</Text>
                              </Text>
                              <View style={styles.stockRow}>
                                <View style={styles.stockDot} />
                                <Text style={styles.stockText}>In Stock ({Math.max(1, 12 - r.qty)} Pcs)</Text>
                              </View>
                            </View>
                          </View>

                          <View style={[styles.metricsGroup, !isTablet && styles.metricsGroupMobile]}>
                            <View style={[styles.metricCard, styles.priceCol, !isTablet && styles.mobileInlineCell]}>
                              <Text style={styles.mobileLabel}>Price</Text>
                              <Text style={styles.cellValue}>{formatPrice(r.price)}</Text>
                            </View>

                            <View style={[styles.metricCard, styles.qtyCol, !isTablet && styles.mobileInlineCell]}>
                              <Text style={styles.mobileLabel}>Quantity</Text>
                              <View style={styles.qty}>
                                <Pressable onPress={() => setCartQty(r.id, r.qty - 1)} hitSlop={10} style={styles.qtyBtn}>
                                  <Ionicons name="remove" size={18} color="#1d1a18" />
                                </Pressable>
                                <Text style={styles.qtyText}>{r.qty}</Text>
                                <Pressable onPress={() => setCartQty(r.id, r.qty + 1)} hitSlop={10} style={styles.qtyBtn}>
                                  <Ionicons name="add" size={18} color="#1d1a18" />
                                </Pressable>
                              </View>
                            </View>

                            <View style={[styles.metricCard, styles.totalCol, !isTablet && styles.mobileInlineCell]}>
                              <Text style={styles.mobileLabel}>Total</Text>
                              <Text style={styles.cellTotal}>{formatPrice(r.price * r.qty)}</Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={[styles.summaryAside, isDesktop && styles.summaryAsideDesktop]}>
                  <View style={[styles.summaryCardsRow, !isTablet && styles.summaryCardsRowStack]}>
                    <View style={[styles.summaryPanel, styles.summaryDataCard]}>
                      <View style={styles.couponWrap}>
                        <Text style={styles.couponLabel}>Coupon</Text>
                        <View style={[styles.couponRow, !isTablet && styles.couponRowStack]}>
                          <TextInput
                            value={couponCode}
                            onChangeText={setCouponCode}
                            placeholder="Enter coupon code"
                            placeholderTextColor="#98a0ad"
                            autoCapitalize="characters"
                            style={styles.couponInput}
                          />
                          <Pressable style={styles.couponBtn} onPress={applyCoupon}>
                            <Text style={styles.couponBtnText}>Apply</Text>
                          </Pressable>
                        </View>
                        <Text style={styles.couponHint}>
                          {appliedCoupon === "VOGSTYA20"
                            ? "Coupon VOGSTYA20 applied: 20% off products"
                            : "Use coupon code VOGSTYA20 for 20% off products"}
                        </Text>
                      </View>

                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{formatPrice(total)}</Text>
                      </View>
                      {discount > 0 ? (
                        <View style={styles.summaryLine}>
                          <Text style={styles.discountLabel}>Discount</Text>
                          <Text style={styles.discountValue}>- {formatPrice(discount)}</Text>
                        </View>
                      ) : null}
                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryLabel}>Delivery</Text>
                        <Text style={styles.summaryValue}>{formatPrice(delivery)}</Text>
                      </View>
                      <View style={styles.summaryLine}>
                        <Text style={styles.summaryBig}>Grand Total</Text>
                        <Text style={styles.summaryBig}>{formatPrice(grandTotal)}</Text>
                      </View>
                      <Text style={styles.summaryNote}>Excl. tax and delivery charge</Text>

                      <Pressable style={styles.checkout} onPress={() => navigation.navigate("Checkout")}>
                        <Text style={styles.checkoutText}>Go To Checkout</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#eaf1f8" },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pageShell: {
    width: "100%",
    maxWidth: 1380,
    alignSelf: "center",
  },
  cartShell: {
    marginTop: spacing.xl,
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    borderColor: "rgba(27, 39, 94, 0.05)",
    ...(Platform.OS === "web" ? { boxShadow: "0 18px 64px rgba(58, 79, 142, 0.06)" } : {}),
  },
  cartHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cartHeaderRowStack: {
    alignItems: "flex-start",
  },
  cartCountText: {
    color: "#2f333d",
    fontSize: 18,
    fontWeight: "600",
  },
  deliveryHint: {
    color: "#707785",
    fontSize: 16,
    fontWeight: "500",
  },
  deliveryHintStrong: {
    color: "#181a1f",
    fontWeight: "800",
  },
  itemsWrap: {
    gap: 0,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 24,
  },
  contentRowStack: {
    flexDirection: "column",
  },
  itemsColumn: {
    flex: 1,
    minWidth: 0,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#edf0f6",
    gap: 18,
  },
  itemRowMobile: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: 14,
  },
  itemInfoCard: {
    width: "100%",
    alignSelf: "stretch",
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#fbfcff",
    borderWidth: 1,
    borderColor: "#edf0f6",
    gap: 16,
  },
  itemInfoCardCompact: {
    maxWidth: 600,
  },
  productBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 18,
  },
  imageFrame: {
    width: 104,
    height: 104,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#f5f7fb",
    position: "relative",
    flexShrink: 0,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  removeBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },
  productMeta: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#17181d",
    fontWeight: "800",
    fontSize: 18,
    marginBottom: 10,
  },
  metaLine: {
    color: "#666e7b",
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },
  metaStrong: {
    color: "#1b1d23",
    fontWeight: "800",
  },
  stockRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stockDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#1f2024",
  },
  stockText: {
    color: "#22242b",
    fontSize: 14,
    fontWeight: "700",
  },
  metricsGroup: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 12,
  },
  metricsGroupMobile: {
    width: "100%",
    flexDirection: "column",
  },
  metricCard: {
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: "#f7f9fc",
    borderWidth: 1,
    borderColor: "#edf0f6",
  },
  priceCol: {
    width: 120,
  },
  qtyCol: {
    width: 160,
  },
  totalCol: {
    width: 120,
  },
  mobileInlineCell: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  mobileLabel: {
    color: "#727987",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  cellValue: {
    color: "#15171c",
    fontWeight: "700",
    fontSize: 18,
  },
  cellTotal: {
    color: "#15171c",
    fontWeight: "900",
    fontSize: 19,
  },
  qty: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e5f0",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
  },
  qtyText: {
    minWidth: 42,
    textAlign: "center",
    fontWeight: "900",
    fontSize: 18,
    color: "#17181d",
  },
  summaryAside: {
    width: "100%",
    alignItems: "stretch",
  },
  summaryAsideDesktop: {
    width: 360,
    flexShrink: 0,
    position: "sticky",
    top: 24,
    minWidth: 250,
    maxWidth: 420,
  },
  summaryCardsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "flex-end",
    gap: 16,
  },
  summaryCardsRowStack: {
    flexDirection: "column",
  },
  summaryPanel: {
    gap: 8,
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#f7f9fc",
    borderWidth: 1,
    borderColor: "#edf0f6",
  },
  couponWrap: {
    marginBottom: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5eaf2",
    gap: 10,
  },
  couponLabel: {
    color: "#17181d",
    fontWeight: "800",
    fontSize: 15,
  },
  couponRow: {
    flexDirection: "row",
    gap: 10,
  },
  couponRowStack: {
    flexDirection: "column",
  },
  couponInput: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#dbe2ec",
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
    color: "#17181d",
    fontWeight: "700",
  },
  couponBtn: {
    minWidth: 94,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: "#17181d",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  couponBtnText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 14,
  },
  couponHint: {
    color: "#66707f",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 19,
  },
  summaryDataCard: {
    flex: 1,
    minWidth: 260,
  },
  summaryLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  summaryLabel: {
    color: "#737987",
    fontWeight: "700",
    fontSize: 15,
  },
  summaryValue: {
    color: "#17181d",
    fontWeight: "800",
    fontSize: 18,
  },
  discountLabel: {
    color: "#2d6a4f",
    fontWeight: "800",
    fontSize: 15,
  },
  discountValue: {
    color: "#2d6a4f",
    fontWeight: "900",
    fontSize: 18,
  },
  summaryBig: {
    color: "#17181d",
    fontWeight: "900",
    fontSize: 22,
  },
  summaryNote: {
    marginTop: 2,
    color: "#8a909b",
    fontSize: 13,
    textAlign: "right",
  },
  checkout: {
    marginTop: 12,
    backgroundColor: "#6f63ff",
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 8,
    minWidth: 220,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  checkoutText: {
    color: "#ffffff",
    fontWeight: "900",
    fontSize: 18,
    textTransform: "uppercase",
  },
  empty: {
    marginTop: spacing.xl,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: spacing.xxl,
    borderWidth: 1,
    borderColor: "rgba(27, 39, 94, 0.05)",
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    color: "#17181d",
    fontWeight: "900",
    fontSize: 22,
  },
  emptyText: {
    color: "#6f7683",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
    maxWidth: 420,
  },
});
