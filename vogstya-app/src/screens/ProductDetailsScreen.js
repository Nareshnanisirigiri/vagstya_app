import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  useWindowDimensions,
  Animated as RNAnimated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  FadeInDown,
  FadeInRight,
  FadeInUp,
  SlideInDown,
  Layout,
  ZoomIn
} from "react-native-reanimated";
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
  const { width, height } = useWindowDimensions();
  const productId = route.params?.productId;
  const isDesktop = width >= 1080;
  const isTablet = width >= 720;
  const scrollRef = useRef(null);
  const scrollY = useRef(new RNAnimated.Value(0)).current;

  const { getProductById, products } = useProducts();
  const product = useMemo(() => getProductById(productId), [getProductById, productId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ y: 0, animated: false });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [productId]);

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
        overview: "Hand-finished jewelry designed for daily elegance, with skin-safe polish and premium detailing.",
        fit: "Designed for a refined everyday profile with a polished finish, balanced weight, and comfortable long-wear feel.",
      },
      Sarees: {
        brand: "Vogstya Ethnic",
        metalOptions: ["Silk", "Cotton Silk", "Linen"],
        sizeOptions: ["Free Size"],
        overview: "Exquisite hand-woven sarees with intricate patterns and premium fabric feel.",
        fit: "Elegant drape that contours beautifully, perfect for both festive occasions and formal settings.",
      },
      Men: {
        brand: "Vogstya Uomo",
        metalOptions: ["Steel", "Brass", "Titanium"],
        sizeOptions: ["S", "M", "L", "XL", "XXL"],
        overview: "Tailored statement essential with refined texture, built for comfort and long wear.",
        fit: "Relaxed silhouette with structured lines, meant to sit comfortably across the shoulders and chest.",
      },
      Women: {
        brand: "Vogstya Femme",
        metalOptions: ["Gold Tone", "Silver Tone", "Rose Tone"],
        sizeOptions: ["XS", "S", "M", "L", "XL"],
        overview: "Soft premium finish with elevated silhouette, designed to transition from day to evening.",
        fit: "Elegant drape with a flattering shape that works across casual styling and occasion wear.",
      },
    };
    const category = product?.category || "Jewelry";
    return byCategory[category] || byCategory.Jewelry;
  }, [product?.category]);

  const reviewSummary = useMemo(() => {
    const totalReviews = reviewsList.length;
    if (totalReviews === 0) return { average: "0.0", count: 0, distribution: [] };
    const totalStars = reviewsList.reduce((sum, r) => sum + r.rating, 0);
    const average = (totalStars / totalReviews).toFixed(1);
    const distribution = [5, 4, 3, 2, 1].map(stars => {
      const count = reviewsList.filter(r => r.rating === stars).length;
      return { stars, value: Math.round((count / totalReviews) * 100) };
    });
    return { average, count: totalReviews, distribution };
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
  const deliveryTime = "Est. 3-5 business days";

  const imageScale = scrollY.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: [1.3, 1, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        onScroll={RNAnimated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.pageShell}>
          {/* Breadcrumbs */}
          <Animated.View entering={FadeInUp.delay(100)} style={styles.breadcrumbRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.breadcrumbLink}>
              <Ionicons name="chevron-back" size={16} color={colors.ink} />
              <Text style={styles.breadcrumbText}>Collection</Text>
            </Pressable>
            <Ionicons name="chevron-forward" size={12} color={colors.muted} />
            <Text style={styles.breadcrumbCurrent}>{product.name}</Text>
          </Animated.View>

          <View style={[styles.mainSection, isDesktop && styles.mainSectionDesktop]}>
            {/* Gallery Section */}
            <View style={[styles.galleryContainer, isDesktop && styles.galleryDesktop]}>
              <Animated.View entering={ZoomIn.duration(600)} style={styles.imageCard}>
                <RNAnimated.Image
                  source={{ uri: product.image }}
                  style={[styles.heroImage, { transform: [{ scale: imageScale }] }]}
                  resizeMode="cover"
                />
                {product.sale && (
                  <View style={styles.premiumSaleBadge}>
                    <Text style={styles.premiumSaleText}>EXCLUSIVE OFFER</Text>
                  </View>
                )}
                <Pressable
                  onPress={() => toggleWishlist(product.id)}
                  style={styles.floatingWishBtn}
                >
                  <Ionicons
                    name={wished ? "heart" : "heart-outline"}
                    size={24}
                    color={wished ? colors.danger : colors.ink}
                  />
                </Pressable>
              </Animated.View>
            </View>

            {/* Info Section */}
            <View style={[styles.infoContainer, isDesktop && styles.infoDesktop]}>
              <Animated.View entering={FadeInRight.duration(500)}>
                <View style={styles.brandBadge}>
                  <Text style={styles.brandText}>{details.brand}</Text>
                </View>
                <Text style={styles.productTitle}>{product.name}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.productPrice}>{product.priceLabel}</Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={14} color={colors.highlight} />
                    <Text style={styles.ratingValue}>{reviewSummary.average}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Selectors */}
                <View style={styles.selectors}>
                  <Text style={styles.sectionLabel}>Select Size</Text>
                  <View style={styles.optionsRow}>
                    {details.sizeOptions.map(size => (
                      <Pressable
                        key={size}
                        onPress={() => setSelectedSize(size)}
                        style={[styles.optionChip, selectedSize === size && styles.optionChipActive]}
                      >
                        <Text style={[styles.optionText, selectedSize === size && styles.optionTextActive]}>{size}</Text>
                      </Pressable>
                    ))}
                  </View>

                  <Text style={styles.sectionLabel}>Material / Finish</Text>
                  <View style={styles.optionsRow}>
                    {details.metalOptions.map(metal => (
                      <Pressable
                        key={metal}
                        onPress={() => setSelectedMetal(metal)}
                        style={[styles.materialChip, selectedMetal === metal && styles.materialChipActive]}
                      >
                        <Text style={[styles.materialText, selectedMetal === metal && styles.materialTextActive]}>{metal}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Add to Cart Actions */}
                <View style={styles.purchaseBox}>
                  <View style={styles.qtyPicker}>
                    <Pressable onPress={() => setQty(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
                      <Ionicons name="remove" size={20} color={colors.ink} />
                    </Pressable>
                    <Text style={styles.qtyValue}>{qty}</Text>
                    <Pressable onPress={() => setQty(q => q + 1)} style={styles.qtyBtn}>
                      <Ionicons name="add" size={20} color={colors.ink} />
                    </Pressable>
                  </View>
                  <Pressable
                    onPress={() => {
                      addToCart(product.id, qty);
                      showMessage(`${product.name} added to cart`);
                    }}
                    style={styles.primaryBtn}
                  >
                    <Text style={styles.primaryBtnText}>Add to Cart</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </Pressable>
                </View>

                {/* Trust Badges */}
                <View style={styles.trustRow}>
                  <View style={styles.trustItem}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
                    <Text style={styles.trustText}>Authentic</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Ionicons name="bus" size={16} color={colors.accent} />
                    <Text style={styles.trustText}>Free Shipping</Text>
                  </View>
                  <View style={styles.trustItem}>
                    <Ionicons name="refresh" size={16} color={colors.accent} />
                    <Text style={styles.trustText}>7-Day Returns</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Details & Specifications */}
          <View style={[styles.detailsSection, isDesktop && styles.detailsDesktop]}>
            <Animated.View entering={FadeInDown.delay(200)} style={styles.detailsCard}>
              <Text style={styles.detailTitle}>Product Overview</Text>
              <Text style={styles.detailDescription}>{details.overview}</Text>
              <Text style={styles.detailTitle}>Fit & Feel</Text>
              <Text style={styles.detailDescription}>{details.fit}</Text>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)} style={styles.specsCard}>
              <Text style={styles.detailTitle}>Specifications</Text>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Collection</Text>
                <Text style={styles.specValue}>{product.category}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Material</Text>
                <Text style={styles.specValue}>{selectedMetal}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Brand</Text>
                <Text style={styles.specValue}>{details.brand}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.specLabel}>Availability</Text>
                <Text style={[styles.specValue, { color: colors.success }]}>In Stock</Text>
              </View>
            </Animated.View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsContainer}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionHeading}>Customer Reviews</Text>
              <Pressable
                onPress={() => navigation.navigate("WriteReview", { productId: product.id })}
                style={styles.outlineBtn}
              >
                <Text style={styles.outlineBtnText}>Write a Review</Text>
              </Pressable>
            </View>

            <View style={[styles.reviewsContent, isDesktop && styles.reviewsDesktop]}>
              <View style={styles.ratingSummaryCard}>
                <Text style={styles.avgRatingText}>{reviewSummary.average}</Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <Ionicons key={i} name="star" size={16} color={colors.highlight} />
                  ))}
                </View>
                <Text style={styles.ratingCountText}>{reviewSummary.count} verified reviews</Text>

                <View style={styles.distribList}>
                  {reviewSummary.distribution.map(item => (
                    <View key={item.stars} style={styles.distribRow}>
                      <Text style={styles.distribLabel}>{item.stars}★</Text>
                      <View style={styles.distribTrack}>
                        <View style={[styles.distribFill, { width: `${item.value}%` }]} />
                      </View>
                      <Text style={styles.distribValue}>{item.value}%</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.reviewList}>
                {reviewsLoading ? (
                  <Text style={styles.loadingText}>Loading reviews...</Text>
                ) : reviewsList.length === 0 ? (
                  <View style={styles.noReviewsBox}>
                    <Ionicons name="chatbubbles-outline" size={40} color={colors.muted} />
                    <Text style={styles.noReviewsText}>No reviews yet. Be the first to share your experience!</Text>
                  </View>
                ) : (
                  reviewsList.map((review, i) => (
                    <Animated.View key={review.id} entering={FadeInDown.delay(i * 100)} style={styles.reviewItemCard}>
                      <View style={styles.reviewItemHead}>
                        <View style={styles.userAvatar}>
                          <Text style={styles.avatarText}>{review.user_name?.charAt(0).toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.reviewUser}>{review.user_name}</Text>
                          <View style={styles.smallStarRow}>
                            {[1, 2, 3, 4, 5].map(s => (
                              <Ionicons key={s} name={s <= review.rating ? "star" : "star-outline"} size={12} color={colors.highlight} />
                            ))}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>{new Date(review.created_at).toLocaleDateString()}</Text>
                      </View>
                      <Text style={styles.reviewTitle}>{review.title}</Text>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                    </Animated.View>
                  ))
                )}
              </View>
            </View>
          </View>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionHeading}>You might also love</Text>
              <View style={styles.relatedGrid}>
                {relatedProducts.map((item, idx) => (
                  <View 
                    key={item.id} 
                    style={[
                      styles.relatedItem,
                      { width: isDesktop ? '23.5%' : isTablet ? '48%' : '100%' }
                    ]}
                  >
                    <ProductCard item={item} index={idx} />
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>

      {/* Floating Action Bar (Mobile) */}
      {!isDesktop && (
        <Animated.View entering={SlideInDown.duration(400)} style={styles.floatingActions}>
          <View style={styles.floatingPriceBox}>
            <Text style={styles.floatingPrice}>{product.priceLabel}</Text>
            <Text style={styles.floatingName} numberOfLines={1}>{product.name}</Text>
          </View>
          <Pressable
            onPress={() => {
              addToCart(product.id, qty);
              showMessage("Added to cart");
            }}
            style={styles.floatingBtn}
          >
            <Text style={styles.floatingBtnText}>Add to Cart</Text>
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { paddingBottom: 100 },
  pageShell: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.lg,
  },
  breadcrumbLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  breadcrumbCurrent: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '500',
  },
  mainSection: {
    gap: 32,
  },
  mainSectionDesktop: {
    flexDirection: 'row',
  },
  galleryContainer: {
    flex: 1,
  },
  galleryDesktop: {
    flex: 1,
  },
  imageCard: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.white,
    position: 'relative',
    width: "100%",
    ...Platform.select({
      web: { boxShadow: '0 20px 50px rgba(13, 87, 49, 0.1), 0 5px 15px rgba(0,0,0,0.04)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 8
      }
    })
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1.1,
  },
  premiumSaleBadge: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: colors.highlight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  premiumSaleText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  floatingWishBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  infoDesktop: {
    paddingLeft: 20,
  },
  brandBadge: {
    backgroundColor: 'rgba(13, 87, 49, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  brandText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  productTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 12,
    fontFamily: Platform.OS === 'web' ? 'Georgia, serif' : undefined,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  optionChip: {
    minWidth: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  optionChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(13, 87, 49, 0.05)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  optionTextActive: {
    color: colors.accent,
  },
  materialChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  materialChipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(13, 87, 49, 0.05)',
  },
  materialText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  materialTextActive: {
    color: colors.accent,
  },
  purchaseBox: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  qtyPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  qtyBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    minWidth: 30,
    textAlign: 'center',
  },
  primaryBtn: {
    paddingHorizontal: 50,
    backgroundColor: colors.highlight,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    ...Platform.select({
      web: { boxShadow: '0 8px 25px rgba(246, 181, 30, 0.25)' },
      default: { elevation: 6 }
    })
  },
  primaryBtnText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(13, 87, 49, 0.03)',
    padding: 16,
    borderRadius: 20,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.accent,
  },
  detailsSection: {
    marginTop: 48,
    gap: 24,
  },
  detailsDesktop: {
    flexDirection: 'row',
  },
  detailsCard: {
    flex: 1.5,
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 32,
    ...Platform.select({
      web: { boxShadow: '0 15px 40px rgba(13, 87, 49, 0.06), 0 4px 12px rgba(0,0,0,0.02)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4
      }
    })
  },
  specsCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 32,
    ...Platform.select({
      web: { boxShadow: '0 15px 40px rgba(13, 87, 49, 0.06), 0 4px 12px rgba(0,0,0,0.02)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4
      }
    })
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 16,
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.subtleText,
    marginBottom: 24,
  },
  specItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  specLabel: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
  },
  specValue: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '800',
  },
  reviewsContainer: {
    marginTop: 64,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  outlineBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  outlineBtnText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 14,
  },
  reviewsContent: {
    gap: 32,
  },
  reviewsDesktop: {
    flexDirection: 'row',
  },
  ratingSummaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: 32,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 15px 45px rgba(13, 87, 49, 0.08)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 5
      }
    })
  },
  avgRatingText: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.ink,
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
  },
  ratingCountText: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 24,
  },
  distribList: {
    width: '100%',
    gap: 12,
  },
  distribRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  distribLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.muted,
    width: 25,
  },
  distribTrack: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(13, 87, 49, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  distribFill: {
    height: '100%',
    backgroundColor: colors.highlight,
    borderRadius: 3,
  },
  distribValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
    width: 35,
    textAlign: 'right',
  },
  reviewList: {
    flex: 2.5,
    gap: 20,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.muted,
  },
  noReviewsBox: {
    backgroundColor: 'rgba(13, 87, 49, 0.02)',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
  },
  noReviewsText: {
    textAlign: 'center',
    fontSize: 16,
    color: colors.muted,
    maxWidth: 300,
    lineHeight: 24,
  },
  reviewItemCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0 8px 25px rgba(13, 87, 49, 0.05)' },
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3
      }
    })
  },
  reviewItemHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 87, 49, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.accent,
  },
  reviewUser: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  smallStarRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '600',
  },
  reviewTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 8,
  },
  reviewComment: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.subtleText,
  },
  relatedSection: {
    marginTop: 64,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 24,
  },
  relatedItem: {
    marginBottom: 8,
  },
  floatingActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    gap: 16,
    ...Platform.select({
      web: { boxShadow: '0 -10px 30px rgba(0,0,0,0.08)' },
      default: { elevation: 20 }
    })
  },
  floatingPriceBox: {
    flex: 1,
  },
  floatingPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.ink,
  },
  floatingName: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },
  floatingBtn: {
    flex: 1.5,
    backgroundColor: colors.highlight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  floatingBtnText: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 15,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: colors.muted,
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
});
