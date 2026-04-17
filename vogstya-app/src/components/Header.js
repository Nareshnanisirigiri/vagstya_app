import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/theme";
import { useStore } from "../context/StoreContext";
import { useAuth } from "../context/AuthContext";

const NAV_BREAK = 920;

const LINKS = [
  { screen: "Home", label: "Home" },
  { screen: "Shop", label: "Shop" },
  { screen: "Collection", label: "Collection" },
  { screen: "BestDeals", label: "Best Sale" },
];

export default function Header() {
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = width < NAV_BREAK;
  const active = route.name;
  const { cartCount, wishlistCount } = useStore();
  const { user } = useAuth();

  const go = (screen) => {
    navigation.navigate(screen);
    setMenuOpen(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.topBar}>
        <Text style={styles.topText}>FREE SHIPPING ON ORDERS OVER ₹100 | USE CODE: VOGSTYA20</Text>
      </View>

      <View style={styles.container}>
        <Pressable onPress={() => go("Home")}>
          <Text style={styles.logo}>VOGSTYA</Text>
        </Pressable>

        {!compact ? (
          <View style={styles.menu}>
            {LINKS.map(({ screen, label }) => (
              <Pressable key={screen} onPress={() => go(screen)} style={styles.menuHit}>
                <Text style={[styles.menuItem, active === screen && styles.menuActive]}>{label}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.menuHit} onPress={() => go("Orders")}>
              <Text style={styles.menuItem}>Pages</Text>
              <Ionicons name="chevron-down" size={14} color={colors.ink} style={{ marginLeft: 2 }} />
            </Pressable>
          </View>
        ) : (
          <View style={styles.menuSpacer} />
        )}

        <View style={styles.rightCluster}>
          {compact ? (
            <Pressable
              onPress={() => setMenuOpen(true)}
              style={({ pressed }) => [styles.hamburger, pressed && styles.pressed]}
              hitSlop={8}
            >
              <Ionicons name="menu-outline" size={28} color={colors.ink} />
            </Pressable>
          ) : null}
          <View style={styles.icons}>
          <Pressable onPress={() => go("Search")}>
            <Ionicons name="search-outline" size={22} color={colors.ink} />
          </Pressable>
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
          </View>
        </View>
      </View>

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
    zIndex: 10,
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 2px 20px rgba(13, 87, 49, 0.08)",
        }
      : {
          elevation: 4,
          shadowColor: "#0d5731",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        }),
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
  },
  logo: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 1,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  menuSpacer: {
    flex: 1,
  },
  menu: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  rightCluster: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  menuHit: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  menuItem: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  menuActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingBottom: 4,
  },
  hamburger: {
    padding: 4,
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
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0 12px 48px rgba(0,0,0,0.2)",
        }
      : {}),
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
    backgroundColor: colors.highlightSoft,
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
});
