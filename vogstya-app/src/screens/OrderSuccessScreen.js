import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import BirthdayAnimation from "../components/BirthdayAnimation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOrders } from "../context/OrdersContext";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";

export default function OrderSuccessScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { orders, loading: ordersLoading } = useOrders();
  const { products } = useProducts();

  // Extract params passed from Checkout or UpiQr success
  const ordParamId = route.params?.orderId;
  const displayOrderId = route.params?.displayOrderId || `ORD-${ordParamId}`;

  // Find the order in context to get full details (essential for Web stability)
  const currentOrder = orders.find(o => 
    o.backendOrderId === Number(ordParamId) || o.id === ordParamId || o.id === displayOrderId
  );

  // Map items to include images from ProductsContext if missing
  const items = React.useMemo(() => {
    if (currentOrder?.items) {
      return currentOrder.items.map(it => {
        const p = products.find(x => x.id === it.productId);
        return {
          name: p?.name || it.name || "Product",
          qty: it.qty,
          size: it.size,
          image: p?.image || it.image,
          price: p?.price || it.price,
        };
      });
    }
    return route.params?.items || [];
  }, [currentOrder, products, route.params?.items]);

  const totals = currentOrder?.totals || route.params?.totals || { subtotal: 0, deliveryFee: 0, grandTotal: 0 };
  const address = currentOrder?.address || route.params?.address || {};

  if (ordersLoading && !currentOrder) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={[styles.body, { justifyContent: 'center', flex: 1 }]}>
           <Text style={styles.subtitleText}>Finalizing your order details...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <BirthdayAnimation />
        
        {/* Success Header Layer */}
        <View style={styles.successHeader}>
          <View style={styles.successIconBubble}>
            <Ionicons name="checkmark-circle" size={80} color={colors.accent} />
          </View>
          <Text style={styles.thankYouText}>Thank you for your purchase!</Text>
          <Text style={styles.subtitleText}>
            Your order <Text style={styles.strongText}>{displayOrderId}</Text> has been received and is currently being processed.
          </Text>
        </View>

        {/* Invoice Box */}
        <View style={[styles.invoiceCard, isWide && styles.invoiceCardWide]}>
          <View style={styles.invoiceHeaderRow}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDate}>{new Date().toLocaleDateString()}</Text>
          </View>

          <View style={styles.dottedLine} />

          {/* Items Section */}
          <View style={styles.itemsSection}>
            <Text style={styles.sectionLabel}>ORDERED ITEMS</Text>
            {items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} contentFit="cover" transition={200} />
                ) : (
                  <View style={[styles.itemImage, styles.itemImageFallback]}>
                    <Ionicons name="image-outline" size={24} color={colors.muted} />
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.itemMeta}>Qty: {item.qty} {item.size ? `| Size: ${item.size}` : ''}</Text>
                </View>
                <Text style={styles.itemPrice}>Rs.{(item.price * item.qty).toFixed(2)}</Text>
              </View>
            ))}
            {items.length === 0 && <Text style={styles.emptyText}>No item details available.</Text>}
          </View>

          <View style={styles.dottedLine} />

          {/* Totals Section */}
          <View style={styles.totalsSection}>
             <View style={styles.totRow}>
               <Text style={styles.totLabel}>Subtotal</Text>
               <Text style={styles.totValue}>Rs.{Number(totals.subtotal || 0).toFixed(2)}</Text>
             </View>
             <View style={styles.totRow}>
               <Text style={styles.totLabel}>Delivery</Text>
               <Text style={styles.totValue}>Rs.{Number(totals.deliveryFee || 0).toFixed(2)}</Text>
             </View>
             <View style={[styles.totRow, styles.grandRow]}>
               <Text style={styles.grandLabel}>Total Paid</Text>
               <Text style={styles.grandValue}>Rs.{Number(totals.grandTotal || 0).toFixed(2)}</Text>
             </View>
          </View>

          <View style={styles.dottedLine} />

          {/* Shipping Address Section */}
          {address.fullName ? (
            <View style={styles.addressSection}>
              <Text style={styles.sectionLabel}>SHIPPING TO</Text>
              <Text style={styles.addressText}>{address.fullName}</Text>
              <Text style={styles.addressText}>{address.street}</Text>
              <Text style={styles.addressText}>{address.city}, {address.state} {address.pincode}</Text>
              <Text style={styles.addressText}>Phone: {address.phone}</Text>
           </View>
          ) : null}

        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
           <Pressable style={styles.btnPrimary} onPress={() => navigation.navigate("Home")}>
              <Text style={styles.btnPrimaryText}>Continue Shopping</Text>
           </Pressable>
           <Pressable style={styles.btnSecondary} onPress={() => navigation.replace("Orders", { focusOrderId: displayOrderId })}>
              <Text style={styles.btnSecondaryText}>Track My Order</Text>
           </Pressable>
        </View>

        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },
  
  successHeader: {
    alignItems: 'center',
    marginVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  successIconBubble: {
    marginBottom: spacing.md,
  },
  thankYouText: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    textAlign: "center",
    marginBottom: spacing.sm,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  subtitleText: {
    fontSize: 16,
    color: colors.subtleText,
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 500,
  },
  strongText: {
    fontWeight: "800",
    color: colors.ink,
  },

  invoiceCard: {
    width: '100%',
    maxWidth: 600,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.15)",
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 25,
    elevation: 3,
    marginBottom: spacing.xl,
  },
  invoiceCardWide: {
    padding: 40,
  },
  invoiceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  invoiceTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 2,
  },
  invoiceDate: {
    fontSize: 14,
    color: colors.subtleText,
    fontWeight: "600",
  },
  dottedLine: {
    height: 1,
    width: "100%",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.2)",
    marginVertical: spacing.lg,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.subtleText,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  itemsSection: {},
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.1)",
  },
  itemImageFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: colors.subtleText,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  emptyText: {
    fontStyle: 'italic',
    color: colors.subtleText,
  },

  totalsSection: {},
  totRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totLabel: {
    fontSize: 15,
    color: colors.subtleText,
    fontWeight: "500",
  },
  totValue: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "600",
  },
  grandRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(13, 87, 49, 0.1)",
  },
  grandLabel: {
    fontSize: 18,
    color: colors.ink,
    fontWeight: "900",
  },
  grandValue: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: "900",
  },

  addressSection: {},
  addressText: {
    fontSize: 15,
    color: colors.ink,
    lineHeight: 24,
    fontWeight: "500",
  },

  buttonContainer: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "center",
    marginBottom: spacing.xxl,
    flexWrap: "wrap",
  },
  btnPrimary: {
    backgroundColor: colors.ink,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.ink,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

});
