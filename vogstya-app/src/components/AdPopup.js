import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Modal, Pressable, Animated, Platform, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../api/client";
import { colors, spacing } from "../theme/theme";

const TEN_MINUTES = 10 * 60 * 1000;

// Module-level flags to persist across HomeScreen re-mounts during the session
let sessionInitialAdShown = false;
let sessionPostLoginAdShown = false;

export default function AdPopup() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [ad, setAd] = useState(null);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  // Load Ad Data
  const fetchAd = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/products/active-ad`);
      const data = await res.json();
      if (data && data.image) {
        setAd(data);
      }
    } catch (e) {
      console.log("Failed to fetch ad:", e);
    }
  };

  // Blinking Animation
  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      blinkAnim.setValue(1);
    }
  }, [visible]);

  // Logic: 
  // 1. Show once on first load (link open)
  // 2. Before login: Every 10 mins
  // 3. After login: Show once then no more
  useEffect(() => {
    if (!user) {
      // Not logged in: Show once immediately if first time, then interval
      if (!sessionInitialAdShown) {
        fetchAd();
        setVisible(true);
        sessionInitialAdShown = true;
      }
      const timer = setInterval(() => {
        fetchAd();
        setVisible(true);
      }, TEN_MINUTES);
      return () => clearInterval(timer);
    } else {
      // Logged in: Show once if post-login ad hasn't been shown yet
      if (!sessionPostLoginAdShown) {
        fetchAd();
        setVisible(true);
        sessionPostLoginAdShown = true;
        // Also mark initial as shown so it doesn't trigger if they logout later
        sessionInitialAdShown = true; 
      }
    }
  }, [user]);

  if (!visible) return null;

  const displayImage = ad?.image || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1000";
  const displayTitle = ad?.title || "Discover timeless artistry inspired by the eternal tales.";

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Close Button */}
          <Pressable style={styles.closeBtn} onPress={() => setVisible(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>

          <View style={styles.contentRow}>
            {/* Left Side: Image & Promo */}
            <View style={styles.leftSide}>
              <Image 
                source={{ uri: displayImage }} 
                style={styles.bgImage}
              />
              <View style={styles.leftOverlay}>
                <Text style={styles.promoTitle}>{displayTitle}</Text>
                
                <Animated.View style={{ opacity: blinkAnim }}>
                  <Pressable 
                    style={styles.shopBtn}
                    onPress={() => {
                      setVisible(false);
                      navigation.navigate("Shop");
                    }}
                  >
                    <Text style={styles.shopBtnText}>SHOP NOW</Text>
                  </Pressable>
                </Animated.View>
                
                <Text style={styles.brandTag}>VOGSTYA</Text>
              </View>
            </View>

            {/* Right Side: QR & App Info */}
            <View style={styles.rightSide}>
              <Text style={styles.appTitle}>Download Our <Text style={{ fontWeight: '800' }}>App</Text> for Exclusive Access</Text>
              
              <View style={styles.qrContainer}>
                <View style={styles.qrBox}>
                   {/* Placeholder for QR Code */}
                   <Ionicons name="qr-code-outline" size={120} color={colors.accent} />
                   <View style={styles.qrCenterLogo}>
                      <Text style={styles.qrLogoText}>V</Text>
                   </View>
                </View>
                <Text style={styles.qrHint}>Scan this QR code using your mobile phone</Text>
              </View>

              <View style={styles.divider} />
              <View style={styles.bottomDecoration}>
                <View style={styles.dot} />
                <View style={styles.line} />
                <Ionicons name="diamond-outline" size={12} color="#D4AF37" />
                <View style={styles.line} />
                <View style={styles.dot} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: "#fff",
    width: "100%",
    maxWidth: 900,
    height: 500,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  contentRow: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  leftSide: {
    flex: 1.2,
    backgroundColor: "#eee",
    position: "relative",
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: "cover",
  },
  leftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 40,
    justifyContent: "center",
  },
  promoTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "600",
    lineHeight: 38,
    marginBottom: 30,
    fontFamily: Platform.OS === 'web' ? 'Georgia' : undefined,
  },
  shopBtn: {
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  shopBtnText: {
    color: "#800000",
    fontWeight: "800",
    fontSize: 14,
    letterSpacing: 1,
  },
  brandTag: {
    position: "absolute",
    bottom: 30,
    left: 40,
    color: "rgba(255,255,255,0.8)",
    fontSize: 20,
    fontWeight: "300",
    letterSpacing: 4,
  },
  rightSide: {
    flex: 1,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 22,
    color: "#333",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 30,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  qrBox: {
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: 15,
    position: "relative",
    marginBottom: 15,
  },
  qrCenterLogo: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -15,
    marginLeft: -15,
    width: 30,
    height: 30,
    backgroundColor: colors.accent,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  qrLogoText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 14,
  },
  qrHint: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    maxWidth: 150,
    lineHeight: 18,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 20,
  },
  bottomDecoration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D4AF37",
  },
  line: {
    width: 40,
    height: 1,
    backgroundColor: "#D4AF37",
    opacity: 0.5,
  },
});
