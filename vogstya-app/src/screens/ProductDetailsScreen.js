import { useMemo, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, useWindowDimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Image } from "expo-image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useStore } from "../context/StoreContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";
import { apiRequest } from "../api/client";

export default function ProductDetailsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const productId = route.params?.productId;
  const isDesktop = width >= 1080;
  const isTablet = width >= 720;
  const { getProductById, products } = useProducts();
  const product = useMemo(() => getProductById(productId), [getProductById, productId]);
  const [qty, setQty] = useState(1);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedMetal, setSelectedMetal] = useState("Sterling Silver");
  const { addToCart, toggleWishlist, isWishlisted } = useStore();
  const { showMessage } = useSnackbar();

  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      const response = await apiRequest(`/products/${productId}/reviews`);
      if (response && response.reviews) {
        setReviewsList(response.reviews);
      }
    } catch (error) {
      console.error("Fetch Reviews Error:", error);
    } finally {
      setReviewsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const details = useMemo(() => {
    const byCategory = {
      Jewelry: {
        brand: "Vogstya Atelier",
        metalOptions: ["Sterling Silver", "Gold Plated", "Rose Gold"],
        sizeOptions: ["6", "7", "8", "9"],
        overview:
          "Hand-finished jewelry designed for daily elegance, with skin-safe polish and premium detailing.",
        fit:
          "Designed for a refined everyday profile with a polished finish, balanced weight, and comfortable long-wear feel.",
      },
      Men: {
        brand: "Vogstya Uomo",
        metalOptions: ["Steel", "Brass", "Titanium"],
        sizeOptions: ["S", "M", "L", "XL", "XXL"],
        overview:
          "Tailored statement essential with refined texture, built for comfort and long wear.",
        fit:
          "Relaxed silhouette with structured lines, meant to sit comfortably across the shoulders and chest.",
      },
      Women: {
        brand: "Vogstya Femme",
        metalOptions: ["Gold Tone", "Silver Tone", "Rose Tone"],
        sizeOptions: ["XS", "S", "M", "L", "XL"],
        overview:
          "Soft premium finish with elevated silhouette, designed to transition from day to evening.",
        fit:
          "Elegant drape with a flattering shape that works across casual styling and occasion wear.",
      },
      Kids: {
        brand: "Vogstya Junior",
        metalOptions: ["Alloy", "Resin", "Cotton Blend"],
        sizeOptions: ["2-4Y", "4-6Y", "6-8Y", "8-10Y"],
        overview:
          "Play-ready premium quality with comfort-first construction and durable everyday styling.",
        fit:
          "Comfort-first fit with room to move and soft-touch finishing for all-day wear.",
      },
      Electronics: {
        brand: "Vogstya Tech",
        metalOptions: ["Aluminum", "Polycarbonate", "ABS Composite"],
        sizeOptions: ["Compact", "Standard", "Pro"],
        overview:
          "Smart, reliable build with clean finishing and modern utility engineered for everyday use.",
        fit:
          "Minimal profile engineered for daily convenience, portability, and clean presentation.",
      },
    };
    const category = product?.category || "Jewelry";
    return byCategory[category] || byCategory.Jewelry;
  }, [product?.category]);

  const reviewSummary = useMemo(() => {
    const totalReviews = reviewsList.length;
    if (totalReviews === 0) {
      return {
        average: "0.0",
        count: 0,
        distribution: [
          { stars: 5, value: 0 },
          { stars: 4, value: 0 },
          { stars: 3, value: 0 },
          { stars: 2, value: 0 },
          { stars: 1, value: 0 },
        ],
      };
    }

    const totalStars = reviewsList.reduce((sum, r) => sum + r.rating, 0);
    const average = (totalStars / totalReviews).toFixed(1);
    
    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = reviewsList.filter(r => r.rating === stars).length;
      return { stars, value: Math.round((count / totalReviews) * 100) };
    });

    return {
      average,
      count: totalReviews,
      distribution,
    };
  }, [reviewsList]);

  const relatedProducts = useMemo(() => {
    if (!product) return [];
    return products
      .filter((item) => item.id !== product.id && item.category === product.category)
      .slice(0, 4);
  }, [product, products]);

  if (!product) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Product not found.</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const wished = isWishlisted(product.id);
  const deliveryTime = qty > 1 ? "3-5 business days" : "Next day in select cities";

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.pageShell}>
          <Pressable onPress={() => navigation.goBack()} style={styles.breadcrumbRow}>
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
            <Text style={styles.breadcrumbText}>Home</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.muted} />
            <Text style={styles.breadcrumbCurrent}>Product details</Text>
          </Pressable>

          <View style={[styles.heroSection, isDesktop && styles.heroSectionDesktop]}>
            <Animated.View entering={FadeInDown.duration(350)} style={[styles.galleryCol, isDesktop && styles.galleryColDesktop]}>
              <View style={styles.galleryCard}>
                <Image source={{ uri: product.image }} style={styles.heroImage} contentFit="cover" transition={180} />
                {product.sale ? (
                  <View style={styles.saleBadge}>
                    <Text style={styles.saleText}>SALE</Text>
                  </View>
                ) : null}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(80).duration(350)} style={[styles.infoCol, isDesktop && styles.infoColDesktop]}>
              <View style={styles.infoCard}>
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryPillText}>{product.category}</Text>
                </View>
                <Text style={styles.title}>{product.name}</Text>
                <Text style={styles.price}>{product.priceLabel}</Text>

                <View style={styles.inlineMeta}>
                  <View style={styles.inlineMetaLeft}>
                    <Ionicons name="star" size={14} color={colors.highlight} />
                    <Text style={styles.inlineMetaText}>{reviewSummary.average} rating</Text>
                    <Text style={styles.inlineMetaMuted}>({reviewSummary.count} reviews)</Text>
                  </View>
                  <Text style={styles.stockText}>In stock</Text>
                </View>

                <View style={styles.deliveryBar}>
                  <Ionicons name="timer-outline" size={16} color={colors.ink} />
                  <Text style={styles.deliveryText}>{deliveryTime}</Text>
                </View>

                <Text style={styles.selectorLabel}>Select Size</Text>
                <View style={styles.sizeRow}>
                  {details.sizeOptions.map((size) => (
                    <Pressable
                      key={size}
                      onPress={() => setSelectedSize(size)}
                      style={[styles.sizeChip, selectedSize === size && styles.sizeChipOn]}
                    >
                      <Text style={[styles.sizeChipText, selectedSize === size && styles.sizeChipTextOn]}>{size}</Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.selectorLabel}>Select Finish</Text>
                <View style={styles.finishRow}>
                  {details.metalOptions.map((metal) => (
                    <Pressable
                      key={metal}
                      onPress={() => setSelectedMetal(metal)}
                      style={[styles.finishChip, selectedMetal === metal && styles.finishChipOn]}
                    >
                      <Text style={[styles.finishChipText, selectedMetal === metal && styles.finishChipTextOn]}>
                        {metal}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.qtyRow}>
                  <Text style={styles.qtyLabel}>Quantity</Text>
                  <View style={styles.qty}>
                    <Pressable onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={18} color={colors.ink} />
                    </Pressable>
                    <Text style={styles.qtyText}>{qty}</Text>
                    <Pressable onPress={() => setQty((q) => q + 1)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={18} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.actions}>
                  <Pressable
                    onPress={() => {
                      addToCart(product.id, qty);
                      showMessage(`${product.name} (${selectedSize}) added to cart`);
                    }}
                    style={styles.cartBtn}
                  >
                    <Text style={styles.cartBtnText}>Add to cart</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      toggleWishlist(product.id);
                      showMessage(wished ? "Removed from wishlist" : "Added to wishlist");
                    }}
                    style={styles.wishBtn}
                  >
                    <Ionicons
                      name={wished ? "heart" : "heart-outline"}
                      size={18}
                      color={wished ? "#c11b1b" : colors.ink}
                    />
                  </Pressable>
                </View>
              </View>
            </Animated.View>
          </View>

          <View style={[styles.detailCardsRow, isDesktop && styles.detailCardsRowDesktop]}>
            <View style={[styles.detailsCard, isDesktop && styles.detailCardHalf]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Description & Fit</Text>
                  <Ionicons name="chevron-up" size={18} color={colors.ink} />
                </View>
                <Text style={styles.sectionCopy}>{details.overview}</Text>
                <Text style={styles.sectionCopy}>{details.fit}</Text>
            </View>

            <View style={[styles.detailsCard, isDesktop && styles.detailCardHalf]}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Shipping</Text>
                  <Ionicons name="chevron-up" size={18} color={colors.ink} />
                </View>
                <View style={styles.shippingGrid}>
                  <InfoMiniCard icon="pricetag-outline" label="Discount" value={product.sale ? "Active offer" : "Regular price"} />
                  <InfoMiniCard icon="cube-outline" label="Package" value="Secure packed" />
                  <InfoMiniCard icon="calendar-outline" label="Delivery" value={deliveryTime} />
                  <InfoMiniCard icon="shield-checkmark-outline" label="Support" value="Easy returns" />
                </View>
            </View>
          </View>

          <View style={styles.specPanel}>
                <SpecRow label="Brand" value={details.brand} />
                <SpecRow label="Category" value={product.category} />
                <SpecRow label="Finish" value={selectedMetal} />
                <SpecRow label="Selected Size" value={selectedSize} />
          </View>

          <View style={[styles.reviewSection, isDesktop && styles.reviewSectionDesktop]}>
            <View style={styles.reviewSummaryCard}>
              <Text style={styles.reviewSectionTitle}>Rating & Reviews</Text>
              <View style={styles.ratingHero}>
                <Text style={styles.ratingBig}>{reviewSummary.average}</Text>
                <Text style={styles.ratingOutOf}>/ 5</Text>
              </View>
              <Text style={styles.reviewCount}>({reviewSummary.count} customer reviews)</Text>

              <View style={styles.ratingBars}>
                {reviewSummary.distribution.map((item) => (
                  <View key={item.stars} style={styles.ratingBarRow}>
                    <Text style={styles.ratingBarLabel}>{item.stars}</Text>
                    <Ionicons name="star" size={12} color={colors.highlight} />
                    <View style={styles.ratingTrack}>
                      <View style={[styles.ratingFill, { width: `${item.value}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
              
              <Pressable 
                style={styles.writeReviewBtn}
                onPress={() => navigation.navigate("WriteReview", { productId: product.id })}
              >
                <Text style={styles.writeReviewBtnText}>Write a review</Text>
              </Pressable>
            </View>

            <View style={styles.reviewList}>
              {reviewsLoading ? (
                <View style={styles.reviewPlaceholder}>
                  <Text style={styles.reviewPlaceholderText}>Loading reviews...</Text>
                </View>
              ) : reviewsList.length === 0 ? (
                <View style={styles.reviewPlaceholder}>
                  <Text style={styles.reviewSectionTitle}>No reviews yet</Text>
                  <Text style={[styles.reviewPlaceholderText, { marginTop: 8 }]}>
                    Be the first to review this product and help other customers!
                  </Text>
                </View>
              ) : (
                reviewsList.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewCardHead}>
                      <View>
                        <Text style={styles.reviewAuthor}>{review.user_name}</Text>
                        <View style={styles.reviewStars}>
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Ionicons key={i} name={i <= review.rating ? "star" : "star-outline"} size={14} color={colors.highlight} />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.reviewHeadline}>{review.title}</Text>
                    <Text style={styles.reviewText}>{review.comment}</Text>
                    <View style={styles.reviewerRow}>
                      <View style={styles.reviewerAvatar}>
                        <Text style={styles.reviewerAvatarText}>{review.user_name?.charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={styles.reviewerMeta}>Verified buyer</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>

          {relatedProducts.length ? (
            <View style={styles.relatedSection}>
              <Text style={styles.relatedHeading}>You might also like</Text>
              <View style={[styles.relatedGrid, isDesktop && styles.relatedGridDesktop]}>
                {relatedProducts.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.relatedItem,
                      isDesktop ? styles.relatedItemDesktop : isTablet ? styles.relatedItemTablet : styles.relatedItemMobile,
                    ]}
                  >
                    <ProductCard item={item} index={index} compact />
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#efebe6" },
  body: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  pageShell: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
  },
  breadcrumbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.lg,
  },
  breadcrumbText: {
    color: colors.subtleText,
    fontSize: 15,
    fontWeight: "600",
  },
  breadcrumbCurrent: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  heroSection: {
    gap: spacing.lg,
  },
  heroSectionDesktop: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  galleryCol: {
    gap: spacing.md,
  },
  galleryColDesktop: {
    flex: 1,
  },
  galleryCard: {
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "#f8f6f2",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    position: "relative",
    width: "100%",
  },
  heroImage: {
    width: "100%",
     height: 420,
    aspectRatio: 0.92,
    backgroundColor: "#f4f2ee",
  },
  saleBadge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#f6d56d",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  saleText: {
    fontWeight: "900",
    fontSize: 11,
    color: "#231f1a",
    letterSpacing: 0.6,
  },
  infoCol: {
    gap: spacing.md,
  },
  infoColDesktop: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  detailCardsRow: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  detailCardsRowDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  categoryPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f7f5f0",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  categoryPillText: {
    color: "#38322c",
    fontWeight: "700",
    fontSize: 12,
  },
  title: {
    marginTop: 14,
    color: "#171411",
    fontSize: 25,
    lineHeight: 28,
    fontWeight: "500",
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  price: {
    marginTop: 14,
    color: "#171411",
    fontWeight: "800",
    fontSize: 30,
  },
  inlineMeta: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  inlineMetaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  inlineMetaText: {
    color: "#2b2621",
    fontWeight: "700",
    fontSize: 13,
  },
  inlineMetaMuted: {
    color: "#756e67",
    fontSize: 13,
  },
  stockText: {
    color: "#3c6a44",
    fontWeight: "700",
    fontSize: 13,
  },
  deliveryBar: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#fbfaf8",
  },
  deliveryText: {
    color: "#3d372f",
    fontSize: 13,
    fontWeight: "600",
  },
  selectorLabel: {
    marginTop: spacing.lg,
    marginBottom: 10,
    color: "#5d564f",
    fontWeight: "700",
    fontSize: 13,
  },
  sizeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sizeChip: {
    minWidth: 56,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: "#f3f1ec",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  sizeChipOn: {
    backgroundColor: "#1e1b18",
  },
  sizeChipText: {
    color: "#6f6962",
    fontWeight: "700",
    fontSize: 14,
  },
  sizeChipTextOn: {
    color: colors.white,
  },
  finishRow: {
    gap: 10,
  },
  finishChip: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f7f5f1",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  finishChipOn: {
    backgroundColor: "#efe6da",
    borderColor: "#ccb79c",
  },
  finishChipText: {
    color: "#4d463f",
    fontWeight: "700",
    fontSize: 13,
  },
  finishChipTextOn: {
    color: "#211d19",
  },
  qtyRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  qtyLabel: {
    color: "#5d564f",
    fontWeight: "700",
    fontSize: 14,
  },
  qty: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "#fcfbf9",
  },
  qtyBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#f8f6f1",
  },
  qtyText: {
    minWidth: 48,
    textAlign: "center",
    fontWeight: "900",
    color: "#1f1b18",
  },
  actions: {
    marginTop: spacing.lg,
    flexDirection: "row",
    gap: 12,
  },
  cartBtn: {
    flex: 1,
    backgroundColor: "#1f1b18",
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 14,
  },
  wishBtn: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fffdf9",
  },
  detailsCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  detailCardHalf: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderText: {
    color: "#1c1815",
    fontWeight: "800",
    fontSize: 21,
  },
  sectionCopy: {
    color: "#6b645d",
    lineHeight: 22,
    fontSize: 14,
    marginTop: 4,
  },
  shippingGrid: {
    gap: 12,
  },
  infoMiniCard: {
    borderRadius: 18,
    backgroundColor: "#f8f5f0",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    padding: 14,
  },
  infoMiniTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  infoMiniLabel: {
    color: "#8c847c",
    fontSize: 12,
    fontWeight: "700",
  },
  infoMiniValue: {
    color: "#221d19",
    fontWeight: "800",
    fontSize: 13,
  },
  specPanel: {
    backgroundColor: "#fbfaf8",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    gap: 12,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  specLabel: {
    color: "#827a72",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.4,
  },
  specValue: {
    color: "#211d19",
    fontWeight: "800",
    fontSize: 13,
    flexShrink: 1,
    textAlign: "right",
  },
  reviewSection: {
    marginTop: spacing.xxl,
    gap: spacing.lg,
  },
  reviewSectionDesktop: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  reviewSummaryCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flex: 0.9,
  },
  writeReviewBtn: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#d5d9d9',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    boxShadow: '0 2px 5px rgba(213,217,217,.5)',
  },
  writeReviewBtnText: {
    fontSize: 13,
    color: '#0f1111',
    fontWeight: '500',
  },
  reviewList: {
    flex: 1.1,
    gap: 16,
  },
  reviewPlaceholder: {
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.84)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewPlaceholderText: {
    color: '#8a837b',
    fontSize: 14,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: "rgba(255,255,255,0.84)",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    justifyContent: "space-between",
  },
  reviewCardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
  },
  reviewAuthor: {
    color: "#171411",
    fontWeight: "800",
    fontSize: 20,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
    marginTop: 8,
  },
  reviewDate: {
    color: "#8a837b",
    fontSize: 13,
    fontWeight: "600",
  },
  reviewHeadline: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  reviewText: {
    marginTop: 8,
    color: "#5f5952",
    lineHeight: 24,
    fontSize: 15,
  },
  reviewerRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  reviewerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "#efe4d8",
    alignItems: "center",
    justifyContent: "center",
  },
  reviewerAvatarText: {
    color: "#211d19",
    fontWeight: "900",
    fontSize: 18,
  },
  reviewerMeta: {
    color: "#6c655d",
    fontWeight: "700",
    fontSize: 13,
  },
  relatedSection: {
    marginTop: spacing.xxl,
  },
  relatedHeading: {
    color: "#161310",
    fontSize: 48,
    lineHeight: 52,
    textAlign: "center",
    fontWeight: "500",
    marginBottom: spacing.xl,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -8,
  },
  relatedGridDesktop: {
    flexWrap: "nowrap",
  },
  relatedItem: {
    paddingHorizontal: 8,
  },
  relatedItemDesktop: {
    width: "25%",
  },
  relatedItemTablet: {
    width: "50%",
  },
  relatedItemMobile: {
    width: "100%",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  emptyText: {
    color: colors.subtleText,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  backBtn: {
    backgroundColor: colors.ink,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: "800",
  },
});

function SpecRow({ label, value }) {
  return (
    <View style={styles.specRow}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

function InfoMiniCard({ icon, label, value }) {
  return (
    <View style={styles.infoMiniCard}>
      <View style={styles.infoMiniTop}>
        <Ionicons name={icon} size={16} color={colors.ink} />
        <Text style={styles.infoMiniLabel}>{label}</Text>
      </View>
      <Text style={styles.infoMiniValue}>{value}</Text>
    </View>
  );
}
