import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, spacing } from "../theme/theme";

const LINKS = [
  { label: "Shop", screen: "Shop" },
  { label: "Collection", screen: "Collection" },
  { label: "Best Deals", screen: "BestDeals" },
  { label: "Orders", screen: "Orders" },
];

export default function Footer({ bleed = 0, bleedBottom = 0 }) {
  const navigation = useNavigation();

  return (
    <View
      style={[
        styles.root,
        bleed ? { marginHorizontal: -bleed, paddingHorizontal: bleed, alignSelf: "stretch" } : null,
        bleedBottom ? { marginBottom: -bleedBottom } : null,
      ]}
    >
      <View style={styles.inner}>
        <Text style={styles.brand}>VOGSTYA</Text>
        <Text style={styles.sub}>Premium lifestyle shopping with secure checkout and elegant curation.</Text>
        <View style={styles.links}>
          {LINKS.map((link) => (
            <Pressable key={link.label} onPress={() => navigation.navigate(link.screen)} style={styles.linkChip}>
              <Text style={styles.linkText}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.copy}>© {new Date().getFullYear()} Vogstya. All rights reserved.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    marginTop: spacing.xxl,
    backgroundColor: colors.ink,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  inner: {
    maxWidth: 1280,
    width: "100%",
    alignSelf: "center",
  },
  brand: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 1,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  sub: {
    marginTop: 8,
    color: "rgba(255,255,255,0.86)",
    fontSize: 14,
    maxWidth: 560,
    lineHeight: 22,
  },
  links: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  linkChip: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  copy: {
    marginTop: spacing.md,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
  },
});
