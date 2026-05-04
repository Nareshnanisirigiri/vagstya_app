import React, { useState, useEffect, useMemo, useRef } from "react";
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
import AmazonSearchBar from "./AmazonSearchBar";

const NAV_BREAK = 920;

const LINKS = [
  { screen: "Home", label: "Home" },
  { screen: "Shop", label: "Shop" },
  { screen: "Shop", label: "Fashion Accessories", cat: "Fashion Accessories" },
  { screen: "Shop", label: "Festive Vibes", cat: "Festive Vibes" },
  { screen: "Shop", label: "Jewellery", cat: "Jewellery" },
  { screen: "Shop", label: "Men's ware", cat: "Men" },
  { screen: "Shop", label: "Women's ware", cat: ["Women", "Sarees"] },
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
  const [location, setLocation] = useState("Select your location");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [pincode, setPincode] = useState("");

  const searchAnim = useRef(new Animated.Value(0)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const handleApplyPincode = () => {
    if (!pincode || pincode.length < 6) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }
    setLocation(`Deliver to: ${pincode}`);
    setLocationModalOpen(false);
  };

  const handleDetectLocation = () => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      setLocation("Detecting...");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setTimeout(() => {
            setLocation("Hyderabad 500001");
            setLocationModalOpen(false);
          }, 1000);
        },
        (err) => {
          setLocation("Location Access Denied");
          alert("Please enable location permissions in your browser.");
        }
      );
    } else {
      alert("Location detection is not supported on this device/browser.");
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation("Hyderabad 500001"),
        () => setLocation("Set Location")
      );
    }
  }, []);

  useEffect(() => {
    Animated.spring(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      tension: 50,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [searchOpen]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@vogstya_search_history");
        if (saved) setHistory(JSON.parse(saved));
      } catch (e) { }
    })();
  }, []);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    ).slice(0, 8);
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

  const go = (screen, cat, mode) => {
    const params = {};
    if (cat) {
      params.selectedCategory = cat;
      params.collectionTitle = Array.isArray(cat) ? cat[0] : cat;
    }
    if (mode) {
      params.mode = mode;
    }

    navigation.navigate(screen, params);
    setMenuOpen(false);
    setSearchOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      {searchOpen && (
        <Pressable
          style={[styles.backdrop, { height: height * 2 }]}
          onPress={() => { setSearchOpen(false); setQuery(""); }}
        />
      )}

      <View style={styles.topBar}>
        <Text style={styles.topText}>FREE SHIPPING ON ORDERS OVER Rs.100 | USE CODE: VOGSTYA20</Text>
      </View>

      <View style={styles.container}>
        <View style={[styles.unifiedRow, { gap: compact ? 8 : 20 }]}>
          <Pressable onPress={() => go("Home")} style={[styles.logoWrapper, compact && { marginLeft: -5, marginRight: 5 }]}>
            <Image
              source={require("../../assets/logo-.png")}
              style={[styles.logoImage, { width: compact ? 100 : 200, height: compact ? 30 : 60 }]}
              contentFit="contain"
            />
          </Pressable>

          {!compact && (
            <Pressable
              style={styles.locationWrapper}
              onPress={() => setLocationModalOpen(true)}
            >
              <Ionicons name="location-outline" size={18} color={colors.ink} />
              <View style={styles.locationTextContainer}>
                <Text style={styles.locationLabel}>Deliver to</Text>
                <Text style={styles.locationValue} numberOfLines={1}>{location}</Text>
              </View>
            </Pressable>
          )}

          <View style={styles.middleSection}>
            <AmazonSearchBar
              onSearch={(q, cat) => {
                navigation.navigate("Search", { q, selectedCategory: cat });
              }}
            />
          </View>

          <View style={[styles.icons, compact && { gap: 8 }]}>
            <Pressable onPress={() => go("Wishlist")} style={styles.iconWithBadge}>
              <Ionicons name="heart-outline" size={compact ? 20 : 24} color={colors.ink} />
              {wishlistCount ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{wishlistCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => go("Cart")} style={styles.iconWithBadge}>
              <Ionicons name="bag-outline" size={compact ? 20 : 24} color={colors.ink} />
              {cartCount ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount}</Text>
                </View>
              ) : null}
            </Pressable>
            <Pressable onPress={() => go(user ? "Account" : "Login")}>
              <Ionicons name={user ? "person-circle-outline" : "person-outline"} size={compact ? 20 : 24} color={colors.ink} />
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

      {compact && (
        <Pressable
          style={styles.mobileLocationBar}
          onPress={() => setLocationModalOpen(true)}
        >
          <View style={styles.mobileLocationContent}>
            <Ionicons name="location-outline" size={14} color={colors.ink} />
            <Text style={styles.mobileLocationText}>Deliver to {location}</Text>
            <Ionicons name="chevron-down" size={12} color={colors.muted} />
          </View>
        </Pressable>
      )}

      <View style={styles.navBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navContent}
        >
          {LINKS.map(({ screen, label, cat, mode }) => {
            const isBestSale = label === "Best Sale";
            const isActive = active === screen && (
              mode 
                ? route.params?.mode === mode
                : (cat
                  ? (Array.isArray(cat)
                    ? JSON.stringify(route.params?.selectedCategory) === JSON.stringify(cat)
                    : route.params?.selectedCategory === cat)
                  : (!route.params?.selectedCategory && !route.params?.mode))
            );

            const itemContent = (
              <Text style={[
                styles.navText, 
                isActive && styles.navTextActive,
                isBestSale && { color: colors.highlight, fontWeight: "900" }
              ]}>
                {label}
              </Text>
            );

            return (
              <Pressable
                key={label}
                onPress={() => go(screen, cat, mode)}
                style={[
                  styles.navItem, 
                  isActive && styles.navItemActive,
                  isBestSale && { backgroundColor: "rgba(246, 181, 30, 0.1)", borderColor: colors.highlight, borderWidth: 1 }
                ]}
              >
                {isBestSale ? (
                  <Animated.View style={{ opacity: blinkAnim }}>
                    {itemContent}
                  </Animated.View>
                ) : itemContent}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

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
          <Pressable style={styles.drawer} onPress={(e) => { }}>
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Menu</Text>
              <Pressable onPress={() => setMenuOpen(false)}>
                <Ionicons name="close" size={28} color={colors.ink} />
              </Pressable>
            </View>
            {LINKS.map(({ screen, label, cat, mode }) => {
              const isBestSale = label === "Best Sale";
              const isActive = active === screen && (
                mode 
                  ? route.params?.mode === mode
                  : (cat
                    ? (Array.isArray(cat)
                      ? JSON.stringify(route.params?.selectedCategory) === JSON.stringify(cat)
                      : route.params?.selectedCategory === cat)
                    : (!route.params?.selectedCategory && !route.params?.mode))
              );

              const itemContent = (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={[
                    styles.drawerLinkText, 
                    isActive && styles.drawerLinkTextActive,
                    isBestSale && { color: colors.highlight }
                  ]}>
                    {label}
                  </Text>
                  {isBestSale && <Ionicons name="flash" size={16} color={colors.highlight} />}
                </View>
              );

              return (
                <Pressable
                  key={label}
                  onPress={() => go(screen, cat, mode)}
                  style={[
                    styles.drawerLink, 
                    isActive && styles.drawerLinkActive,
                    isBestSale && { borderLeftWidth: 4, borderLeftColor: colors.highlight }
                  ]}
                >
                  {isBestSale ? (
                    <Animated.View style={{ opacity: blinkAnim }}>
                      {itemContent}
                    </Animated.View>
                  ) : itemContent}
                </Pressable>
              );
            })}
            <Pressable
              style={[styles.drawerLink, active === "Orders" && styles.drawerLinkActive]}
              onPress={() => go("Orders")}
            >
              <Text style={[styles.drawerLinkText, active === "Orders" && styles.drawerLinkTextActive]}>
                Orders
              </Text>
              <Ionicons name="chevron-forward" size={18} color={active === "Orders" ? colors.accent : colors.muted} />
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={locationModalOpen} transparent animationType="slide" onRequestClose={() => setLocationModalOpen(false)}>
        <Pressable style={[styles.modalBackdrop, { justifyContent: "center", paddingTop: 0 }]} onPress={() => setLocationModalOpen(false)}>
          <Pressable style={[styles.locationModal, { width: compact ? "90%" : 400, marginTop: 0 }]} onPress={() => { }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose your location</Text>
              <Pressable onPress={() => setLocationModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.modalDesc}>Select a delivery location to see product availability and delivery options.</Text>

              <Pressable
                style={({ pressed }) => [styles.detectBtn, pressed && { opacity: 0.8 }]}
                onPress={handleDetectLocation}
              >
                <Ionicons name="navigate-outline" size={20} color={colors.accent} />
                <Text style={styles.detectBtnText}>Detect live location</Text>
              </Pressable>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TextInput
                style={styles.pincodeInput}
                placeholder="Enter a pincode"
                placeholderTextColor={colors.muted}
                keyboardType="numeric"
                value={pincode}
                onChangeText={setPincode}
                maxLength={6}
              />
              <Pressable style={styles.applyBtn} onPress={handleApplyPincode}>
                <Text style={styles.applyBtnText}>Apply</Text>
              </Pressable>
            </View>
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
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    paddingLeft: 0,
    maxWidth: 1400,
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.surface,
    zIndex: 10,
  },
  unifiedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoWrapper: {
    marginRight: 0,
    marginLeft: -20,
  },
  logoImage: {
    width: 200,
    height: 60,
  },
  middleSection: {
    flex: 1,
    maxWidth: 700,
  },
  mobileSearchRow: {
    marginTop: 4,
    marginBottom: 4,
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
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
  navBar: {
    backgroundColor: colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(13, 87, 49, 0.05)",
    zIndex: 1,
  },
  navContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingRight: spacing.md,
    paddingLeft: 0,
    maxWidth: 1400,
    width: "100%",
    alignSelf: "center",
  },
  navItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  navItemActive: {
    backgroundColor: "rgba(31, 122, 74, 0.12)",
  },
  navText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  navTextActive: {
    color: colors.accent,
    fontWeight: "900",
  },
  mobileSearchRow: {
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  locationWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "transparent",
    minWidth: 120,
    marginLeft: -40,
  },
  locationTextContainer: {
    marginLeft: 2,
  },
  locationLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "600",
  },
  locationValue: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "800",
    marginTop: -2,
  },
  mobileLocationBar: {
    backgroundColor: "rgba(13, 87, 49, 0.04)",
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(13, 87, 49, 0.05)",
  },
  mobileLocationContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mobileLocationText: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: "600",
    flex: 1,
  },
  locationModal: {
    backgroundColor: colors.card,
    borderRadius: 24,
    alignSelf: "center",
    overflow: "hidden",
    maxHeight: "95%",
    ...Platform.select({
      web: {
        boxShadow: "0 20px 30px rgba(0,0,0,0.15)",
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.15,
        shadowRadius: 30,
        elevation: 20,
      }
    }),
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: "#f8faf9",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  modalContent: {
    padding: spacing.xl,
  },
  modalDesc: {
    fontSize: 14,
    color: colors.subtleText,
    marginBottom: 20,
    lineHeight: 20,
  },
  detectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: "#fff",
  },
  detectBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.accent,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#eee",
  },
  dividerText: {
    fontSize: 12,
    color: colors.muted,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  pincodeInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 12,
  },
  applyBtn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  applyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
