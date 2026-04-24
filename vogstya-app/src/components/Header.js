import { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
  Platform,
  TextInput,
  ScrollView,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/theme";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";

const NAV_BREAK = 920;

const LINKS = [
  { screen: "Home", label: "Home" },
  { screen: "Shop", label: "Shop" },
  { screen: "Collection", label: "Collection" },
  { screen: "BestDeals", label: "Best Sale" },
];

const POPULAR_CATS = [
  { label: "Men", cat: "Men" },
  { label: "Women", cat: "Women" },
  { label: "Saree", cat: "Sarees" },
  { label: "Fashion Accessories", cat: "Fashion Accessories" },
  { label: "Festive Vibes", cat: "Festive Vibes" },
  { label: "Jewellery", cat: "Jewellery" },
];

export default function Header() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width, height } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = width < NAV_BREAK;
  const active = route.name;
  const { cartCount, wishlistCount } = useStore();
  const { user } = useAuth();
  const { products } = useProducts();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState([]);
  
  const searchAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [searchOpen]);

  // Load history
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@vogstya_search_history");
        if (saved) setHistory(JSON.parse(saved));
      } catch (e) {}
    })();
  }, []);

  // Filter products
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    ).slice(0, 8); // Show top 8
  }, [query, products]);

  const saveHistory = async (q) => {
    const normalized = q.trim();
    if (!normalized) return;
    const next = [normalized, ...history.filter(h => h !== normalized)].slice(0, 10);
    setHistory(next);
    await AsyncStorage.setItem("@vogstya_search_history", JSON.stringify(next));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem("@vogstya_search_history");
  };

  const handleSearchSubmit = () => {
    if (query.trim()) {
      saveHistory(query);
      navigation.navigate("Search", { q: query });
      setSearchOpen(false);
    }
  };

  const go = (screen) => {
    navigation.navigate(screen);
    setMenuOpen(false);
    setSearchOpen(false);
  };

  const searchWidth = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, compact ? width * 0.5 : 300],
  });

  const searchOpacity = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.wrapper}>
      {/* Click-outside backdrop */}
      {searchOpen && (
        <Pressable 
          style={[styles.backdrop, { height: height * 2 }]} 
          onPress={() => { setSearchOpen(false); setQuery(""); }}
        />
      )}

      <View style={styles.topBar}>
        <Text style={styles.topText}>FREE SHIPPING ON ORDERS OVER ₹100 | USE CODE: VOGSTYA20</Text>
      </View>

      <View style={styles.container}>
        <Pressable onPress={() => go("Home")}>
          <Text style={styles.logo}>VOGSTYA</Text>
        </Pressable>

        {/* Middle Section: Navigation or Search */}
        <View style={styles.middleSection}>
          {searchOpen ? (
            <Animated.View style={[styles.inlineSearch, { width: searchWidth, opacity: searchOpacity }]}>
              <Ionicons name="search-outline" size={18} color={colors.muted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search..."
                placeholderTextColor={colors.muted}
                style={styles.searchInput}
                autoFocus
                onSubmitEditing={handleSearchSubmit}
              />
              <Pressable onPress={() => { setSearchOpen(false); setQuery(""); }} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            </Animated.View>
          ) : (
            !compact && (
              <View style={styles.menu}>
                {LINKS.map(({ screen, label }) => (
                  <Pressable 
                    key={screen} 
                    onPress={() => go(screen)} 
                    style={[styles.menuHit, active === screen && styles.menuHitActive]}
                  >
                    <Text style={[styles.menuItem, active === screen && styles.menuActive]}>{label}</Text>
                  </Pressable>
                ))}
              </View>
            )
          )}
        </View>

        <View style={styles.rightCluster}>
          <View style={styles.icons}>
            {!searchOpen && (
              <Pressable onPress={() => setSearchOpen(true)}>
                <Ionicons name="search-outline" size={22} color={colors.ink} />
              </Pressable>
            )}
            <Pressable onPress={() => go("Wishlist")} style={styles.iconWithBadge}>
              <Ionicons name="heart-outline" size={22} color={colors.ink} />
              {wishlistCount ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => go("Cart")} style={styles.iconWithBadge}>
              <Ionicons name="bag-outline" size={22} color={colors.ink} />
              {cartCount ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => go(user ? "Account" : "Login")}>
              <Ionicons name={user ? "person-circle-outline" : "person-outline"} size={22} color={colors.ink} />
            </Pressable>
            {compact && (
              <Pressable
                onPress={() => setMenuOpen(true)}
                style={({ pressed }) => [styles.hamburger, pressed && styles.pressed]}
                hitSlop={8}
              >
                <Ionicons name="menu-outline" size={28} color={colors.ink} />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Dropdown Results */}
      {searchOpen && (
        <View style={styles.resultsDropdown}>
          <ScrollView style={styles.searchScroll} showsVerticalScrollIndicator={false}>
            {query.trim() ? (
              <View style={styles.searchSection}>
                <Text style={styles.searchSectionTitle}>Top Results</Text>
                {searchResults.map(p => (
                  <Pressable 
                    key={p.id} 
                    style={styles.resultItem}
                    onPress={() => {
                      saveHistory(query);
                      navigation.navigate("ProductDetails", { productId: p.id });
                      setSearchOpen(false);
                    }}
                  >
                    <Image source={{ uri: p.image }} style={styles.resultImg} contentFit="cover" />
                    <View>
                      <Text style={styles.resultName}>{p.name}</Text>
                      <Text style={styles.resultCat}>{p.category}</Text>
                    </View>
                  </Pressable>
                ))}
                {searchResults.length === 0 && (
                  <Text style={styles.noResults}>No matches found</Text>
                )}
                {searchResults.length > 0 && (
                  <Pressable onPress={handleSearchSubmit} style={styles.seeAllBtn}>
                    <Text style={styles.seeAllText}>See all results</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                {history.length > 0 && (
                  <View style={styles.searchSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.searchSectionTitle}>Recent Searches</Text>
                      <Pressable onPress={clearHistory}>
                        <Text style={styles.clearText}>Clear All</Text>
                      </Pressable>
                    </View>
                    {history.map((h, i) => (
                      <Pressable key={i} style={styles.historyItem} onPress={() => setQuery(h)}>
                        <Ionicons name="time-outline" size={18} color={colors.muted} />
                        <Text style={styles.historyText}>{h}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                
                <View style={styles.searchSection}>
                  <Text style={styles.searchSectionTitle}>Popular Categories</Text>
                  <View style={styles.popCats}>
                    {POPULAR_CATS.map(item => (
                      <Pressable 
                        key={item.label} 
                        style={styles.popCatChip}
                        onPress={() => {
                          navigation.navigate("Shop", { selectedCategory: item.cat, collectionTitle: item.label });
                          setSearchOpen(false);
                        }}
                      >
                        <Text style={styles.popCatText}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      )}

      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.drawer} onPress={(e) => e.stopPropagation()}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <Pressable onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={28} color={colors.ink} />
              </Pressable>
            </View>
            {LINKS.map(({ screen, label }) => (
              <Pressable
                key={screen}
                onPress={() => go(screen)}
                style={[styles.drawerLink, active === screen && styles.drawerLinkActive]}
              >
                <Text style={[styles.drawerLinkText, active === screen && styles.drawerLinkTextActive]}>
                  {label}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.drawerLink} onPress={() => go("Orders")}>
              <Text style={styles.drawerLinkText}>Orders</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    zIndex: 1000,
    width: "100%",
    ...Platform.select({
      web: {
        position: 'sticky',
        top: 0,
        boxShadow: "0 2px 20px rgba(13, 87, 49, 0.08)",
      },
      default: {
        elevation: 4,
        shadowColor: "#0d5731",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }
    }),
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: -1000,
    width: 5000,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: -1,
  },
  topBar: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  topText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    maxWidth: 1400,
    width: "100%",
    alignSelf: "center",
    minHeight: 64,
    backgroundColor: colors.surface,
  },
  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 1,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  middleSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
  },
  menuHit: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  menuHitActive: {
    backgroundColor: "rgba(31, 122, 74, 0.12)", // Fresh Light Green
  },
  menuItem: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  menuActive: {
    color: colors.accent, // Use mid-green text for active state
    fontWeight: "900",
  },
  hamburger: {
    padding: 4,
    marginLeft: 8,
  },
  pressed: {
    opacity: 0.7,
  },
  icons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: colors.highlight,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.ink,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-start",
    paddingTop: 60,
  },
  drawer: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    ...(Platform.OS === "web" ? { boxShadow: "0 12px 48px rgba(0,0,0,0.2)" } : {}),
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  drawerLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surface,
  },
  drawerLinkActive: {
    backgroundColor: "rgba(31, 122, 74, 0.1)", 
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 10,
    borderBottomWidth: 0,
  },
  drawerLinkText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.ink,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  drawerLinkTextActive: {
    color: colors.accent,
  },
  adminIcon: {
    position: "relative",
  },
  dot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  inlineSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 87, 49, 0.05)',
    borderRadius: 100,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 87, 49, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.ink,
    fontWeight: '600',
  },
  resultsDropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -300 }],
    width: 600,
    maxWidth: '95%',
    backgroundColor: colors.white,
    borderRadius: 20,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(13, 87, 49, 0.08)',
    zIndex: 999,
    ...(Platform.OS === 'web' ? { boxShadow: "0 12px 40px rgba(0,0,0,0.12)" } : { elevation: 8 }),
  },
  searchScroll: {
    maxHeight: 400,
  },
  searchSection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '700',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  historyText: {
    fontSize: 14,
    color: colors.ink,
    fontWeight: '500',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  resultImg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  resultName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  resultCat: {
    fontSize: 12,
    color: colors.muted,
  },
  noResults: {
    textAlign: 'center',
    padding: 20,
    color: colors.muted,
    fontWeight: '600',
  },
  popCats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  popCatChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(31, 122, 74, 0.06)',
  },
  popCatText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  seeAllBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  seeAllText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 13,
  },
});
