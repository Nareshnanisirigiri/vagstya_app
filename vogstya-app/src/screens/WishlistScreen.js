import { useMemo } from "react";
import { View, Text, StyleSheet, Platform, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useStore } from "../context/StoreContext";
import { useProducts } from "../context/ProductsContext";
import { useSnackbar } from "../context/SnackbarContext";
import { colors, spacing } from "../theme/theme";

const WIDE = 1180;
const TABLET = 720;

export default function WishlistScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { wishlistIds, addToCart, toggleWishlist } = useStore();
  const { products } = useProducts();
  const { showMessage } = useSnackbar();

  const list = useMemo(() => products.filter((p) => wishlistIds.includes(p.id)), [wishlistIds, products]);

  const isWide = width >= WIDE;
  const isTablet = width >= TABLET;
  const columns = isWide ? 5 : isTablet ? 3 : 2;
  const horizontalPad = isWide ? spacing.xl : spacing.md;
  const gap = 16;
  const gridWidth = width - horizontalPad * 2;
  const cardWidth = Math.max(160, (gridWidth - gap * (columns - 1)) / columns);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView
        contentContainerStyle={[styles.body, { paddingHorizontal: horizontalPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.title}>Wishlist ({list.length})</Text>
            <Text style={styles.sub}>Saved pieces curated in a cleaner storefront layout.</Text>
          </View>
          {list.length ? (
            <View style={styles.toolbarBadge}>
              <Ionicons name="heart-outline" size={16} color={colors.ink} />
              <Text style={styles.toolbarBadgeText}>{list.length} saved</Text>
            </View>
          ) : null}
        </View>

        {list.length ? (
          <View style={styles.noticeBar}>
            <Text style={styles.noticeText}>
              Your favorite items are ready to review. Tap a card to view details or add directly to bag.
            </Text>
          </View>
        ) : null}

        {list.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="heart-outline" size={34} color={colors.muted} />
            <Text style={styles.emptyTitle}>Your wishlist is empty.</Text>
            <Text style={styles.emptyText}>Save products you love and they will appear here.</Text>
            <Pressable style={styles.emptyBtn} onPress={() => navigation.navigate("Shop")}>
              <Text style={styles.emptyBtnText}>Go to Shop</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.grid}>
            {list.map((item) => (
              <View key={item.id} style={{ width: cardWidth }}>
                <View style={styles.card}>
                  <Pressable
                    onPress={() => {
                      toggleWishlist(item.id);
                      showMessage("Removed from wishlist");
                    }}
                    hitSlop={8}
                    style={styles.removeBtn}
                  >
                    <Ionicons name="heart-dislike-outline" size={18} color={colors.ink} />
                  </Pressable>

                  {item.sale ? (
                    <View style={styles.saleBadge}>
                      <Text style={styles.saleText}>SALE</Text>
                    </View>
                  ) : null}

                  <Pressable
                    style={styles.imagePanel}
                    onPress={() => navigation.navigate("ProductDetails", { productId: item.id })}
                  >
                    <Image source={{ uri: item.image }} style={styles.image} contentFit="contain" transition={180} />
                  </Pressable>

                  <View style={styles.cardBody}>
                    <Text style={styles.brand}>{item.category}</Text>
                    <Text style={styles.name} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.meta} numberOfLines={2}>
                      Rating {Number(item.rating || 0).toFixed(1)} | {item.reviews || 0} reviews
                    </Text>
                    <Text style={styles.price}>{item.priceLabel}</Text>
                  </View>

                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => {
                      addToCart(item.id, 1);
                      showMessage(`${item.name} added to cart`);
                    }}
                  >
                    <Ionicons name="bag-handle-outline" size={16} color={colors.white} />
                    <Text style={styles.actionText}>Add to Bag</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    flexWrap: "wrap",
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  sub: {
    marginTop: 6,
    color: colors.subtleText,
    fontWeight: "700",
  },
  toolbarBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.10)",
  },
  toolbarBadgeText: {
    color: colors.ink,
    fontWeight: "700",
  },
  noticeBar: {
    marginBottom: spacing.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.highlightSoft,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.08)",
  },
  noticeText: {
    color: colors.ink,
    fontWeight: "700",
    lineHeight: 20,
  },
  empty: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.12)",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 20,
  },
  emptyText: {
    color: colors.subtleText,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyBtn: {
    marginTop: 10,
    backgroundColor: colors.ink,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  card: {
    position: "relative",
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.08)",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 10px 30px rgba(13, 87, 49, 0.07)" }
      : {
          elevation: 3,
          shadowColor: "#0d5731",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 18,
        }),
  },
  removeBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  saleBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.highlight,
  },
  saleText: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 11,
    letterSpacing: 0.4,
  },
  imagePanel: {
    aspectRatio: 0.95,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  cardBody: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
    alignItems: "center",
  },
  brand: {
    color: colors.subtleText,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  name: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  meta: {
    marginTop: 8,
    color: colors.subtleText,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    minHeight: 40,
  },
  price: {
    marginTop: 10,
    color: colors.accent,
    fontSize: 22,
    fontWeight: "900",
  },
  actionBtn: {
    margin: 12,
    marginTop: 0,
    backgroundColor: colors.ink,
    borderRadius: 10,
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 15,
  },
});
