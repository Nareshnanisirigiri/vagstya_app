import { useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";
import { colors, spacing } from "../theme/theme";

const WIDE = 1024;
const TABLET = 640;

export default function SearchScreen() {
  const { products } = useProducts();
  const { width } = useWindowDimensions();
  const [q, setQ] = useState("");
  const query = String(q || "").trim().toLowerCase();
  const isWide = width >= WIDE;
  const isTablet = width >= TABLET;
  const numCols = isWide ? 4 : isTablet ? 3 : 2;
  const horizontalPad = isWide ? spacing.xl : spacing.md;
  const gap = 16;
  const mainWidth = width - horizontalPad * 2;
  const cardWidth = Math.max(160, (mainWidth - gap * (numCols - 1)) / numCols);

  const results = useMemo(() => {
    if (!query) return [];
    return products.filter((p) => {
      const hay = `${p.name} ${p.category}`.toLowerCase();
      return hay.includes(query);
    });
  }, [query, products]);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={[styles.body, { paddingHorizontal: horizontalPad }]} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.title}>Search Products</Text>
          <Text style={styles.subTitle}>Find pieces instantly with a faster, cleaner product search experience.</Text>
        </View>

        <View style={styles.searchShell}>
          <View style={styles.searchBar}>
            <View style={styles.searchIconWrap}>
              <Ionicons name="search-outline" size={20} color={colors.ink} />
            </View>
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Search by product name or category"
              placeholderTextColor={colors.muted}
              autoFocus={Platform.OS === "web"}
              style={styles.input}
            />
            {q ? (
              <Pressable onPress={() => setQ("")} hitSlop={10} style={styles.clearBtn}>
                <Ionicons name="close" size={16} color={colors.ink} />
              </Pressable>
            ) : (
              <View style={styles.shortcutChip}>
                <Text style={styles.shortcutText}>Search</Text>
              </View>
            )}
          </View>
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
  searchShell: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchBar: {
    minHeight: 66,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.14)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    ...(Platform.OS === "web"
      ? { boxShadow: "0 16px 50px rgba(13, 87, 49, 0.08)" }
      : {
          elevation: 3,
          shadowColor: "#0d5731",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.07,
          shadowRadius: 20,
        }),
  },
  searchIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.highlightSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontWeight: "600",
    fontSize: 16,
    paddingVertical: 10,
  },
  clearBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.1)",
  },
  shortcutChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.1)",
  },
  shortcutText: {
    color: colors.subtleText,
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.3,
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
