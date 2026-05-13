import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { generateInvoiceHtml } from "../utils/InvoiceUtility";

export default function POSSalesView({ colors, token, apiRequest }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await apiRequest("/admin/data/tables/orders", { token });
      if (data && data.rows) {
        // Sort by most recent first
        const sortedData = [...data.rows].sort((a, b) => {
          return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
        });
        setSales(sortedData);
      }
    } catch (error) {
      console.error("Failed to fetch sales data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      const data = await apiRequest(`/orders/${orderId}`, { token });
      return data;
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      return null;
    }
  };

  const handleViewInvoice = async (order) => {
    setLoading(true);
    const fullOrder = await fetchOrderDetails(order.order_id || order.id);
    setLoading(false);
    setSelectedOrder(fullOrder || order);
    setModalVisible(true);
  };

  const handleDownloadInvoice = async (order) => {
    setLoading(true);
    const fullOrder = await fetchOrderDetails(order.order_id || order.id);
    setLoading(false);
    
    if (Platform.OS === 'web') {
      const printWindow = window.open('', '_blank');
      const invoiceHtml = generateInvoiceHtml(fullOrder || order);
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
    } else {
      Alert.alert("Download", "Invoice download started for Order #" + (order.order_id || order.id));
    }
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
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={styles.cardTitle}>POS Sales Summary</Text>
              <Text style={styles.cardSubtitle}>Track all completed in-store transactions</Text>
            </View>
            <Pressable style={styles.refreshButton} onPress={fetchSales}>
              <Ionicons name="refresh-outline" size={20} color="#0d5731" />
            </Pressable>
          </View>
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
              <View style={[styles.cell, { width: 120 }]}>
                <Text style={styles.columnName}>ACTIONS</Text>
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
                    <Text style={styles.cellText}>
                      {row.created_at 
                        ? new Date(row.created_at).toLocaleDateString() + ' ' + new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : row.date || "N/A"}
                    </Text>
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
                  <View style={[styles.cell, { width: 120, flexDirection: "row", gap: 12 }]}>
                    <Pressable onPress={() => handleViewInvoice(row)} hitSlop={8} style={styles.actionIcon}>
                      <Ionicons name="eye-outline" size={18} color="#0d5731" />
                    </Pressable>
                    <Pressable onPress={() => handleDownloadInvoice(row)} hitSlop={8} style={styles.actionIcon}>
                      <Ionicons name="download-outline" size={18} color="#f6b51e" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </View>

      {/* Invoice Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <Pressable onPress={() => setModalVisible(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color="#64748b" />
              </Pressable>
            </View>

            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.invoiceBox}>
                  <View style={styles.invoiceHeaderRow}>
                    <Text style={styles.invoiceTag}>INVOICE</Text>
                    <Text style={styles.invoiceIdText}>#{selectedOrder.order_id || selectedOrder.id}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>DATE</Text>
                      <Text style={styles.infoValue}>{new Date(selectedOrder.created_at || Date.now()).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.infoCol}>
                      <Text style={styles.infoLabel}>STATUS</Text>
                      <Text style={[styles.infoValue, { color: "#10b981" }]}>{selectedOrder.order_status || "Delivered"}</Text>
                    </View>
                  </View>

                  <View style={styles.infoCol}>
                    <Text style={styles.infoLabel}>CUSTOMER</Text>
                    <Text style={styles.infoValue}>{selectedOrder.customer_name || "Walk-in Customer"}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.itemsHeader}>
                    <Text style={styles.infoLabel}>ITEM DESCRIPTION</Text>
                    <Text style={styles.infoLabel}>AMOUNT</Text>
                  </View>

                  <View style={styles.itemRowSimple}>
                    <Text style={styles.itemNameSimple}>Jewellery Sale Transaction</Text>
                    <Text style={styles.itemPriceSimple}>Rs {selectedOrder.total_amount || selectedOrder.price || 0}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Grand Total</Text>
                    <Text style={styles.totalAmount}>Rs {selectedOrder.total_amount || selectedOrder.price || 0}</Text>
                  </View>

                  <View style={styles.paymentBox}>
                    <Text style={styles.paymentLabel}>Payment via {selectedOrder.payment_method || "Cash"}</Text>
                  </View>
                </View>

                <Pressable 
                  style={styles.downloadButton} 
                  onPress={() => {
                    handleDownloadInvoice(selectedOrder);
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="download-outline" size={20} color="white" />
                  <Text style={styles.downloadButtonText}>Download Invoice</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  actionIcon: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  invoiceBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 20,
    backgroundColor: "#fafafa",
  },
  invoiceTag: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0d5731",
    backgroundColor: "#0d573110",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 1,
  },
  invoiceIdText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  infoCol: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  itemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemRowSimple: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemNameSimple: {
    fontSize: 14,
    color: "#334155",
    flex: 1,
  },
  itemPriceSimple: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0d5731",
  },
  paymentBox: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    alignItems: "center",
  },
  paymentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  downloadButton: {
    backgroundColor: "#0d5731",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  downloadButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
