import { View, Text, StyleSheet, Pressable, Platform, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";

export default function AccountScreen() {
  const navigation = useNavigation();
  const { user, logout, sessionExpiresAt, sessionNotice, clearSessionNotice } = useAuth();

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <Text style={styles.title}>Account</Text>

          {user ? (
            <>
              {sessionNotice ? (
                <Pressable style={styles.notice} onPress={clearSessionNotice}>
                  <Ionicons name="notifications-outline" size={18} color={colors.ink} />
                  <Text style={styles.noticeText}>{sessionNotice}</Text>
                </Pressable>
              ) : null}
              <View style={styles.row}>
                <Ionicons name="person-circle-outline" size={34} color={colors.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{user.name}</Text>
                  <Text style={styles.email}>{user.email}</Text>
                  <Text style={styles.role}>{String(user.role || "customer").toUpperCase()}</Text>
                  {sessionExpiresAt ? <Text style={styles.sessionMeta}>Session valid until: {new Date(sessionExpiresAt).toLocaleString()}</Text> : null}
                </View>
              </View>

              {user.role !== "admin" ? (
                <Pressable
                  onPress={() => navigation.navigate("Orders")}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryButtonText}>View Orders</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => {
                  logout();
                  navigation.navigate("Home");
                }}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>Sign out</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sub}>Sign in to track orders and manage favorites.</Text>
              <Pressable
                onPress={() => navigation.navigate("Login")}
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
              >
                <Text style={styles.primaryText}>Sign in</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("Register")} hitSlop={8} style={styles.secondary}>
                <Text style={styles.secondaryText}>Create account</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("AdminLogin")} hitSlop={8} style={styles.secondary}>
                <Text style={styles.secondaryText}>Admin sign in</Text>
              </Pressable>
            </>
          )}
        </View>
        <Footer bleed={spacing.lg} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg },
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
    marginBottom: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: spacing.lg },
  name: { fontSize: 18, fontWeight: "900", color: colors.ink },
  email: { marginTop: 2, color: colors.subtleText, fontWeight: "600" },
  sub: { color: colors.subtleText, fontWeight: "600", marginBottom: spacing.lg },
  notice: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: colors.highlightSoft,
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.ink, fontWeight: "700", flex: 1 },
  primary: { backgroundColor: colors.ink, paddingVertical: 14, borderRadius: 14, alignItems: "center" },
  primaryText: { color: colors.white, fontWeight: "900", fontSize: 16 },
  role: { marginTop: 6, color: colors.accent, fontWeight: "900", letterSpacing: 0.6 },
  sessionMeta: { marginTop: 4, color: colors.subtleText, fontWeight: "600", fontSize: 12 },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.18)",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  secondaryButtonText: { color: colors.ink, fontWeight: "800", fontSize: 15 },
  secondary: { alignItems: "center", marginTop: spacing.md },
  secondaryText: { color: colors.accent, fontWeight: "900" },
  pressed: { opacity: 0.9 },
});
