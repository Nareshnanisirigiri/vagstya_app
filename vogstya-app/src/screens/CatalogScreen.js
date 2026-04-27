import { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  useWindowDimensions,
  Platform,
  StyleSheet,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ShopFilterPanel from "../components/ShopFilterPanel";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductsContext";
import { filterProducts, sortProducts } from "../utils/catalogUtils";
import { colors, spacing } from "../theme/theme";
import { inferCategoryLabel } from "../utils/shopCurations";

const WIDE = 1024;
const TABLET = 640;

const HERO = {
  shop: {
    title: "Shop Collection",
    subtitle: "Discover our premium selection of products.",
  },
  collection: {
    title: "Collection",
    subtitle: "Curated pieces selected for timeless style.",
  },
  bestDeals: {
    title: "Flash Sale",
    subtitle: "Highly curated deals on our most popular pieces.",
  },
};

const SORT_OPTIONS = [
  { id: "featured", label: "Featured" },
  { id: "priceAsc", label: "Price: Low to High" },
  { id: "priceDesc", label: "Price: High to Low" },
  { id: "rating", label: "Top Rated" },
  { id: "name", label: "Name A–Z" },
];

export default function CatalogScreen() {
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { products, loading, error } = useProducts();
  const mode = route.params?.mode ?? "shop";
  const initialCategory = route.params?.selectedCategory || "";
  const customCollectionTitle = route.params?.collectionTitle || "";
  const hero = HERO[mode] ?? HERO.shop;

  const isWide = width >= WIDE;

  const baseProducts = useMemo(() => {
    if (mode === "bestDeals") return products.filter((p) => p.isFlashSale);
    return products;
  }, [mode, products]);

  const [selectedCategories, setSelectedCategories] = useState(initialCategory ? [initialCategory] : []);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(2000);
  const [priceRangeInitialized, setPriceRangeInitialized] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [denseGrid, setDenseGrid] = useState(true);
  const [sortModal, setSortModal] = useState(false);
  const [filterModal, setFilterModal] = useState(false);

  const counts = useMemo(() => {
    const map = {
      Women: 0,
    };
    for (const p of baseProducts) {
      const category = inferCategoryLabel(p);
      map[category] = (map[category] || 0) + 1;
    }
    return map;
  }, [baseProducts]);
  const categories = useMemo(() => Object.keys(counts).sort((a, b) => a.localeCompare(b)), [counts]);
  const maxPrice = useMemo(() => {
    const highest = baseProducts.reduce((m, p) => Math.max(m, Number(p.price || 0)), 0);
    return Math.max(500, Math.ceil(highest / 100) * 100);
  }, [baseProducts]);

  const filtered = useMemo(() => {
    const list = filterProducts(baseProducts, {
      categories: selectedCategories,
      priceMin,
      priceMax,
      saleOnly: false,
    });
    return sortProducts(list, sortBy);
  }, [baseProducts, selectedCategories, priceMin, priceMax, sortBy]);

  const toggleCategory = useCallback((cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
    setPriceMin(0);
    setPriceMax(maxPrice);
  }, [maxPrice]);

  useEffect(() => {
    setSelectedCategories(initialCategory ? [initialCategory] : []);
  }, [initialCategory]);

  useEffect(() => {
    if (!priceRangeInitialized && maxPrice > 0) {
      setPriceMin(0);
      setPriceMax(maxPrice);
      setPriceRangeInitialized(true);
      return;
    }
    if (priceMax > maxPrice) {
      setPriceMax(maxPrice);
    }
  }, [maxPrice, priceMax, priceRangeInitialized]);

  const isTablet = width >= TABLET;
  const numCols = denseGrid
    ? isWide
      ? 4
      : isTablet
        ? 3
        : 2
    : isWide
      ? 3
      : 2;

  const horizontalPad = isWide ? spacing.xl : spacing.md;
  const sidebarW = 280;
  const gap = 16;
  const mainInnerWidth = isWide ? width - sidebarW - horizontalPad * 3 : width - horizontalPad * 2;
  const cardWidth = (mainInnerWidth - gap * (numCols - 1)) / numCols;

  const sortLabel = SORT_OPTIONS.find((s) => s.id === sortBy)?.label ?? "Featured";

  const filterPanelProps = {
    counts,
    selectedCategories,
    categories,
    onToggleCategory: toggleCategory,
    priceMin,
    priceMax,
    maxPrice,
    onPriceMin: setPriceMin,
    onPriceMax: setPriceMax,
    onClear: clearFilters,
  };

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{hero.title}</Text>
          <Text style={styles.heroSub}>{customCollectionTitle || hero.subtitle}</Text>
        </View>

        {!isWide && (
          <View style={styles.mobileCatBar}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileCatScroll}
            >
              {categories.map((cat) => {
                const active = selectedCategories.includes(cat);
                return (
                  <Pressable
                    key={cat}
                    onPress={() => toggleCategory(cat)}
                    style={[styles.mobileCatChip, active && styles.mobileCatChipActive]}
                  >
                    <Text style={[styles.mobileCatText, active && styles.mobileCatTextActive]}>
                      {cat} ({counts[cat] || 0})
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={[styles.mainRow, { paddingHorizontal: horizontalPad }]}>
          {isWide ? (
            <View
              style={[
                styles.sidebar,
                {
                  width: sidebarW,
                  ...(Platform.OS === "web"
                    ? {
                        position: "sticky",
                        top: 12,
                        alignSelf: "flex-start",
                        maxHeight: "calc(100vh - 48px)",
                        overflowY: "auto",
                      }
                    : {}),
                },
              ]}
            >
              <View style={styles.sidebarCard}>
                <ShopFilterPanel {...filterPanelProps} />
              </View>
            </View>
          ) : null}

          <View style={[styles.mainCol, !isWide && { width: "100%" }]}>
            <View style={styles.toolbar}>
              <Text style={styles.showing}>
                Showing <Text style={styles.showingBold}>{filtered.length}</Text> products
              </Text>
              <View style={styles.toolbarRight}>
                {!isWide ? (
                  <Pressable
                    onPress={() => setFilterModal(true)}
                    style={({ pressed }) => [styles.filterFab, pressed && styles.pressed]}
                  >
                    <Ionicons name="funnel-outline" size={18} color={colors.ink} />
                    <Text style={styles.filterFabText}>Filters</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => setSortModal(true)} style={styles.sortBtn}>
                  <Text style={styles.sortBtnText}>Sort: {sortLabel}</Text>
                  <Ionicons name="chevron-down" size={16} color={colors.ink} />
                </Pressable>
                <View style={styles.gridToggle}>
                  <Pressable
                    onPress={() => setDenseGrid(true)}
                    style={[styles.gridIcon, denseGrid && styles.gridIconOn]}
                  >
                    <Ionicons name="grid-outline" size={18} color={denseGrid ? colors.white : colors.ink} />
                  </Pressable>
                  <Pressable
                    onPress={() => setDenseGrid(false)}
                    style={[styles.gridIcon, !denseGrid && styles.gridIconOn]}
                  >
                    <Ionicons name="apps-outline" size={18} color={!denseGrid ? colors.white : colors.ink} />
                  </Pressable>
                </View>
              </View>
            </View>

            {loading ? (
              <Text style={styles.empty}>Loading products from backend...</Text>
            ) : error ? (
              <Text style={styles.empty}>{error}</Text>
            ) : (
              <View style={styles.grid}>
                {filtered.map((item, index) => (
                  <View key={item.id} style={{ width: cardWidth }}>
                    <ProductCard item={item} index={index} compact={denseGrid} />
                  </View>
                ))}
              </View>
            )}

            {!loading && !error && filtered.length === 0 ? (
              <Text style={styles.empty}>No products match your filters. Try adjusting categories or price.</Text>
            ) : null}
          </View>
        </View>
        <Footer />
      </ScrollView>

      <Modal visible={sortModal} transparent animationType="fade" onRequestClose={() => setSortModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setSortModal(false)}>
          <Pressable style={[styles.sortSheet, { paddingBottom: insets.bottom + 16 }]} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Sort by</Text>
            {SORT_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                onPress={() => {
                  setSortBy(opt.id);
                  setSortModal(false);
                }}
                style={[styles.sortRow, sortBy === opt.id && styles.sortRowOn]}
              >
                <Text style={[styles.sortRowText, sortBy === opt.id && styles.sortRowTextOn]}>{opt.label}</Text>
                {sortBy === opt.id ? <Ionicons name="checkmark" size={20} color={colors.ink} /> : null}
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={filterModal} animationType="slide" transparent onRequestClose={() => setFilterModal(false)}>
        <View style={[styles.filterModalRoot, { paddingTop: insets.top, paddingBottom: 0 }]}>
          <View style={styles.filterModalHeader}>
            <Text style={styles.filterModalTitle}>Filters</Text>
            <Pressable onPress={() => setFilterModal(false)} hitSlop={12}>
              <Ionicons name="close" size={28} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView style={styles.filterModalScroll} showsVerticalScrollIndicator={false}>
            <ShopFilterPanel {...filterPanelProps} scrollable={false} />
          </ScrollView>
          <View style={[styles.applyBar, { paddingBottom: insets.bottom + 12 }]}>
            <Pressable style={styles.applyBtn} onPress={() => setFilterModal(false)}>
              <Text style={styles.applyBtnText}>Apply</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    backgroundColor: colors.ink,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
    textAlign: "center",
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
    marginBottom: spacing.sm,
  },
  heroSub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    maxWidth: 480,
    lineHeight: 24,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: spacing.xl,
    gap: spacing.xl,
  },
  sidebar: {
    zIndex: 2,
  },
  sidebarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.1)",
    padding: spacing.lg,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 12px 40px rgba(13, 87, 49, 0.07)",
        }
      : {
          elevation: 3,
          shadowColor: "#0d5731",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.06,
          shadowRadius: 20,
        }),
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  showing: {
    fontSize: 15,
    color: colors.subtleText,
  },
  showingBold: {
    fontWeight: "800",
    color: colors.ink,
  },
  toolbarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },
  filterFab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.highlight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  filterFabText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 14,
  },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.15)",
  },
  sortBtnText: {
    fontWeight: "600",
    color: colors.ink,
    fontSize: 14,
  },
  gridToggle: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.15)",
  },
  gridIcon: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.card,
  },
  gridIconOn: {
    backgroundColor: colors.ink,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  pressed: {
    opacity: 0.85,
  },
  empty: {
    textAlign: "center",
    color: colors.subtleText,
    marginTop: spacing.xl,
    fontSize: 15,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sortSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: spacing.md,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface,
  },
  sortRowOn: {
    backgroundColor: colors.highlightSoft,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
  },
  sortRowText: {
    fontSize: 16,
    color: colors.ink,
  },
  sortRowTextOn: {
    fontWeight: "700",
  },
  filterModalRoot: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: 56,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
  },
  filterModalScroll: {
    flex: 1,
  },
  filterModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    marginBottom: spacing.md,
  },
  filterModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  applyBar: {
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: spacing.md,
    marginTop: "auto",
  },
  applyBtn: {
    backgroundColor: colors.highlight,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  applyBtnText: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
  },
  mobileCatBar: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(13, 87, 49, 0.05)",
  },
  mobileCatScroll: {
    paddingHorizontal: spacing.md,
    gap: 10,
  },
  mobileCatChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.1)",
  },
  mobileCatChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  mobileCatText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },
  mobileCatTextActive: {
    color: colors.white,
  },
});
