import { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Platform, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";

const WIDE = 1024;
const TABLET = 640;

export default function SearchScreen() {
  const route = useRoute();
  const { products } = useProducts();
  const { width } = useWindowDimensions();
  const [q, setQ] = useState(route.params?.q || "");
  const [selectedCategory, setSelectedCategory] = useState(route.params?.selectedCategory || "");
  
  useEffect(() => {
    if (route.params?.q !== undefined) setQ(route.params.q);
    if (route.params?.selectedCategory !== undefined) setSelectedCategory(route.params.selectedCategory);
  }, [route.params?.q, route.params?.selectedCategory]);

  const query = String(q || "").trim().toLowerCase();
  const isWide = width >= WIDE;
  const isTablet = width >= TABLET;
  const numCols = isWide ? 4 : isTablet ? 3 : 2;
  const horizontalPad = isWide ? spacing.xl : spacing.md;
  const gap = 16;
  const mainWidth = width - horizontalPad * 2;
  const cardWidth = Math.max(160, (mainWidth - gap * (numCols - 1)) / numCols);

  const results = useMemo(() => {
    let list = products;

    if (selectedCategory) {
      list = list.filter((p) => p.category === selectedCategory);
    }

    if (!query) return selectedCategory ? list : [];
    
    return list.filter((p) => {
      const hay = `${p.name} ${p.category}`.toLowerCase();
      return hay.includes(query);
    });
  }, [query, products, selectedCategory]);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={[styles.body, { paddingHorizontal: horizontalPad }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Search Products</Text>
          <Text style={styles.subTitle}>Find pieces instantly with a faster, cleaner product search experience.</Text>
        </View>



        {query ? (
          <Text style={styles.sub}>
            {results.length} results for <Text style={styles.subStrong}>"{q.trim()}"</Text>
          </Text>
        ) : (
          <Text style={styles.sub}>Try "ring", "women", "earrings", or your favorite collection.</Text>
        )}

        {query && results.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={28} color={colors.muted} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyText}>Try a different keyword or browse similar categories.</Text>
          </View>
        ) : null}

        <View style={styles.grid}>
          {results.map((item, index) => (
            <View key={item.id} style={{ width: cardWidth }}>
              <ProductCard item={item} index={index} compact />
            </View>
          ))}
        </View>
        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
  hero: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  subTitle: {
    marginTop: 8,
    color: colors.subtleText,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 620,
  },
  sub: {
    marginTop: 10,
    color: colors.subtleText,
    fontWeight: "700",
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  subStrong: { color: colors.ink, fontWeight: "900" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  emptyState: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.10)",
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyText: {
    color: colors.subtleText,
    textAlign: "center",
    maxWidth: 360,
    lineHeight: 22,
  },
});
