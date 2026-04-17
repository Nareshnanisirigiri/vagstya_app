import { ScrollView, View, Text, Pressable, StyleSheet, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Header from "../components/Header";
import Footer from "../components/Footer";
import HeroSlider from "../components/HeroSlider";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";
import { HOME_COLLECTIONS, inferCategoryLabel, pickTopProducts } from "../utils/shopCurations";

export default function HomeScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { products, loading } = useProducts();
  const featured = products.slice(0, 100);
  const isMobile = width < 768;
  const desktopCardWidth = 240;
  const topCategories = Object.entries(
    products.reduce((acc, p) => {
      const key = inferCategoryLabel(p);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const curatedCollections = HOME_COLLECTIONS.map((section) => ({
    ...section,
    items: pickTopProducts(products, section.aliases, section.limit),
  })).filter((section) => section.items.length);

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <Header />
      <HeroSlider />

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Featured Edit</Text>
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
            {featured.map((item, index) => (
              <View key={item.id} style={styles.mobileCard}>
                <ProductCard item={item} index={index} compact />
              </View>
            ))}
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
            {featured.map((item, index) => (
              <View key={item.id} style={[styles.hCard, { width: desktopCardWidth }]}>
                <ProductCard item={item} index={index} compact />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <Pressable onPress={() => navigation.navigate("Shop")} hitSlop={8}>
            <Text style={styles.viewAll}>Browse all</Text>
          </Pressable>
        </View>
        <View style={styles.categoriesWrap}>
          {topCategories.map(([name, count]) => (
            <Pressable
              key={name}
              onPress={() => navigation.navigate("Shop", { selectedCategory: name, collectionTitle: name })}
              style={styles.categoryChip}
            >
              <Text style={styles.categoryName}>{name}</Text>
              <Text style={styles.categoryCount}>{count} products</Text>
            </Pressable>
          ))}
        </View>
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

      <Footer />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
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
  categoriesWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryChip: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.12)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minWidth: 140,
  },
  categoryName: {
    color: colors.ink,
    fontWeight: "800",
  },
  categoryCount: {
    marginTop: 2,
    color: colors.subtleText,
    fontSize: 12,
    fontWeight: "600",
  },
  loading: {
    color: colors.subtleText,
    fontWeight: "700",
  },
});
