import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function POSSalesView({ colors, token, apiRequest }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/data/tables/orders", { token });
      if (data && data.rows) {
        // Filter for POS sales if possible, or just show all orders for now
        setSales(data.rows);
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (order) => {
    Alert.alert(
      `Invoice #${order.order_id || order.id}`,
      `Customer: ${order.customer_name || "Walk-in"}\nTotal: Rs ${order.total_amount || order.price}\nPayment: ${order.payment_method || "Cash"}`
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d5731" />
        <Text style={styles.loadingText}>Loading sales history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>POS Sales Summary</Text>
          <Text style={styles.cardSubtitle}>Track all completed in-store transactions</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={[styles.cell, { width: 100 }]}>
                <Text style={styles.columnName}>ORDER ID</Text>
              </View>
              <View style={[styles.cell, { width: 160 }]}>
                <Text style={styles.columnName}>ORDER DATE</Text>
              </View>
              <View style={[styles.cell, { width: 160 }]}>
                <Text style={styles.columnName}>CUSTOMER</Text>
              </View>
              <View style={[styles.cell, { width: 120 }]}>
                <Text style={styles.columnName}>TOTAL AMOUNT</Text>
              </View>
              <View style={[styles.cell, { width: 140 }]}>
                <Text style={styles.columnName}>PAYMENT METHOD</Text>
              </View>
              <View style={[styles.cell, { width: 120 }]}>
                <Text style={styles.columnName}>STATUS</Text>
              </View>
              <View style={[styles.cell, { width: 100 }]}>
                <Text style={styles.columnName}>ACTION</Text>
              </View>
            </View>

            {/* Table Body */}
            {sales.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No sales records found</Text>
              </View>
            ) : (
              sales.map((row, idx) => (
                <View
                  key={row.id || idx}
                  style={[
                    styles.tableRow,
                    idx % 2 === 1 && { backgroundColor: "#fcfcfd" },
                  ]}
                >
                  <View style={[styles.cell, { width: 100 }]}>
                    <Text style={styles.cellText}>#{row.order_id || row.id}</Text>
                  </View>
                  <View style={[styles.cell, { width: 160 }]}>
                    <Text style={styles.cellText}>{row.created_at || row.date || "N/A"}</Text>
                  </View>
                  <View style={[styles.cell, { width: 160 }]}>
                    <Text style={styles.cellText}>{row.customer_name || "Walk-in Customer"}</Text>
                  </View>
                  <View style={[styles.cell, { width: 120 }]}>
                    <Text style={[styles.cellText, { fontWeight: "700", color: "#0d5731" }]}>
                      Rs {row.total_amount || row.price || 0}
                    </Text>
                  </View>
                  <View style={[styles.cell, { width: 140 }]}>
                    <Text style={styles.cellText}>{row.payment_method || "Cash"}</Text>
                  </View>
                  <View style={[styles.cell, { width: 120 }]}>
                    <View style={[styles.statusBadge, { backgroundColor: "#10b9811A" }]}>
                      <Text style={[styles.statusBadgeText, { color: "#10b981" }]}>
                        {row.order_status || "Delivered"}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.cell, { width: 100 }]}>
                    <Pressable onPress={() => handleViewInvoice(row)} hitSlop={8}>
                      <Ionicons name="eye-outline" size={18} color="#0d5731" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 15,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  table: {
    minWidth: "100%",
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  columnName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 14,
    color: "#334155",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
  },
});
