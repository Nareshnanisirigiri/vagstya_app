import React from "react";
import { View, Text, StyleSheet, Pressable, useWindowDimensions, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { colors, spacing } from "../theme/theme";
import { inferCategoryLabel } from "../utils/shopCurations";

export default function CollectionsBanners({ products }) {
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const isMobile = width < 768;

  // Find representative images for collections
  // Find manually selected products or fallback to inference logic
  const bannerImages = {
    main: products.find(p => p.isBannerMain)?.image,
    earrings: products.find(p => p.isBannerEarrings)?.image,
    necklaces: products.find(p => p.isBannerNecklaces)?.image,
  };

  const handlePress = (category, title) => {
    navigation.navigate("Shop", { selectedCategory: category, collectionTitle: title || category });
  };

  return (
    <View style={[styles.container, isMobile && { paddingHorizontal: spacing.md }]}>
      <View style={styles.header}>
        <Text style={[styles.title, isMobile && { fontSize: 28 }]}>Vagstya Collections</Text>
        <Text style={[styles.subtitle, isMobile && { fontSize: 14 }]}>Explore our newly launched collection</Text>
      </View>

      <View style={[styles.grid, isMobile && styles.gridMobile]}>
        {/* Left Large Banner */}
        <Pressable 
          style={[styles.banner, styles.mainBanner, isMobile && styles.fullWidth]}
          onPress={() => handlePress("Jewellery")}
        >
          <Image source={{ uri: bannerImages.main }} style={styles.image} contentFit="cover" />
          <View style={styles.overlay}>
             <Text style={styles.bannerTitle}>Featured Designs</Text>
             <Text style={styles.bannerSubtitle}>Sub 50k</Text>
          </View>
        </Pressable>

        {/* Right Smaller Banners */}
        <View style={[styles.rightCol, isMobile && styles.fullWidth]}>
          <Pressable 
            style={[styles.banner, styles.smallBanner, isMobile && { minHeight: 220 }]}
            onPress={() => handlePress("Sarees", "Premium Sarees")}
          >
            <Image source={{ uri: bannerImages.earrings }} style={styles.image} contentFit="cover" />
            <View style={styles.overlaySmall}>
               <Text style={[styles.bannerTitleSmall, isMobile && { fontSize: 20 }]}>Stunning every saree</Text>
            </View>
          </Pressable>

          <Pressable 
            style={[styles.banner, styles.smallBanner, isMobile && { minHeight: 220 }]}
            onPress={() => handlePress("Men", "Men's Wear")}
          >
            <Image source={{ uri: bannerImages.necklaces }} style={styles.image} contentFit="cover" />
            <View style={styles.overlaySmall}>
               <Text style={[styles.bannerTitleSmall, isMobile && { fontSize: 20 }]}>Men's Wear</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xxl,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.ink,
    fontFamily: "Georgia, 'Times New Roman', serif",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.subtleText,
    fontWeight: "600",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    gap: 16,
    height: 600,
  },
  gridMobile: {
    flexDirection: "column",
    height: "auto",
  },
  rightCol: {
    flex: 1,
    gap: 16,
  },
  banner: {
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.background,
  },
  mainBanner: {
    flex: 1,
    minHeight: 300,
  },
  smallBanner: {
    flex: 1,
    minHeight: 280,
  },
  fullWidth: {
    width: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 40,
    left: 40,
    right: 40,
  },
  overlaySmall: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  bannerTitle: {
    fontSize: 28,
    color: colors.white,
    fontWeight: "800",
    ...Platform.select({
      web: { textShadow: "0 2px 4px rgba(0,0,0,0.3)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
      }
    }),
  },
  bannerSubtitle: {
    fontSize: 48,
    color: colors.white,
    fontWeight: "200",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  bannerTitleSmall: {
    fontSize: 24,
    color: colors.white,
    fontWeight: "700",
    textAlign: "center",
    ...Platform.select({
      web: { textShadow: "0 1px 2px rgba(0,0,0,0.3)" },
      default: {
        textShadowColor: "rgba(0,0,0,0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }
    }),
  },
});
