import { useMemo, useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, Pressable, Platform, ScrollView, Animated, Easing } from "react-native";
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
    if (role === "admin") {
      navigation.replace("AdminPanel");
    } else {
      navigation.replace("Shop");
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
              <Ionicons name="person-add" size={24} color={colors.accent} />
            </View>

            <Text style={styles.title}>{role === "admin" ? "Register admin" : "Create account"}</Text>
            <Text style={styles.sub}>
              {role === "admin"
                ? "Create a protected admin account with the registration passcode."
                : "Join Vogstya for faster checkout, saved favorites, and order tracking."}
            </Text>

            {error ? (
              <View style={styles.alert}>
                <Ionicons name="alert-circle-outline" size={18} color="#e11d48" />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>
            </View>

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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder="10 digit mobile number"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>
            </View>

            {role === "admin" ? (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Admin Passcode</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                  <TextInput
                    value={adminPasscode}
                    onChangeText={setAdminPasscode}
                    secureTextEntry={secure}
                    placeholder="Registration passcode"
                    placeholderTextColor={colors.muted}
                    style={styles.input}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
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
              <Text style={styles.hint}>Tip: use a mix of letters, numbers, and symbols.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="checkmark-done-outline" size={18} color={colors.muted} style={styles.inputIcon} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry={secure}
                  placeholder="Repeat password"
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </View>
            </View>

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
              style={({ pressed }) => [
                styles.primary, 
                (pressed) && styles.pressed, 
                disabled && styles.disabled
              ]}
            >
              <Text style={styles.primaryText}>{role === "admin" ? "Create admin account" : "Create account"}</Text>
              <Ionicons name="person-add-outline" size={18} color="white" style={{ marginLeft: 8 }} />
            </Pressable>

            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>Already have an account?</Text>
              <Pressable onPress={() => navigation.navigate(role === "admin" ? "AdminLogin" : "Login")} hitSlop={8}>
                <Text style={styles.bottomLink}>{role === "admin" ? "Admin sign in" : "Sign in"}</Text>
              </Pressable>
            </View>
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
  hint: {
    color: colors.subtleText,
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
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
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.xl,
  },
  bottomText: {
    color: colors.subtleText,
    fontWeight: "600",
    fontSize: 14,
  },
  bottomLink: {
    color: colors.accent,
    fontWeight: "900",
    fontSize: 14,
  },
});
