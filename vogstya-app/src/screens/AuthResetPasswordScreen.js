import { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView, Animated, Easing } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";

function extractToken(routeParams) {
  const directToken = String(routeParams?.token || "").trim();
  if (directToken) {
    return directToken;
  }

  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search || "");
    return String(params.get("token") || "").trim();
  }

  return "";
}

export default function AuthResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const resetToken = useMemo(() => extractToken(route.params || {}), [route.params]);
  
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { confirmPasswordReset } = useAuth();

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(30), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const disabled = useMemo(() => {
    return !resetToken || password.length < 8 || password !== confirm;
  }, [password, confirm, resetToken]);

  const onSubmit = async () => {
    setError("");
    if (!resetToken) {
      setError("Reset link is invalid or incomplete. Please request a new password reset email.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    
    setLoading(true);
    const result = await confirmPasswordReset(resetToken, password);
    setLoading(false);

    if (result.ok) {
      setSuccess(true);
      setTimeout(() => {
        navigation.navigate("Login");
      }, 3000);
    } else {
      setError(result.error);
    }
  };

  return (
    <View style={styles.root}>
      <Animated.ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.bagContainer}>
          {/* Bag Handle */}
          <View style={styles.bagHandleOuter}>
            <View style={styles.bagHandleInner} />
          </View>
          
          <View style={styles.card}>
            <View style={styles.headerIcon}>
              <Ionicons name="shield-checkmark" size={24} color={colors.accent} />
            </View>

            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.sub}>
              Create a strong password to secure your Vogstya account.
            </Text>

            {error ? (
              <View style={styles.alert}>
                <Ionicons name="alert-circle-outline" size={18} color="#e11d48" />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            {!resetToken ? (
              <View style={styles.alert}>
                <Ionicons name="link-outline" size={18} color="#e11d48" />
                <Text style={styles.alertText}>This reset link is missing the token. Please open the latest reset email and try again.</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.success}>
                <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Password Reset!</Text>
                  <Text style={styles.successText}>Redirecting you to login...</Text>
                </View>
              </View>
            ) : (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="key-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={secure}
                      placeholder="Min 8 characters"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, { flex: 1 }]}
                    />
                    <Pressable onPress={() => setSecure((s) => !s)} hitSlop={10} style={styles.eyeBtn}>
                      <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.ink} />
                    </Pressable>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="checkmark-done-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                    <TextInput
                      value={confirm}
                      onChangeText={setConfirm}
                      secureTextEntry={secure}
                      placeholder="Repeat new password"
                      placeholderTextColor={colors.muted}
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                </View>

                <Pressable
                  onPress={onSubmit}
                  disabled={disabled || loading}
                  style={({ pressed }) => [
                    styles.primary, 
                    (pressed && !disabled && !loading) && styles.pressed, 
                    (disabled || loading) && styles.disabled
                  ]}
                >
                  <Text style={styles.primaryText}>{loading ? "Updating..." : "Update Password"}</Text>
                  {!loading && <Ionicons name="save-outline" size={18} color="white" style={{ marginLeft: 8 }} />}
                </Pressable>
              </>
            )}

            <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8} style={styles.back}>
              <Text style={styles.backText}>Return to sign in</Text>
            </Pressable>
          </View>
        </View>
        <Footer bleed={spacing.lg} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    justifyContent: "center",
    flexGrow: 1,
  },
  bagContainer: {
    width: "100%",
    maxWidth: 450,
    alignSelf: 'center',
    marginTop: 20,
  },
  bagHandleOuter: {
    width: 120,
    height: 60,
    borderWidth: 8,
    borderColor: 'rgba(13, 87, 49, 0.15)',
    borderBottomWidth: 0,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    alignSelf: 'center',
    marginBottom: -10,
    zIndex: -1,
  },
  bagHandleInner: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 30,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.08)",
    ...(Platform.OS === "web" ? { 
      boxShadow: "0 25px 80px rgba(13, 87, 49, 0.12), 0 2px 4px rgba(0,0,0,0.02)" 
    } : {
      elevation: 5,
    }),
  },
  headerIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: `${colors.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    textAlign: 'center',
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  sub: {
    marginTop: 8,
    color: colors.subtleText,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff1f2",
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  alertText: {
    color: "#e11d48",
    fontWeight: "700",
    flex: 1,
    fontSize: 13,
  },
  success: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    backgroundColor: `${colors.accent}08`,
    borderRadius: 20,
    padding: 20,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.accent}15`,
  },
  successTitle: {
    color: colors.accent,
    fontWeight: "900",
    fontSize: 18,
    marginBottom: 4,
  },
  successText: {
    color: colors.ink,
    fontWeight: "600",
    fontSize: 14,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.subtleText,
    marginBottom: 10,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: "rgba(13, 87, 49, 0.12)",
    backgroundColor: "#f8fafc",
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: colors.ink,
    fontWeight: "600",
  },
  eyeBtn: {
    padding: 10,
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 25px rgba(13, 87, 49, 0.2)" } : {}),
  },
  primaryText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 17,
    letterSpacing: 0.6,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  back: {
    alignSelf: "center",
    marginTop: spacing.xl,
  },
  backText: {
    color: colors.accent,
    fontWeight: "900",
    fontSize: 14,
  },
});
