import { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView, Animated, Easing } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || "").trim());
}

export default function AuthForgotPasswordScreen() {
  const navigation = useNavigation();
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const disabled = useMemo(() => !isValidEmail(email), [email]);

  const onSubmit = async () => {
    setError("");
    setSuccess(false);
    const res = await requestPasswordReset(email);
    if (!res.ok) {
      setError(res.error || "Something went wrong.");
      return;
    }
    setSuccess(true);
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
              <Ionicons name="help-buoy" size={24} color={colors.accent} />
            </View>

            <Text style={styles.title}>Reset password</Text>
            <Text style={styles.sub}>
              Enter your email and we’ll send a secure reset link if your account exists in our system.
            </Text>

            {error ? (
              <View style={styles.alert}>
                <Ionicons name="alert-circle-outline" size={18} color="#e11d48" />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            {success ? (
              <View style={styles.success}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.accent} />
                <Text style={styles.successText}>Success! We've sent a secure password reset link to your email. Please check your inbox.</Text>
              </View>
            ) : null}

            {!success && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    placeholder="you@example.com"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>
              </View>
            )}

            {!success ? (
              <Pressable
                onPress={onSubmit}
                disabled={disabled}
                style={({ pressed }) => [
                  styles.primary, 
                  (pressed && !disabled) && styles.pressed, 
                  disabled && styles.disabled
                ]}
              >
                <Text style={styles.primaryText}>Send reset link</Text>
                <Ionicons name="paper-plane-outline" size={18} color="white" style={{ marginLeft: 8 }} />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setSuccess(false)}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>Send another link</Text>
              </Pressable>
            )}

            <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8} style={styles.back}>
              <Text style={styles.backText}>Back to sign in</Text>
            </Pressable>
          </View>
        </View>
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
    gap: 10,
    backgroundColor: `${colors.accent}08`,
    borderRadius: 16,
    padding: 16,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: `${colors.accent}15`,
  },
  successText: {
    color: colors.accent,
    fontWeight: "800",
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
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
