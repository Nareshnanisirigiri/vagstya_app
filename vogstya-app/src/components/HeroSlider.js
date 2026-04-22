import React, { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Video } from "expo-av";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/theme";

const heroSlides = [
  {
    id: "hero-1",
    title: "New  Collection",
    subtitle: "Premium jewelry and polished fashion curated for a bold boutique look.",
    video: require("../../assets/hero-home-1.mp4"),
  },
  {
    id: "hero-2",
    title: "Luxury In Motion",
    subtitle: "Statement pieces, refined accessories, and elevated essentials for every day.",
    video: require("../../assets/hero-home-2.mp4"),
  },
  {
    id: "hero-3",
    title: "Designed To Shine",
    subtitle: "Fresh arrivals crafted to bring elegance, confidence, and edge together.",
    video: require("../../assets/hero-home-4.mp4"),
  },
];

/** expo-av on web clears `position` on the real video element, so it stays intrinsic width; use a full-bleed DOM video. */
function WebHeroVideo({ source }) {
  let uri;
  try {
    uri = Asset.fromModule(source).uri;
  } catch {
    return null;
  }
  if (!uri) {
    return null;
  }
  return React.createElement("video", {
    src: uri,
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      pointerEvents: "none",
      
    },
  });
}

export default function HeroSlider() {
  const [heroIndex, setHeroIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width < 768;
  const screenWidth = Platform.OS === "web" ? "100vw" : width;
  const heroHeight = Math.min(
    Math.round(height * (isMobile ? 0.60 : 0.70)),
    isMobile ? 520 : 720
  );
  const hero = heroSlides[heroIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const goToNext = () => {
    setHeroIndex((currentIndex) => (currentIndex + 1) % heroSlides.length);
  };

  const goToPrevious = () => {
    setHeroIndex((currentIndex) => (currentIndex - 1 + heroSlides.length) % heroSlides.length);
  };

  return (
    <View
      style={[
        styles.hero,
        {
          width: screenWidth,
          height: heroHeight,
          marginLeft: Platform.OS === "web" ? 0 : -insets.left,
          marginRight: Platform.OS === "web" ? 0 : -insets.right,
        },
      ]}
    >
      {Platform.OS === "web" ? (
        <WebHeroVideo key={hero.id} source={hero.video} />
      ) : (
        <Video
          key={hero.id}
          source={hero.video}
          style={styles.media}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted
        />
      )}

      <View style={[styles.heroOverlay, isMobile && { padding: spacing.md, marginTop: -20, marginLeft: -10 }]}>
        <View style={[styles.heroTintPanel, isMobile && styles.heroTintPanelMobile]}>
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>Exclusive Offer</Text>
            <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>{hero.title}</Text>
            <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
              {hero.subtitle}
            </Text>

            <View style={styles.heroActions}>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Shop Now</Text>
              </Pressable>
              <Pressable style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>New Arrivals</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.heroFooter}>
          <View style={styles.heroDots}>
            {heroSlides.map((slide, index) => (
              <Pressable
                key={slide.id}
                onPress={() => setHeroIndex(index)}
                style={[styles.heroDot, heroIndex === index && styles.heroDotActive]}
              />
            ))}
          </View>

          {!isMobile ? (
            <View style={styles.heroArrowRow}>
              <Pressable style={styles.arrowButton} onPress={goToPrevious}>
                <Text style={styles.arrowButtonText}>Prev</Text>
              </Pressable>
              <Pressable style={styles.arrowButton} onPress={goToNext}>
                <Text style={styles.arrowButtonText}>Next</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignSelf: "stretch",
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#163726",
  },
  media: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  
  },
  heroOverlay: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.xl,
    backgroundColor: "rgba(14, 40, 25, 0.34)",
    marginTop:-55,
    marginLeft:-40
  },
  heroTintPanel: {
    width: "58%",
    minHeight: 80,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    marginTop: spacing.lg,
    borderRadius: 24,
  },
  heroTintPanelMobile: {
    width: "100%",
    minHeight: 300,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  heroContent: {
    maxWidth: 360,
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    backgroundColor: colors.highlight,
    color: colors.ink,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    overflow: "hidden",
    fontWeight: "800",
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 56,
    lineHeight: 62,
    fontWeight: "800",
    maxWidth: 320,
  },
  heroTitleMobile: {
    fontSize: 42,
    lineHeight: 48,
  },
  heroSubtitle: {
    color: "#edf4eb",
    fontSize: 18,
    lineHeight: 30,
    marginTop: spacing.md,
    maxWidth: 320,
  },
  heroSubtitleMobile: {
    fontSize: 16,
    lineHeight: 26,
  },
  heroActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
    flexWrap: "wrap",
  },
  primaryButton: {
    backgroundColor: colors.highlight,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 999,
  },
  primaryButtonText: {
    color: colors.ink,
    fontWeight: "800",
    textAlign: "center",
  },
  secondaryButton: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: 999,
  },
  secondaryButtonText: {
    color: colors.ink,
    fontWeight: "700",
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroDots: {
    flexDirection: "row",
    gap: 8,
  },
  heroDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  heroDotActive: {
    width: 28,
    backgroundColor: colors.highlight,
  },
  heroArrowRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  arrowButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  arrowButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
});
