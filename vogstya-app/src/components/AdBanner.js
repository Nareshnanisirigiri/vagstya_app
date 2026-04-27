import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ImageBackground, Pressable, Animated, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useStore } from "../context/StoreContext";
import { colors, spacing } from "../theme/theme";

const ADS = [
  {
    id: 1,
    title: "Royal Collection",
    subtitle: "Exquisite Gold Jewelry for your Special Occasions",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1470&auto=format&fit=crop",
    btnColor: "#D4AF37",
  },
  {
    id: 2,
    title: "Elegant Sarees",
    subtitle: "Traditional Craftsmanship meets Modern Style",
    image: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?q=80&w=1471&auto=format&fit=crop",
    btnColor: "#1F7A4A",
  },
  {
    id: 3,
    title: "Summer Essentials",
    subtitle: "Lightweight Fashion Accessories for the Sun",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1470&auto=format&fit=crop",
    btnColor: "#E67E22",
  }
];

const TWO_MINUTES = 2 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

export default function AdBanner() {
  const navigation = useNavigation();
  const { user } = useStore();
  const [index, setIndex] = useState(0);
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Dynamic interval based on login status
  const interval = user ? FIVE_MINUTES : TWO_MINUTES;

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        // Change ad
        setIndex((prev) => (prev + 1) % ADS.length);
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }).start();
      });
    }, interval);

    return () => clearInterval(timer);
  }, [interval]);

  const currentAd = ADS[index];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.adWrapper, { opacity: fadeAnim }]}>
        <ImageBackground 
          source={{ uri: currentAd.image }} 
          style={styles.image}
          imageStyle={styles.imageInner}
        >
          <View style={styles.overlay}>
            <View style={styles.content}>
              <Text style={styles.tag}>NEW COLLECTION</Text>
              <Text style={styles.title}>{currentAd.title}</Text>
              <Text style={styles.subtitle}>{currentAd.subtitle}</Text>
              
              <Pressable 
                style={[styles.button, { backgroundColor: currentAd.btnColor }]}
                onPress={() => navigation.navigate("Shop")}
              >
                <Text style={styles.buttonText}>SHOP NOW</Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 250,
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
  },
  adWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#2c3e50", // Dark fallback
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    ...Platform.select({
      web: { boxShadow: "0 10px 30px rgba(0,0,0,0.15)" },
      default: { elevation: 8 },
    }),
  },
  image: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
  },
  imageInner: {
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: spacing.xl,
    justifyContent: "center",
  },
  content: {
    maxWidth: 600,
  },
  tag: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
    marginBottom: 8,
    opacity: 0.8,
  },
  title: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 30,
    alignSelf: "flex-start",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
