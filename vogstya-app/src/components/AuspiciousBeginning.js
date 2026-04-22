import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import ProductCard from "./ProductCard";
import { colors, spacing } from "../theme/theme";

export default function AuspiciousBeginning({ products }) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const isMobile = width < 768;

  // Filter for products specifically selected for this section
  const displayItems = products.filter(p => p.isAuspicious).slice(0, 12);

  const handleViewAll = () => {
    navigation.navigate("Shop", { collectionTitle: "Auspicious Beginning" });
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, isMobile && { paddingHorizontal: spacing.md }]}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, isMobile && { fontSize: 24 }]}>For an Auspicious Beginning</Text>
          <Text style={[styles.subtitle, isMobile && { fontSize: 14 }]}>
            Discover our most-loved designs
          </Text>
        </View>
        {!isMobile && (
          <View style={styles.controls}>
            <Pressable style={styles.navButton} onPress={() => { }}>
              <Text style={styles.navText}>{"<"}</Text>
            </Pressable>
            <Pressable style={styles.navButton} onPress={() => { }}>
              <Text style={styles.navText}>{">"}</Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isMobile && { paddingHorizontal: spacing.md }]}
      >
        {displayItems.map((item, index) => (
          <View key={item.id} style={[styles.cardWrapper, { width: isMobile ? width * 0.65 : 280 }]}>
            <ProductCard item={item} index={index} compact />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxl,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xl,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: "Georgia, 'Times New Roman', serif",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtleText,
    fontWeight: "600",
  },
  controls: {
    flexDirection: "row",
    gap: 12,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  navText: {
    fontSize: 20,
    color: colors.ink,
    fontWeight: "400",
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  cardWrapper: {
    // Width set dynamically
  },
});
