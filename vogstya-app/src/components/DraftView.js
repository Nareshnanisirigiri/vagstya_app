import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { setSharedCart, setSharedCustomer } from "../utils/posState";

export default function DraftView({ colors, token, apiRequest, setActiveView }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("/admin/data/tables/pos_drafts", { token });
      if (res && res.rows) {
        const mapped = res.rows.map(row => ({
          id: row.id,
          date: new Date(row.created_at).toLocaleString(),
          customer: row.customer || "Walk-in Customer",
          totalProducts: row.total_products || 0,
          subtotal: row.subtotal || 0,
          discount: row.discount || 0,
          total: row.total || 0,
          items_json: row.items_json
        }));
        setDrafts(mapped);
      }
    } catch (error) {
      console.error("Failed to load POS drafts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = (id) => {
    Alert.alert("Delete Draft", "Are you sure you want to delete this draft?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await apiRequest(`/admin/data/tables/pos_drafts/${id}`, {
              method: "DELETE",
              token
            });
            Alert.alert("Success", "Draft deleted successfully.");
            fetchDrafts();
          } catch (error) {
            console.error("Delete draft failed:", error);
            Alert.alert("Error", "Failed to delete draft from database.");
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleRestoreDraft = (draft) => {
    Alert.alert("Restore Draft", "Restore this cart to the POS Terminal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore",
        onPress: () => {
          try {
            let cartData = [];
            if (draft.items_json) {
              cartData = JSON.parse(draft.items_json);
            }
            setSharedCart(cartData);
            setSharedCustomer(draft.customer);
            Alert.alert("Success", "Cart loaded! Switching to POS.");
            if (setActiveView) setActiveView("pos");
          } catch (e) {
            console.error("Restore error:", e);
            Alert.alert("Error", "Failed to parse cart data.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Saved Drafts</Text>
          <Text style={styles.cardSubtitle}>Manage pending POS sessions</Text>
        </View>

        {loading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#0d5731" />
            <Text style={{ marginTop: 12, color: "#64748b" }}>Loading drafts...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={[styles.cell, { width: 60 }]}>
                  <Text style={styles.columnName}>SL</Text>
                </View>
                <View style={[styles.cell, { width: 180 }]}>
                  <Text style={styles.columnName}>CREATED DATE</Text>
                </View>
                <View style={[styles.cell, { width: 180 }]}>
                  <Text style={styles.columnName}>CUSTOMER</Text>
                </View>
                <View style={[styles.cell, { width: 120 }]}>
                  <Text style={styles.columnName}>TOTAL PRODUCTS</Text>
                </View>
                <View style={[styles.cell, { width: 120 }]}>
                  <Text style={styles.columnName}>SUB TOTAL</Text>
                </View>
                <View style={[styles.cell, { width: 100 }]}>
                  <Text style={styles.columnName}>DISCOUNT</Text>
                </View>
                <View style={[styles.cell, { width: 120 }]}>
                  <Text style={styles.columnName}>TOTAL</Text>
                </View>
                <View style={[styles.cell, { width: 120 }]}>
                  <Text style={styles.columnName}>ACTION</Text>
                </View>
              </View>

              {/* Table Body */}
              {drafts.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No saved drafts found</Text>
                </View>
              ) : (
                drafts.map((row, idx) => (
                  <View
                    key={row.id}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 && { backgroundColor: "#fcfcfd" },
                    ]}
                  >
                    <View style={[styles.cell, { width: 60 }]}>
                      <Text style={styles.cellText}>{idx + 1}</Text>
                    </View>
                    <View style={[styles.cell, { width: 180 }]}>
                      <Text style={styles.cellText}>{row.date}</Text>
                    </View>
                    <View style={[styles.cell, { width: 180 }]}>
                      <Text style={styles.cellText}>{row.customer}</Text>
                    </View>
                    <View style={[styles.cell, { width: 120 }]}>
                      <Text style={styles.cellText}>{row.totalProducts}</Text>
                    </View>
                    <View style={[styles.cell, { width: 120 }]}>
                      <Text style={styles.cellText}>Rs {row.subtotal}</Text>
                    </View>
                    <View style={[styles.cell, { width: 100 }]}>
                      <Text style={styles.cellText}>Rs {row.discount}</Text>
                    </View>
                    <View style={[styles.cell, { width: 120 }]}>
                      <Text style={[styles.cellText, { fontWeight: "700", color: "#0d5731" }]}>
                        Rs {row.total}
                      </Text>
                    </View>
                    <View style={[styles.cell, { width: 120, flexDirection: "row", gap: 12 }]}>
                      <Pressable onPress={() => handleRestoreDraft(row)} hitSlop={8}>
                        <Ionicons name="arrow-redo-outline" size={18} color="#0d5731" />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteDraft(row.id)} hitSlop={8}>
                        <Ionicons name="trash-outline" size={18} color="#ef4444" />
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>
        )}
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
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#94a3b8",
    fontSize: 15,
  },
});
