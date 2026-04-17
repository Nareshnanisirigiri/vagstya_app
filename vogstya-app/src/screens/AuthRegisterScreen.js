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

export default function AuthRegisterScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  // Ensure role is admin if navigating to AdminRegister screen, even if params are missing
  const role = (route.name === "AdminRegister" || route.params?.role === "admin") ? "admin" : "customer";
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [adminPasscode, setAdminPasscode] = useState("");
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState("");

  const disabled = useMemo(() => {
    if (String(name).trim().length < 2) return true;
    if (!isValidEmail(email)) return true;
    if (String(password).length < 8) return true;
    if (password !== confirm) return true;
    if (role === "admin" && String(adminPasscode).trim().length < 4) return true;
    return false;
  }, [name, email, password, confirm, role, adminPasscode]);

  const onSubmit = async () => {
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const res = await register({ name, email, password, phone, role, adminPasscode });
    if (!res.ok) {
      setError(res.error || "Registration failed.");
      return;
    }
    navigation.navigate(role === "admin" ? "Account" : "Orders");
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>{role === "admin" ? "Register admin" : "Create account"}</Text>
        <Text style={styles.sub}>
          {role === "admin"
            ? "Create a protected admin account with the registration passcode."
            : "Join Vogstya for faster checkout, saved favorites, and order tracking."}
        </Text>

        {error ? (
          <View style={styles.alert}>
            <Ionicons name="alert-circle-outline" size={18} color="#7a1f1f" />
            <Text style={styles.alertText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Full name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

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

        <Text style={styles.label}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="10 digit mobile number"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        {role === "admin" ? (
          <>
            <Text style={styles.label}>Admin passcode</Text>
            <TextInput
              value={adminPasscode}
              onChangeText={setAdminPasscode}
              secureTextEntry={secure}
              placeholder="Registration passcode"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </>
        ) : null}

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            placeholder="Min 8 characters"
            placeholderTextColor={colors.muted}
            style={[styles.input, styles.passwordInput]}
          />
          <Pressable onPress={() => setSecure((s) => !s)} hitSlop={10} style={styles.eyeBtn}>
            <Ionicons name={secure ? "eye-outline" : "eye-off-outline"} size={20} color={colors.ink} />
          </Pressable>
        </View>
        <Text style={styles.hint}>Tip: use a mix of letters, numbers, and symbols.</Text>

        <Text style={styles.label}>Confirm password</Text>
        <TextInput
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry={secure}
          placeholder="Repeat password"
          placeholderTextColor={colors.muted}
          style={styles.input}
        />

        <Pressable
          onPress={() => {
            if (disabled) {
              if (String(name).trim().length < 2) setError("Name is too short.");
              else if (!isValidEmail(email)) setError("Invalid email address.");
              else if (String(password).length < 8) setError("Password must be at least 8 characters.");
              else if (password !== confirm) setError("Passwords do not match.");
              else if (role === "admin" && String(adminPasscode).trim().length < 4) setError("Admin passcode required.");
              return;
            }
            onSubmit();
          }}
          style={({ pressed }) => [styles.primary, (pressed) && styles.pressed, disabled && { opacity: 0.8 }]}
        >
          <Text style={styles.primaryText}>{role === "admin" ? "Create admin account" : "Create account"}</Text>
        </Pressable>

        <View style={styles.bottomRow}>
          <Text style={styles.bottomText}>Already have an account?</Text>
          <Pressable onPress={() => navigation.navigate(role === "admin" ? "AdminLogin" : "Login")} hitSlop={8}>
            <Text style={styles.bottomLink}>{role === "admin" ? "Admin sign in" : "Sign in"}</Text>
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
  hint: {
    color: colors.subtleText,
    fontSize: 12,
    marginTop: 8,
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
