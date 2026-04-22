import { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing } from "../theme/theme";
import { useStore } from "../context/StoreContext";
import { useSnackbar } from "../context/SnackbarContext";

function StarRow({ rating }) {
  const full = Math.round(rating);
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= full ? "star" : "star-outline"} size={14} color={colors.highlight} />
      ))}
    </View>
  );
}

export default function ProductCard({ item, index = 0, compact }) {
  const [hovered, setHovered] = useState(false);
  const navigation = useNavigation();
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { showMessage } = useSnackbar();

  const showOverlay = Platform.OS === "web" ? hovered : false;
  const showAddCart = Platform.OS !== "web" || showOverlay;
  const wished = isWishlisted(item.id);
  const openDetails = () => navigation.navigate("ProductDetails", { productId: item.id });

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 45, 400)).duration(420)}
      style={styles.wrap}
    >
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <View style={styles.imageBox}>
          <Pressable onHoverIn={() => setHovered(true)} onPress={openDetails}>
            <Image source={{ uri: item.image }} style={styles.image} contentFit="cover" transition={200} />
          </Pressable>
          {item.sale ? (
            <View style={styles.saleBadge}>
              <Text style={styles.saleText}>SALE</Text>
            </View>
          ) : null}
          {item.isFlashSale ? (
            <View style={[styles.saleBadge, styles.flashSaleBadge]}>
              <Ionicons name="flash" size={10} color="white" style={{ marginRight: 2 }} />
              <Text style={[styles.saleText, styles.flashSaleText]}>FLASH SALE</Text>
            </View>
          ) : null}
          <View style={[styles.hoverActions, !showOverlay && styles.hoverHiddenWeb]}>
            <Pressable
              onHoverIn={() => setHovered(true)}
              onPress={() => {
                toggleWishlist(item.id);
                showMessage(wished ? "Removed from wishlist" : "Added to wishlist");
              }}
              style={styles.iconCircle}
            >
              <Ionicons
                name={wished ? "heart" : "heart-outline"}
                size={18}
                color={wished ? "#c11b1b" : colors.ink}
              />
            </Pressable>
            <Pressable
              onHoverIn={() => setHovered(true)}
              onPress={openDetails}
              style={styles.iconCircle}
            >
              <Ionicons name="eye-outline" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <Pressable
            onHoverIn={() => setHovered(true)}
            onPress={() => {
              addToCart(item.id, 1);
              showMessage(`${item.name} added to cart`);
            }}
            style={[styles.addCart, !showAddCart && styles.addCartHiddenWeb]}
          >
            <Text style={styles.addCartText}>ADD TO CART</Text>
          </Pressable>
        </View>
        <Pressable style={styles.infoBlock} onHoverIn={() => setHovered(true)} onPress={openDetails}>
          <Text style={styles.category}>{item.category.toUpperCase()}</Text>
          <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.rowBottom}>
            <StarRow rating={item.rating} />
            <Text style={styles.reviews}>({item.reviews})</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.price, item.isFlashSale && styles.flashPrice]}>{item.priceLabel}</Text>
            {item.oldPriceLabel && (
              <Text style={styles.oldPrice}>{item.oldPriceLabel}</Text>
            )}
          </View>

          {item.isFlashSale && item.flashSaleTotalQty > 0 && (
            <View style={styles.flashSaleStock}>
              <View style={styles.progressBg}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${Math.min((item.flashSaleSoldQty / item.flashSaleTotalQty) * 100, 100)}%` }
                  ]} 
                />
              </View>
              <Text style={styles.stockLabel}>
                {Math.max(item.flashSaleTotalQty - item.flashSaleSoldQty, 0)} items left
              </Text>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.08)",
    overflow: "hidden",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 8px 28px rgba(13, 87, 49, 0.08)",
        }
      : {
          shadowColor: "#0d5731",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          elevation: 4,
        }),
  },
  cardCompact: {
    padding: 6,
  },
  imageBox: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  image: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: colors.surface,
  },
  saleBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: colors.highlight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flashSaleBadge: {
    backgroundColor: "#ef4444",
    top: 40,
    flexDirection: "row",
    alignItems: "center",
  },
  flashSaleText: {
    color: colors.white,
  },
  saleText: {
    fontWeight: "800",
    fontSize: 11,
    color: colors.ink,
    letterSpacing: 0.5,
  },
  hoverActions: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    gap: 8,
    zIndex: 2,
  },
  hoverHiddenWeb: Platform.select({
    web: { opacity: 0, pointerEvents: "none" },
    default: {},
  }),
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 8px 18px rgba(0, 0, 0, 0.08)",
        }
      : {}),
  },
  addCart: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
    paddingVertical: 12,
    alignItems: "center",
    zIndex: 2,
  },
  addCartHiddenWeb: Platform.select({
    web: { opacity: 0, pointerEvents: "none" },
    default: {},
  }),
  addCartText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
  },
  category: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.subtleText,
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  infoBlock: {
    alignItems: "flex-start",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.ink,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
    marginBottom: 6,
  },
  nameCompact: {
    fontSize: 15,
  },
  rowBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  starsRow: {
    flexDirection: "row",
    gap: 2,
  },
  reviews: {
    fontSize: 13,
    color: colors.subtleText,
  },
  price: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  flashPrice: {
    color: "#e03131",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  oldPrice: {
    color: colors.muted,
    textDecorationLine: "line-through",
    fontSize: 14,
    fontWeight: "500",
  },
  flashSaleStock: {
    marginTop: 8,
  },
  progressBg: {
    height: 4,
    backgroundColor: "rgba(224, 49, 49, 0.1)",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#e03131",
  },
  stockLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
});
