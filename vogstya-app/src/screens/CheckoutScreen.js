import { useEffect, useMemo, useState, useRef } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Pressable, 
  Platform, 
  useWindowDimensions,
  Animated
} from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import ConfettiCannon from "react-native-confetti-cannon";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useStore } from "../context/StoreContext";
import { useOrders } from "../context/OrdersContext";
import { useSnackbar } from "../context/SnackbarContext";
import { useProducts } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { colors, spacing } from "../theme/theme";

const DELIVERY_FEE = 8;

export default function CheckoutScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 980;
  const { cartItems, clearCart } = useStore();
  const { placeOrder, refreshOrders } = useOrders();
  const { showMessage } = useSnackbar();
  const { products } = useProducts();
  const { token } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState("razorpay");
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    pincode: "",
    city: "",
    state: "",
    street: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const payload = await apiRequest("/orders/payment-gateways");
        const rows = payload?.gateways || [];
        if (mounted) {
          setGateways(rows);
          if (rows[0]?.id) setSelectedGateway(rows[0].id);
        }
      } catch {
        if (mounted) setGateways([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    return cartItems
      .map((ci) => {
        const p = products.find((x) => x.id === ci.id);
        if (!p) return null;
        return { ...p, qty: ci.qty };
      })
      .filter(Boolean);
  }, [cartItems, products]);

  const subtotal = useMemo(() => rows.reduce((sum, r) => sum + r.price * r.qty, 0), [rows]);
  const grandTotal = subtotal + (rows.length ? DELIVERY_FEE : 0);

  function updateField(key, value) {
    setAddress((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }


  function validateAddress() {
    const errors = {};
    if (address.fullName.trim().length < 2) errors.fullName = "Enter full name.";
    if (!/^\d{10}$/.test(address.phone.trim())) errors.phone = "Enter a valid 10-digit phone number.";
    if (!/^\d{6}$/.test(address.pincode.trim())) errors.pincode = "Enter a valid 6-digit pincode.";
    if (address.city.trim().length < 2) errors.city = "Enter city.";
    if (address.state.trim().length < 2) errors.state = "Enter state.";
    if (address.street.trim().length < 5) errors.street = "Enter full street address.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onPlaceOrder() {
    if (submitting) return;
    if (rows.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!token) {
      setError("Please sign in to place and track your order.");
      navigation.navigate("Login", {
        returnTo: "Checkout",
        returnMode: "goBack",
      });
      return;
    }
    const isValid = validateAddress();
    if (!isValid) {
      setError("Please fix the errors in the form.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const startPayload = await apiRequest("/orders/checkout/start", {
        method: "POST",
        token,
        body: {
          items: rows.map((r) => ({ productId: r.id, quantity: r.qty, size: r.size || null })),
          paymentMethod: paymentMethod === "COD" ? "cod" : "upi_qr",
          paymentGateway: selectedGateway,
          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            line1: address.street,
            line2: "",
            city: address.city,
            state: address.state,
            postalCode: address.pincode,
            country: "India",
          },
          note: "Order from vogstya app",
        },
      });

      const backendOrder = startPayload?.order;
      const paymentMeta = startPayload?.payment || {};
      if (!backendOrder?.id) throw new Error("Checkout start failed.");

      if (paymentMethod === "COD") {
        const completePayload = await apiRequest("/orders/checkout/complete", {
          method: "POST",
          token,
          body: {
            orderId: backendOrder.id,
            status: "cod_confirmed",
            gatewayTransactionId: `cod_${Date.now()}`,
            gatewayOrderId: paymentMeta.gatewayOrderId || "",
            gatewaySignature: "",
          },
        });

        const finalOrder = completePayload?.order || {};
        placeOrder({
          items: rows.map((r) => ({ productId: r.id, qty: r.qty })),
          address: { ...address },
          totals: { subtotal, deliveryFee: DELIVERY_FEE, grandTotal },
          paymentMethod: "COD",
          paymentStatus: String(finalOrder.paymentStatus || "").toLowerCase() === "paid" ? "paid" : "pending",
        });
        await refreshOrders();
        clearCart();
        showMessage("Order placed successfully");
        navigation.replace("OrderSuccess", { 
           orderId: backendOrder.id,
           displayOrderId: `ORD-${backendOrder.id}`
        });
        return;
      }

      navigation.navigate("UpiQr", {
        orderId: backendOrder.id,
        displayOrderId: `ORD-${backendOrder.id}`,
        amount: paymentMeta.amount || grandTotal,
        gatewayOrderId: paymentMeta.gatewayOrderId || "",
        gatewayLabel: paymentMeta.gateway?.label || "Razorpay",
        gatewayId: paymentMeta.gateway?.id || selectedGateway,
        upiHandle: paymentMeta.gateway?.upiHandle || "merchant@razorpay",
      });
    } catch (e) {
      setError(e.message || "Could not place order.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View style={styles.root}>
      <Header />
      <Animated.ScrollView 
        contentContainerStyle={styles.body} 
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <View style={styles.headerTitleGroup}>
          <Text style={styles.title}>Checkout</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{rows.length} Items</Text>
          </View>
        </View>

        <View style={[styles.topGrid, !isWide && styles.topGridStack]}>
          <View style={[styles.section, styles.addressCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>Delivery Address</Text>
            </View>
            <View style={styles.row2}>
              <Field 
                icon="person-outline" 
                label="Full Name" 
                value={address.fullName} 
                error={formErrors.fullName}
                required
                onChange={(v) => updateField("fullName", v)} 
              />
              <Field
                icon="call-outline"
                label="Phone"
                value={address.phone}
                error={formErrors.phone}
                required
                keyboardType="number-pad"
                onChange={(v) => updateField("phone", v.replace(/[^\d]/g, ""))}
              />
            </View>
            <View style={styles.row2}>
              <Field
                icon="pin-outline"
                label="Pincode"
                value={address.pincode}
                error={formErrors.pincode}
                required
                keyboardType="number-pad"
                onChange={(v) => updateField("pincode", v.replace(/[^\d]/g, ""))}
              />
              <Field 
                icon="business-outline" 
                label="City" 
                value={address.city} 
                error={formErrors.city}
                required
                onChange={(v) => updateField("city", v)} 
              />
            </View>
            <View style={styles.row2}>
              <Field 
                icon="map-outline" 
                label="State" 
                value={address.state} 
                error={formErrors.state}
                required
                onChange={(v) => updateField("state", v)} 
              />
              <Field 
                icon="home-outline" 
                label="Street Address" 
                value={address.street} 
                error={formErrors.street}
                required
                onChange={(v) => updateField("street", v)} 
              />
            </View>
          </View>

          <View style={[styles.section, styles.summaryCard]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="receipt-outline" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>Order Summary</Text>
            </View>
            
            <View style={styles.cartPreview}>
              {rows.map((r, i) => (
                <View key={r.id} style={styles.productBadge}>
                  <View style={styles.miniItem}>
                    <Image source={{ uri: r.image }} style={styles.miniImg} contentFit="cover" />
                    <View style={styles.qtyBadge}>
                      <Text style={styles.qtyBadgeText}>{r.qty}</Text>
                    </View>
                  </View>
                  <Text style={styles.productBadgeName} numberOfLines={1}>{r.name}</Text>
                </View>
              ))}
            </View>

            
            <Row k="Subtotal" v={`₹${subtotal.toFixed(2)}`} />
            <Row k="Delivery Fee" v={`₹${rows.length ? DELIVERY_FEE.toFixed(2) : "0.00"}`} />
            <View style={[styles.divider, { marginVertical: 12 }]} />
            <Row k="Grand Total" v={`₹${grandTotal.toFixed(2)}`} strong />
            
            <Pressable 
              style={({ pressed }) => [
                styles.cta, 
                styles.summaryCta, 
                submitting && styles.disabled,
                pressed && styles.pressed
              ]} 
              onPress={onPlaceOrder} 
              disabled={submitting}
            >
              <Text style={styles.ctaText}>
                {submitting ? "Processing..." : (paymentMethod === "COD" ? "Place Order" : "Proceed to Payment")}
              </Text>
              {!submitting && <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 8 }} />}
            </Pressable>
            
            <View style={styles.trustBadge}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.subtleText} />
              <Text style={styles.trustText}>Secure 256-bit SSL encrypted checkout</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>
          
          <View style={styles.methodGrid}>
            <MethodTile
              active={paymentMethod === "COD"}
              icon="cash-outline"
              title="Cash on Delivery"
              subtitle="Pay when product is delivered"
              onPress={() => setPaymentMethod("COD")}
            />
            <MethodTile
              active={paymentMethod === "RazorpayDemo"}
              icon="wallet-outline"
              title="Online Payment"
              subtitle="Cards, UPI, Netbanking"
              onPress={() => setPaymentMethod("RazorpayDemo")}
            />
          </View>

          {paymentMethod === "RazorpayDemo" ? (
            <View style={styles.gatewayWrap}>
              {gateways.length ? (
                gateways.map((gw) => (
                  <Pressable
                    key={gw.id}
                    onPress={() => setSelectedGateway(gw.id)}
                    style={[styles.gatewayChip, selectedGateway === gw.id && styles.gatewayChipOn]}
                  >
                    <Text style={[styles.gatewayText, selectedGateway === gw.id && styles.gatewayTextOn]}>
                      {gw.label}
                    </Text>
                  </Pressable>
                ))
              ) : null}
            </View>
          ) : null}
        </View>

        {error ? (
          <View style={styles.error}>
            <Ionicons name="alert-circle-outline" size={20} color="#e11d48" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
        
        <Footer bleed={spacing.lg} bleedBottom={spacing.xxl} />
      </Animated.ScrollView>
      
    </View>
  );
}

function Field({ label, value, onChange, icon, error, required, keyboardType = "default" }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, (isFocused || error) && { color: error ? '#e11d48' : colors.accent }]}>
        {label} {required && <Text style={{ color: '#e11d48' }}>*</Text>}
      </Text>
      <View style={[
        styles.inputContainer, 
        isFocused && styles.inputFocused,
        error && styles.inputError
      ]}>
        <Ionicons 
          name={icon} 
          size={18} 
          color={error ? '#e11d48' : (isFocused ? colors.accent : colors.muted)} 
          style={{ marginRight: 10 }} 
        />
        <TextInput
          value={value}
          onChangeText={onChange}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.input}
          placeholder={`Enter ${label.toLowerCase()}`}
          placeholderTextColor={colors.muted}
        />
      </View>
      {error ? (
        <Text style={styles.fieldErrorText}>{error}</Text>
      ) : null}
    </View>
  );
}

function MethodTile({ active, icon, title, subtitle, onPress }) {
  return (
    <Pressable 
      style={[styles.methodTile, active && styles.methodTileOn]} 
      onPress={onPress}
    >
      <View style={[styles.tileIcon, active && styles.tileIconOn]}>
        <Ionicons name={icon} size={24} color={active ? colors.white : colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.methodTitle, active && styles.methodTitleOnText]}>{title}</Text>
        <Text style={[styles.methodSub, active && styles.methodSubOnText]}>{subtitle}</Text>
      </View>
      <View style={[styles.radio, active && styles.radioOn]}>
        {active ? <View style={styles.dot} /> : null}
      </View>
    </Pressable>
  );
}

function Row({ k, v, strong }) {
  return (
    <View style={styles.sumRow}>
      <Text style={[styles.sumK, strong && styles.sumStrong]}>{k}</Text>
      <Text style={[styles.sumV, strong && styles.sumStrong]}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: colors.ink,
    fontFamily: Platform.OS === "web" ? "Georgia, 'Times New Roman', serif" : undefined,
  },
  badgeCount: {
    backgroundColor: 'rgba(31, 122, 74, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(31, 122, 74, 0.2)',
  },
  badgeCountText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    marginTop: spacing.md,
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(13, 87, 49, 0.08)",
    padding: spacing.xl,
    ...(Platform.OS === "web" ? { 
      boxShadow: "0 10px 40px rgba(13, 87, 49, 0.05), 0 1px 3px rgba(0,0,0,0.02)" 
    } : {
      elevation: 3,
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.lg,
  },
  sectionTitle: { 
    color: colors.ink, 
    fontWeight: "900", 
    fontSize: 18,
    letterSpacing: -0.2,
  },
  topGrid: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  topGridStack: {
    flexDirection: "column",
  },
  addressCard: {
    flex: 1.5,
  },
  summaryCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#ffffff',
  },
  cartPreview: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: spacing.lg,
  },
  productBadge: {
    alignItems: 'center',
    width: 70,
  },
  productBadgeName: {
    fontSize: 10,
    color: colors.subtleText,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
    width: '100%',
  },
  miniItem: {
    width: 60,
    height: 60,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    position: 'relative',
    ...(Platform.OS === "web" ? { boxShadow: "0 8px 20px rgba(13, 87, 49, 0.12)" } : {}),
  },
  qtyBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.accent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  qtyBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  miniImg: {
    width: '100%',
    height: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(13, 87, 49, 0.08)',
    width: '100%',
  },
  row2: { flexDirection: "row", gap: 16, flexWrap: "wrap" },
  fieldWrap: { flex: 1, minWidth: 200, marginBottom: 16 },
  label: { 
    color: colors.subtleText, 
    fontSize: 13, 
    fontWeight: "700", 
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: "rgba(13, 87, 49, 0.12)",
    backgroundColor: "#fcfdfc",
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: colors.accent,
    backgroundColor: "#ffffff",
    ...(Platform.OS === "web" ? { boxShadow: `0 0 0 4px ${colors.accent}15` } : {}),
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
    fontWeight: "600",
  },
  inputError: {
    borderColor: '#e11d48',
    backgroundColor: '#fff1f2',
  },
  fieldErrorText: {
    color: '#e11d48',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
  methodGrid: {
    gap: 12,
  },
  methodTile: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
    padding: 20,
    borderWidth: 2,
    borderColor: "rgba(13, 87, 49, 0.08)",
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  methodTileOn: { 
    borderColor: colors.accent, 
    backgroundColor: `${colors.accent}05`,
  },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: `${colors.accent}10`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconOn: {
    backgroundColor: colors.accent,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(13, 87, 49, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  radioOn: { borderColor: colors.accent },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  methodTitle: { color: colors.ink, fontWeight: "800", fontSize: 16 },
  methodTitleOnText: { color: colors.accent },
  methodSub: { color: colors.subtleText, marginTop: 4, fontSize: 13, lineHeight: 18 },
  methodSubOnText: { color: colors.subtleText },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  trustText: {
    fontSize: 11,
    color: colors.subtleText,
    fontWeight: '600',
  },
  gatewayWrap: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingLeft: 64,
  },
  gatewayChip: {
    borderWidth: 1.5,
    borderColor: "rgba(13, 87, 49, 0.15)",
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  gatewayChipOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  gatewayText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 13,
  },
  gatewayTextOn: {
    color: colors.white,
  },
  sumRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  sumK: { color: colors.subtleText, fontWeight: "600", fontSize: 14 },
  sumV: { color: colors.ink, fontWeight: "700", fontSize: 14 },
  sumStrong: { color: colors.ink, fontWeight: "900", fontSize: 18 },
  error: {
    marginTop: spacing.md,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#fff1f2",
    borderColor: "#fecdd3",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  errorText: { color: "#e11d48", fontWeight: "700", fontSize: 14, flex: 1 },
  cta: {
    marginTop: spacing.xl,
    backgroundColor: colors.highlight,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 18,
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 30px rgba(246, 181, 30, 0.3)" } : {}),
  },
  ctaText: { color: colors.ink, fontWeight: "900", fontSize: 18, letterSpacing: 0.5 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.6 },
});
