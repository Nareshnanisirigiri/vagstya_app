import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useOrders } from "../context/OrdersContext";
import { colors, spacing } from "../theme/theme";

const STATUS_STAGES = [
  { key: "packed", label: "Packed", sub: "Order is being prepared" },
  { key: "shipped", label: "Shipped", sub: "Order has left the warehouse" },
  { key: "out for delivery", label: "Out for Delivery", sub: "Arriving today" },
  { key: "delivered", label: "Delivered", sub: "Successfully received" },
];

export default function TrackOrderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { orderId } = route.params || {};
  const { orders } = useOrders();

  const order = useMemo(() => orders.find((o) => o.id === orderId), [orders, orderId]);

  if (!order) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Order not found.</Text>
        </View>
      </View>
    );
  }

  const currentStatus = String(order.orderStatus || "Pending").toLowerCase();
  const isReturned = currentStatus.includes("return") || currentStatus.includes("refund");
  
  const activeIndex = STATUS_STAGES.findIndex(s => s.key === currentStatus);

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.breadcrumb}>
          <Text style={styles.breadText}>Your Account › Your Orders › Order Summary › </Text>
          <Text style={[styles.breadText, { color: '#e47911', fontWeight: '700' }]}>Delivery Tracking</Text>
        </View>

        <Text style={styles.title}>Delivery Tracking</Text>

        <View style={styles.trackingCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>
              {isReturned ? "Return / Refund" : activeIndex >= 0 ? STATUS_STAGES[activeIndex].label : "In Transit : On Schedule"}
            </Text>
            <Text style={styles.expectedText}>
              Expected delivery: <Text style={{ color: '#008a00', fontWeight: '700' }}>{new Date(new Date(order.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toDateString()}</Text>
            </Text>
          </View>

          {isReturned ? (
            <View style={styles.returnSection}>
               <Ionicons name="reload-circle" size={40} color="#b91c1c" />
               <View style={{ marginLeft: 12 }}>
                 <Text style={styles.returnTitle}>Return complete</Text>
                 <Text style={styles.returnDesc}>Your return is complete. The refund has been processed to your original payment method.</Text>
               </View>
            </View>
          ) : (
            <View style={styles.timelineContainer}>
              {STATUS_STAGES.map((stage, index) => {
                const isCompleted = index <= activeIndex;
                const isCurrent = index === activeIndex;
                
                return (
                  <View key={stage.key} style={styles.timelineRow}>
                    <View style={styles.lineCol}>
                      <View style={[styles.dot, isCompleted && styles.dotCompleted]}>
                        {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                      {index < STATUS_STAGES.length - 1 && (
                        <View style={[styles.line, index < activeIndex && styles.lineCompleted]} />
                      )}
                    </View>
                    <View style={styles.contentCol}>
                      <Text style={[styles.stageLabel, isCompleted && styles.stageLabelActive]}>
                        {stage.label}
                      </Text>
                      {isCurrent && <Text style={styles.stageSub}>{stage.sub}</Text>}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={styles.footerInfo}>
             <Ionicons name="location-outline" size={20} color={colors.subtleText} />
             <Text style={styles.addressText}>
               Shipping to: {order.address.fullName}, {order.address.city}, {order.address.pincode}
             </Text>
          </View>
        </View>
      </ScrollView>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  body: { padding: 20 },
  breadcrumb: { flexDirection: 'row', marginBottom: 20, flexWrap: 'wrap' },
  breadText: { fontSize: 13, color: '#565959' },
  title: { fontSize: 26, fontWeight: "500", color: "#111", marginBottom: 20 },
  trackingCard: {
    borderWidth: 1,
    borderColor: "#d5d9d9",
    borderRadius: 8,
    padding: 20,
    backgroundColor: "#fff",
  },
  statusHeader: { marginBottom: 30, borderBottomWidth: 1, borderBottomColor: '#eee', pb: 20, paddingBottom: 20 },
  statusTitle: { fontSize: 22, fontWeight: "700", color: "#e47911", marginBottom: 8 },
  expectedText: { fontSize: 14, color: "#111" },
  timelineContainer: { marginVertical: 10 },
  timelineRow: { flexDirection: 'row', minHeight: 60 },
  lineCol: { alignItems: 'center', width: 30 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e9e9e9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dotCompleted: { backgroundColor: '#e47911' },
  line: {
    width: 3,
    flex: 1,
    backgroundColor: '#e9e9e9',
    marginVertical: -2,
  },
  lineCompleted: { backgroundColor: '#e47911' },
  contentCol: { marginLeft: 15, flex: 1, justifyContent: 'center' },
  stageLabel: { fontSize: 16, color: "#565959", fontWeight: "500" },
  stageLabelActive: { color: "#111", fontWeight: "700" },
  stageSub: { fontSize: 13, color: "#008a00", marginTop: 2, fontWeight: '600' },
  returnSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, backgroundColor: '#fdf2f2', borderRadius: 8, paddingHorizontal: 15, marginBottom: 20 },
  returnTitle: { fontSize: 18, fontWeight: '700', color: '#b91c1c' },
  returnDesc: { fontSize: 13, color: '#7f1d1d', marginTop: 2 },
  footerInfo: { marginTop: 30, borderTopWidth: 1, borderTopColor: '#eee', pt: 20, paddingTop: 20, flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 14, color: "#565959", marginLeft: 8 },
  errorText: { fontSize: 16, color: colors.error },
});
