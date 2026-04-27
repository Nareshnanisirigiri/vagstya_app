import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "../theme/theme";

const PRICE_MIN = 0;
const PRICE_MAX = 2000;

export default function ShopFilterPanel({
  categories = [],
  counts,
  selectedCategories,
  onToggleCategory,
  priceMin,
  priceMax,
  maxPrice = PRICE_MAX,
  onPriceMin,
  onPriceMax,
  onClear,
  showClear = true,
  scrollable = true,
}) {
  const Body = scrollable ? ScrollView : View;
  return (
    <Body
      style={scrollable ? styles.scroll : styles.embedded}
      contentContainerStyle={scrollable ? styles.scrollContent : undefined}
      {...(scrollable ? { showsVerticalScrollIndicator: false } : {})}
    >
      <View style={styles.headerRow}>
        <Ionicons name="funnel-outline" size={20} color={colors.ink} />
        <Text style={styles.headerTitle}>Filters</Text>
      </View>

      <Text style={styles.sectionLabel}>CATEGORIES</Text>
      {categories.map((cat) => {
        const count = counts[cat] ?? 0;
        const checked = selectedCategories.includes(cat);
        return (
          <Pressable
            key={cat}
            onPress={() => onToggleCategory(cat)}
            style={({ pressed }) => [styles.catRow, pressed && styles.pressed]}
          >
            <View style={[styles.checkbox, checked && styles.checkboxOn]}>
              {checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
            </View>
            <Text style={styles.catLabel}>{cat}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{count}</Text>
            </View>
          </Pressable>
        );
      })}

      <Text style={[styles.sectionLabel, styles.sectionSpaced]}>PRICE RANGE</Text>
      <View style={styles.priceRow}>
        <Text style={styles.priceValue}>₹{Math.round(priceMin)}</Text>
        <Text style={styles.priceDash}>—</Text>
        <Text style={styles.priceValue}>₹{Math.round(priceMax)}</Text>
      </View>
      <Text style={styles.sliderLabel}>Min</Text>
      <Slider
        style={styles.slider}
        minimumValue={PRICE_MIN}
        maximumValue={maxPrice}
        step={5}
        value={priceMin}
        onValueChange={(v) => {
          onPriceMin(v);
          if (v > priceMax) onPriceMax(v);
        }}
        minimumTrackTintColor={colors.ink}
        maximumTrackTintColor={colors.muted}
        thumbTintColor={colors.white}
      />
      <Text style={styles.sliderLabel}>Max</Text>
      <Slider
        style={styles.slider}
        minimumValue={PRICE_MIN}
        maximumValue={maxPrice}
        step={5}
        value={priceMax}
        onValueChange={(v) => {
          onPriceMax(v);
          if (v < priceMin) onPriceMin(v);
        }}
        minimumTrackTintColor={colors.ink}
        maximumTrackTintColor={colors.muted}
        thumbTintColor={colors.white}
      />

      {showClear ? (
        <Pressable onPress={onClear} style={({ pressed }) => [styles.clearBtn, pressed && styles.pressed]}>
          <Text style={styles.clearText}>Clear all filters</Text>
        </Pressable>
      ) : null}
    </Body>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: "100%",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  embedded: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: colors.subtleText,
    marginBottom: spacing.md,
  },
  sectionSpaced: {
    marginTop: spacing.lg,
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  pressed: {
    opacity: 0.75,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.muted,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  checkboxOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  catLabel: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    fontWeight: "500",
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtleText,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.ink,
  },
  priceDash: {
    color: colors.muted,
    fontSize: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.subtleText,
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 40,
    marginBottom: spacing.sm,
  },
  clearBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.muted,
  },
  clearText: {
    fontWeight: "700",
    color: colors.ink,
    fontSize: 14,
  },
});

export const PRICE_RANGE = { min: PRICE_MIN, max: PRICE_MAX };
