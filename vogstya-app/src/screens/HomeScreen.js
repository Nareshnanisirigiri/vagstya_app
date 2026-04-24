import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSlider from "../components/HeroSlider";
import AuspiciousBeginning from "../components/AuspiciousBeginning";
import CollectionsBanners from "../components/CollectionsBanners";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";
import { HOME_COLLECTIONS } from "../utils/shopCurations";
import { API_BASE_URL } from "../api/client";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { products, categories, loading } = useProducts();
  const isMobile = width < 768;
  const desktopCardWidth = 240;

  const featuredToDisplay = products.filter(p => p.isFeatured);
  const flashSaleProducts = products.filter(p => p.isFlashSale);

  const curatedCollections = HOME_COLLECTIONS.map((section) => {
    let items = [];
    if (section.key === "jewellery") {
      items = products.filter(p => p.isPopularJewellery);
    } else if (section.key === "mens-shirts") {
      items = products.filter(p => p.isMensShirts);
    } else if (section.key === "women") {
      items = products.filter(p => p.isWomensHighlights);
    } else if (section.key === "sarees") {
      items = products.filter(p => p.isPremiumSarees);
    }
    return { ...section, items };
  });

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <HeroSlider />

        <AuspiciousBeginning products={products} />
        <CollectionsBanners products={products} />

        {flashSaleProducts.length > 0 && (
          <View style={[styles.section, { backgroundColor: "#fff5f5" }]}>
            <View style={styles.sectionHead}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={[styles.sectionTitle, { color: "#e03131" }]}>Flash Sale</Text>
                <View style={{ backgroundColor: "#e03131", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>LIVE</Text>
                </View>
              </View>
              <Pressable onPress={() => navigation.navigate("BestDeals")} hitSlop={8}>
                <Text style={[styles.viewAll, { color: "#e03131" }]}>View all deals</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionIntro}>Exclusive, limited-time offers on our most exceptional pieces.</Text>
            
            {isMobile ? (
              <View style={styles.mobileGrid}>
                {flashSaleProducts.slice(0, 4).map((item, index) => (
                  <View key={item.id} style={styles.mobileCard}>
                    <ProductCard item={item} index={index} compact />
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
                {flashSaleProducts.map((item, index) => (
                  <View key={item.id} style={[styles.hCard, { width: desktopCardWidth }]}>
                    <ProductCard item={item} index={index} compact />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Featured Products</Text>
            <Pressable onPress={() => navigation.navigate("Shop", { collectionTitle: "Featured Edit" })} hitSlop={8}>
              <Text style={styles.viewAll}>View all</Text>
            </Pressable>
          </View>
          <Text style={styles.sectionIntro}>
            Up to 100 premium picks across sarees, jewellery, menswear, and women's collections.
          </Text>

          {loading ? (
            <Text style={styles.loading}>Loading products...</Text>
          ) : isMobile ? (
            <View style={styles.mobileGrid}>
              {featuredToDisplay.map((item, index) => (
                <View key={item.id} style={styles.mobileCard}>
                  <ProductCard item={item} index={index} compact />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {featuredToDisplay.map((item, index) => (
                <View key={item.id} style={[styles.hCard, { width: desktopCardWidth }]}>
                  <ProductCard item={item} index={index} compact />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.section, isMobile && { paddingHorizontal: spacing.md }]}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <Pressable onPress={() => navigation.navigate("Shop")} hitSlop={8}>
              <Text style={styles.viewAll}>Browse all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {(categories || []).map((cat) => {
              const isCollection = cat.name.toLowerCase() === "collections";
              const isBrowseAll = cat.name.toLowerCase() === "browse all";
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    let filterCat = cat.name;
                    if (filterCat === "Women's Wear") filterCat = "Women";
                    if (filterCat === "Men's Wear") filterCat = "Men";

                    if (isBrowseAll) {
                      navigation.navigate("Shop");
                    } else if (isCollection) {
                      navigation.navigate("Shop", { mode: "collection", collectionTitle: "Collections" });
                    } else {
                      navigation.navigate("Shop", { selectedCategory: filterCat, collectionTitle: cat.name });
                    }
                  }}
                  style={styles.categoryImageCard}
                >
                  <View style={styles.catImageBox}>
                    <Image 
                      source={{ uri: cat.image_url || "https://images.unsplash.com/photo-1599643478514-4a11011c00c8?auto=format&fit=crop&q=80&w=400&h=400" }} 
                      style={styles.catImage} 
                      contentFit="cover" 
                    />
                  </View>
                  <Text style={styles.catName} numberOfLines={2}>{cat.name}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {curatedCollections.map((section) => (
          <View key={section.key} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Pressable
                onPress={() =>
                  navigation.navigate("Shop", {
                    selectedCategory: section.key === "sarees"
                      ? "Sarees"
                      : section.key === "jewellery"
                        ? "Jewellery"
                        : section.key === "mens-shirts"
                          ? "Men"
                          : "Women",
                    collectionTitle: section.title,
                  })
                }
                hitSlop={8}
              >
                <Text style={styles.viewAll}>View collection</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionIntro}>Curated premium picks selected by popularity and style relevance.</Text>
            {isMobile ? (
              <View style={styles.mobileGrid}>
                {section.items.map((item, index) => (
                  <View key={`${section.key}-${item.id}`} style={styles.mobileCard}>
                    <ProductCard item={item} index={index} compact />
                  </View>
                ))}
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
                {section.items.map((item, index) => (
                  <View key={`${section.key}-${item.id}`} style={[styles.hCard, { width: desktopCardWidth }]}>
                    <ProductCard item={item} index={index} compact />
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        ))}

        <View style={{ padding: 20, backgroundColor: '#f0f0f0', alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#666' }}>API URL: {API_BASE_URL}</Text>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
  },
  viewAll: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  sectionIntro: {
    marginTop: -8,
    marginBottom: spacing.md,
    color: colors.subtleText,
    fontWeight: "600",
    lineHeight: 20,
    maxWidth: 640,
  },
  hRow: {
    gap: 16,
    paddingRight: spacing.md,
  },
  hCard: {
    width: 240,
  },
  mobileGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 10,
  },
  mobileCard: {
    width: "48%",
  },
  categoryScroll: {
    gap: 16,
    paddingRight: spacing.md,
    paddingBottom: spacing.sm,
  },
  categoryImageCard: {
    width: 110,
    alignItems: "center",
  },
  catImageBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.08)",
  },
  catImage: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.surface,
  },
  catName: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 16,
  },
  loading: {
    color: colors.subtleText,
    fontWeight: "700",
  },
});
