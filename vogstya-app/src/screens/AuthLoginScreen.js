import { useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || "").trim());
}

export default function AuthLoginScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const role = route.params?.role === "admin" ? "admin" : "customer";
  const { login, sessionNotice, clearSessionNotice } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");

  const disabled = useMemo(
    () => !isValidEmail(email) || String(password).length < 1,
    [email, password]
  );

  const onSubmit = async () => {
    setError("");
    const res = await login({ email, password, role });
    if (!res.ok) {
      setError(res.error || "Login failed.");
      return;
    }
    navigation.navigate(role === "admin" ? "AdminPanel" : "Shop");
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>{role === "admin" ? "Admin sign in" : "Welcome back"}</Text>
        <Text style={styles.sub}>
          {role === "admin"
            ? "Use your admin credentials to manage the store."
            : "Sign in to continue shopping and track your orders."}
        </Text>

        {sessionNotice ? (
          <Pressable style={styles.notice} onPress={clearSessionNotice}>
            <Ionicons name="notifications-outline" size={18} color={colors.ink} />
            <Text style={styles.noticeText}>{sessionNotice}</Text>
          </Pressable>
        ) : null}

        {error ? (
          <View style={styles.alert}>
            <Ionicons name="alert-circle-outline" size={18} color="#7a1f1f" />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Email</Text>
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

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            placeholder="Your password"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable onPress={() => setSecure((s) => !s)} hitSlop={10} style={styles.eyeBtn}>
            <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.ink} />
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.navigate("ForgotPassword")} hitSlop={8} style={styles.forgot}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <Pressable
          onPress={onSubmit}
          disabled={disabled}
          style={({ pressed }) => [styles.primary, (pressed && !disabled) && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>{role === "admin" ? "Enter admin panel" : "Sign in"}</Text>
        </Pressable>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>{role === "admin" ? "Need admin access?" : "New here?"}</Text>
          <Pressable onPress={() => navigation.navigate(role === "admin" ? "AdminRegister" : "Register")} hitSlop={8}>
            <Text style={styles.bottomLink}>{role === "admin" ? "Register admin" : "Create account"}</Text>
          </Pressable>
        </View>

      </View>
      <Footer bleed={spacing.lg} />
      </ScrollView>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.12)",
    ...(Platform.OS === "web" ? { boxShadow: "0 18px 60px rgba(13, 87, 49, 0.10)" } : {}),
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  sub: {
    marginTop: 6,
    color: colors.subtleText,
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ffe7e7",
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#ffd0d0",
  },
  alertText: {
    color: "#7a1f1f",
    fontWeight: "600",
    flex: 1,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.highlightSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
  },
  noticeText: {
    color: colors.ink,
    fontWeight: "700",
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.subtleText,
    marginBottom: 8,
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.18)",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.ink,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    paddingRight: 44,
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    padding: 6,
  },
  forgot: {
    alignSelf: "flex-end",
    marginTop: 10,
    marginBottom: spacing.lg,
  },
  forgotText: {
    color: colors.accent,
    fontWeight: "800",
  },
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  pressed: {
    opacity: 0.9,
  },
  disabled: {
    opacity: 0.55,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.lg,
  },
  bottomText: {
    color: colors.subtleText,
    fontWeight: "600",
  },
  bottomLink: {
    color: colors.accent,
    fontWeight: "900",
  },
});
