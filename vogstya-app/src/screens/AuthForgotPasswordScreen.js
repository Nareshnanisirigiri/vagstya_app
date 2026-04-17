import { useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.sub}>
          Enter your email and we’ll send a reset link if the account exists.
        </Text>

        {error ? (
          <View style={styles.alert}>
            <Ionicons name="alert-circle-outline" size={18} color="#7a1f1f" />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.success}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#0d5731" />
            <Text style={styles.successText}>Check your inbox for reset instructions.</Text>
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

        <Pressable
          onPress={onSubmit}
          disabled={disabled}
          style={({ pressed }) => [styles.primary, (pressed && !disabled) && styles.pressed, disabled && styles.disabled]}
        >
          <Text style={styles.primaryText}>Send reset link</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Login")} hitSlop={8} style={styles.back}>
          <Text style={styles.backText}>Back to sign in</Text>
        </Pressable>
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
    lineHeight: 20,
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
  success: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#e7ffef",
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#c8f4d7",
  },
  successText: {
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
  primary: {
    backgroundColor: colors.ink,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    marginTop: spacing.lg,
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
  back: {
    alignSelf: "center",
    marginTop: spacing.lg,
  },
  backText: {
    color: colors.accent,
    fontWeight: "900",
  },
});
