import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../api/client";
import { colors, spacing } from "../theme/theme";

const SIDEBAR_WIDTH = 280;
const SIDEBAR_HOVER = "rgba(255, 255, 255, 0.08)";
const TABLE_HEADER_BG = "#f8faf9";

const chartConfigBase = (mainColor) => ({
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `${mainColor}`,
  labelColor: (opacity = 1) => "rgba(100, 116, 139, 0.7)",
  style: { borderRadius: 16 },
  propsForDots: { r: "5", strokeWidth: "2", stroke: "#fff" }
});

const ORDER_LIFECYCLE_OPTIONS = [
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Out for Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Return / Refund", value: "return_refund" },
];

export default function AdminPanelScreen() {
  const navigation = useNavigation();
  const { user, token, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ rows: [], columns: [] });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeMetric, setActiveMetric] = useState("Earnings");
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [orderStatusUpdatingKey, setOrderStatusUpdatingKey] = useState("");

  // Security check: Redirect if not admin
  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigation.replace("AdminLogin");
    }
  }, [user, navigation]);

  // Fetch initial tables list
  useEffect(() => {
    async function loadTables() {
      try {
        const data = await apiRequest("/admin/data/tables", { token });
        setTables(data.tables || []);
        if (data.tables?.length > 0) {
          const initialTable = data.tables.find(t => t.name === "products") || data.tables[0];
          pickTable(initialTable.name);
        }
      } catch (err) {
        console.error("Failed to load tables:", err);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadTables();
  }, [token]);

  // Fetch Dashboard Analytics
  useEffect(() => {
    async function loadDashboard() {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const data = await apiRequest("/admin/dashboard", { token });
        setDashboardData(data);
        if (data?.metrics?.length) {
          setActiveMetric(data.metrics[0].label);
        }
      } catch (err) {
        console.error("Dashboard hit error:", err);
        setDashboardError(err.message);
      } finally {
        setDashboardLoading(false);
      }
    }
    if (token) loadDashboard();
  }, [token]);

  // Fetch metadata for forms
  useEffect(() => {
    async function loadMetadata() {
      try {
        const [catData, colorData, sizeData] = await Promise.all([
          apiRequest("/admin/data/tables/categories", { token }),
          apiRequest("/admin/data/tables/colors", { token }),
          apiRequest("/admin/data/tables/sizes", { token })
        ]);
        setCategories(catData.rows || []);
        setAvailableColors(colorData.rows || []);
        setAvailableSizes(sizeData.rows || []);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    }
    if (token) loadMetadata();
  }, [token]);

  const pickTable = async (tableName) => {
    setSelectedTable(tableName);
    setContentLoading(true);
    setSearchQuery(""); // Clear search on table change
    try {
      const data = await apiRequest(`/admin/data/tables/${tableName}`, { token });
      setTableData(data);
    } catch (err) {
      console.error("Failed to load table content:", err);
    } finally {
      setContentLoading(false);
    }
  };

  const getFirstTableByHint = (hint) => {
    const normalizedHint = String(hint || "").toLowerCase();
    return tables.find((table) => String(table?.name || "").toLowerCase().includes(normalizedHint))?.name || null;
  };

  const handleMetricCardPress = async (metricLabel) => {
    const key = String(metricLabel || "").toLowerCase();
    if (key.includes("earning")) {
      setSelectedTable(null);
      setActiveMetric("Earnings");
      return;
    }

    if (key.includes("user")) {
      const tableName = getFirstTableByHint("user");
      if (tableName) await pickTable(tableName);
      return;
    }

    if (key.includes("order")) {
      const tableName = getFirstTableByHint("order");
      if (tableName) await pickTable(tableName);
      return;
    }

    if (key.includes("product")) {
      const tableName = getFirstTableByHint("product");
      if (tableName) await pickTable(tableName);
      return;
    }
  };

  const getTableIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes("product")) return "cube";
    if (n.includes("order")) return "cart";
    if (n.includes("user") || n.includes("customer")) return "people";
    if (n.includes("categor")) return "list";
    if (n.includes("cart")) return "bag-handle";
    if (n.includes("review")) return "star";
    if (n.includes("banner") || n.includes("ad")) return "image";
    return "layers";
  };

  const filteredRows = tableData?.rows?.filter(row => {
    if (!searchQuery) return true;
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }) || [];

  const handleSaveProduct = async (formData) => {
    try {
      const endpoint = editingItem ? `/products/${editingItem.id}` : "/products";
      const method = editingItem ? "PUT" : "POST";
      
      const res = await apiRequest(endpoint, {
        method,
        body: formData,
        token
      });

      // Refresh data
      pickTable("products");
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      alert("Failed to save product: " + err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
     if (!confirm("Are you sure you want to delete this product?")) return;
     try {
       await apiRequest(`/products/${id}`, { method: "DELETE", token });
       pickTable("products");
     } catch (err) {
       alert("Delete failed: " + err.message);
     }
  }

  const handleOrderLifecycleUpdate = async (orderId, status) => {
    if (!orderId || !status) return;
    const updateKey = `${orderId}:${status}`;
    setOrderStatusUpdatingKey(updateKey);
    try {
      await apiRequest(`/orders/${orderId}/lifecycle-status`, {
        method: "PATCH",
        token,
        body: { status },
      });
      await pickTable("orders");
      const refreshedDashboard = await apiRequest("/admin/dashboard", { token });
      setDashboardData(refreshedDashboard);
      Alert.alert("Success", `Order #${orderId} moved to ${status.replaceAll("_", " ")}.`);
    } catch (err) {
      Alert.alert("Update failed", err.message);
    } finally {
      setOrderStatusUpdatingKey("");
    }
  };

  const metricCards = dashboardData?.metrics || [];
  const metricStyleByLabel = {
    earnings: { color: colors.accent, icon: "cash" },
    products: { color: colors.accent, icon: "cube" },
    orders: { color: colors.accent, icon: "cart" },
    users: { color: colors.accent, icon: "people" },
  };
  const selectedMetricKey = String(activeMetric || "").trim().toLowerCase();
  const lineLabels = dashboardData?.analytics?.labels || [];
  const lineDatasets = dashboardData?.analytics?.datasets || {};
  const selectedLineData =
    selectedMetricKey.includes("earning")
      ? lineDatasets.revenue
      : selectedMetricKey.includes("product")
        ? lineDatasets.products
        : selectedMetricKey.includes("order")
          ? lineDatasets.orders
          : lineDatasets.users;
  const selectedChartColor = colors.accent;
  const selectedChartTitle = selectedMetricKey.includes("earning") ? "Earnings" : (activeMetric || "Overview");

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading Workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Sidebar */}
      <View style={[styles.sidebar, sidebarCollapsed && styles.sidebarCollapsed]}>
        <View style={styles.sidebarHeader}>
          {!sidebarCollapsed && <Text style={styles.logoText}>VOGSTYA</Text>}
          <Pressable onPress={() => setSidebarCollapsed(!sidebarCollapsed)} style={styles.collapseBtn}>
            <Ionicons name={sidebarCollapsed ? "chevron-forward" : "menu"} size={22} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
          <Text style={styles.navHeader}>{sidebarCollapsed ? "•••" : "PLATFORM"}</Text>
          
          <Pressable 
            style={[styles.navItem, !selectedTable && styles.navItemActive]}
            onPress={() => setSelectedTable(null)}
          >
            <Ionicons name="grid" size={20} color={!selectedTable ? colors.white : "rgba(255,255,255,0.5)"} />
            {!sidebarCollapsed && <Text style={[styles.navItemText, !selectedTable && styles.navItemTextActive]}>Overview</Text>}
          </Pressable>

          <View style={styles.divider} />
          <Text style={styles.navHeader}>{sidebarCollapsed ? "•••" : "DATABASE"}</Text>

          {tables.map((table) => (
            <Pressable
              key={table.name}
              style={[styles.navItem, selectedTable === table.name && styles.navItemActive]}
              onPress={() => pickTable(table.name)}
            >
              <Ionicons 
                name={getTableIcon(table.name)} 
                size={20} 
                color={selectedTable === table.name ? colors.white : "rgba(255,255,255,0.5)"} 
              />
              {!sidebarCollapsed && (
                <>
                  <Text style={[styles.navItemText, selectedTable === table.name && styles.navItemTextActive]}>
                    {table.name.charAt(0).toUpperCase() + table.name.slice(1)}
                  </Text>
                  {table.count > 0 && (
                    <View style={styles.countBadge}>
                      <Text style={styles.countText}>{table.count}</Text>
                    </View>
                  )}
                </>
              )}
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Pressable style={styles.logoutBtn} onPress={logout}>
            <Ionicons name="log-out" size={20} color={colors.danger} />
            {!sidebarCollapsed && <Text style={styles.logoutText}>Logout</Text>}
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <View>
            <Text style={styles.contentTitle}>
              {selectedTable ? `${selectedTable.charAt(0).toUpperCase() + selectedTable.slice(1)} Management` : "Dashboard Overview"}
            </Text>
            <Text style={styles.contentSub}>
              {selectedTable ? `Viewing all records from ${selectedTable} table.` : "Welcome back to your administration suite."}
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <Pressable style={styles.headerCircle}>
              <Ionicons name="notifications-outline" size={20} color={colors.ink} />
            </Pressable>
            <View style={styles.userProfile}>
              <View style={styles.avatar}>
                <Text style={styles.avatarChar}>{user?.name?.charAt(0) || "A"}</Text>
              </View>
              <View style={styles.userMeta}>
                <Text style={styles.userName}>{user?.name || "Admin"}</Text>
                <Text style={styles.userRole}>Store Manager</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
           {contentLoading ? (
            <View style={styles.tableCardLoading}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingDataText}>Optimizing records...</Text>
            </View>
          ) : selectedTable && tableData ? (
            <View style={styles.tableCard}>
              {/* Context Specific Graphs for Tables */}
              {selectedTable === "orders" && dashboardData?.analytics?.labels?.length > 0 && (
                <View style={styles.tableGraphSection}>
                  <Text style={styles.tableGraphTitle}>Orders Performance</Text>
                  <BarChart
                    data={{
                      labels: dashboardData.analytics.labels,
                      datasets: [{ data: dashboardData.analytics.datasets.orders }]
                    }}
                    width={Dimensions.get("window").width - (sidebarCollapsed ? 140 : 380)}
                    height={180}
                    chartConfig={chartConfigBase(colors.warning)}
                    style={styles.tableGraphStyle}
                  />
                </View>
              )}

              {selectedTable === "users" && dashboardData?.analytics?.labels?.length > 0 && (
                <View style={styles.tableGraphSection}>
                  <Text style={styles.tableGraphTitle}>User Growth Trend</Text>
                  <LineChart
                    data={{
                      labels: dashboardData.analytics.labels,
                      datasets: [{ data: dashboardData.analytics.datasets.users }]
                    }}
                    width={Dimensions.get("window").width - (sidebarCollapsed ? 140 : 380)}
                    height={180}
                    chartConfig={chartConfigBase(colors.highlight)}
                    bezier
                    style={styles.tableGraphStyle}
                  />
                </View>
              )}

              <View style={styles.tableToolbar}>
                <View style={styles.searchBox}>
                  <Ionicons name="search" size={18} color={colors.muted} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search in ${selectedTable}...`}
                    placeholderTextColor={colors.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                </View>
                <View style={styles.toolbarActions}>
                  {selectedTable === "products" && (
                     <Pressable style={styles.addBtn} onPress={() => setIsModalOpen(true)}>
                        <Ionicons name="add" size={20} color="white" />
                        <Text style={styles.addBtnText}>New Product</Text>
                     </Pressable>
                  )}
                  <Pressable style={styles.refreshBtn} onPress={() => pickTable(selectedTable)}>
                    <Ionicons name="refresh" size={16} color={colors.subtleText} />
                  </Pressable>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableContainer}>
                  <View style={styles.tableHeaderRow}>
                    {tableData.columns.slice(0, 10).map((col) => (
                      <View key={col.name} style={[styles.cell, { width: 140 }]}>
                        <Text style={styles.columnName}>{col.name.toUpperCase()}</Text>
                      </View>
                    ))}
                    <View style={[styles.cell, { width: selectedTable === "orders" ? 360 : 100 }]}>
                      <Text style={styles.columnName}>ACTIONS</Text>
                    </View>
                  </View>

                  {filteredRows.length > 0 ? (
                    filteredRows.map((row, idx) => (
                      <View key={idx} style={[styles.tableRow, idx % 2 === 1 && { backgroundColor: "#fcfcfd" }]}>
                        {tableData.columns.slice(0, 10).map((col) => (
                          <View key={col.name} style={[styles.cell, { width: 140 }]}>
                            <Text style={styles.cellText} numberOfLines={1}>
                               {row[col.name] === null ? "—" : String(row[col.name])}
                            </Text>
                          </View>
                        ))}
                         <View style={[styles.cell, { width: selectedTable === "orders" ? 360 : 100, flexDirection: "row", gap: 8, flexWrap: "wrap" }]}>
                          {selectedTable === "products" ? (
                            <>
                              <Pressable onPress={() => setEditingItem(row)} hitSlop={8}>
                                <Ionicons name="create-outline" size={18} color={colors.accent} />
                              </Pressable>
                              <Pressable onPress={() => handleDeleteProduct(row.id)} hitSlop={8}>
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                              </Pressable>
                            </>
                          ) : selectedTable === "orders" ? (
                            ORDER_LIFECYCLE_OPTIONS.map((option) => {
                              const opKey = `${row.id}:${option.value}`;
                              const isBusy = orderStatusUpdatingKey === opKey;
                              return (
                                <Pressable
                                  key={option.value}
                                  style={styles.orderStatusBtn}
                                  onPress={() => handleOrderLifecycleUpdate(row.id, option.value)}
                                  disabled={Boolean(orderStatusUpdatingKey)}
                                >
                                  {isBusy ? (
                                    <ActivityIndicator size="small" color={colors.white} />
                                  ) : (
                                    <Text style={styles.orderStatusBtnText}>{option.label}</Text>
                                  )}
                                </Pressable>
                              );
                            })
                          ) : (
                            <Text style={styles.cellText}>-</Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No results matching "{searchQuery}"</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.dashboardContainer}>
              {dashboardLoading ? (
                <View style={styles.tableCardLoading}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.loadingDataText}>Loading dashboard analytics...</Text>
                </View>
              ) : dashboardError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{dashboardError}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.dashboardGrid}>
                    {metricCards.map((metric) => {
                      const key = String(metric.label || "").toLowerCase();
                      const styleMeta = metricStyleByLabel[key] || { color: colors.accent, icon: "stats-chart" };
                      const isActive = metric.label === activeMetric;
                      return (
                        <Pressable
                          key={metric.label}
                          onPress={() => handleMetricCardPress(metric.label)}
                          style={[
                            styles.statCard,
                            { borderLeftColor: styleMeta.color },
                            isActive && styles.statCardActive,
                          ]}
                        >
                          <View style={[styles.statIconContainer, { backgroundColor: `${styleMeta.color}1A` }]}>
                            <Ionicons name={styleMeta.icon} size={24} color={styleMeta.color} />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.statValue}>{metric.value}</Text>
                            <Text style={styles.statLabel}>{metric.label}</Text>
                            {isActive ? <Text style={styles.activeIndicator}>Selected</Text> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={styles.chartCard}>
                    <View style={styles.chartHeader}>
                      <Text style={styles.chartTitle}>{selectedChartTitle} Trend</Text>
                      <Text style={styles.chartSub}>Click a card above to switch line graph.</Text>
                    </View>
                    {lineLabels.length > 0 && Array.isArray(selectedLineData) ? (
                      <LineChart
                        data={{
                          labels: lineLabels,
                          datasets: [{ data: selectedLineData.length ? selectedLineData : [0] }],
                        }}
                        width={Math.max(340, Dimensions.get("window").width - (sidebarCollapsed ? 220 : 520))}
                        height={260}
                        chartConfig={chartConfigBase(selectedChartColor)}
                        bezier
                        style={styles.chartStyle}
                      />
                    ) : (
                      <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No chart data available yet.</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/* Product Modal */}
      {(isModalOpen || editingItem) && (
        <ProductModal 
          visible={true}
          item={editingItem}
          categories={categories}
          colors={availableColors}
          sizes={availableSizes}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveProduct}
        />
      )}
    </View>
  );
}

function ProductModal({ visible, item, categories, colors, sizes, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [price, setPrice] = useState(String(item?.price || ""));
  const [discountPrice, setDiscountPrice] = useState(String(item?.discount_price || "0"));
  const [quantity, setQuantity] = useState(String(item?.quantity || "0"));
  const [metal, setMetal] = useState(item?.metal || "");
  const [weight, setWeight] = useState(item?.weight || "");
  const [size, setSize] = useState(item?.size || "");
  const [desc, setDesc] = useState(item?.description || "");
  const [img, setImg] = useState(item?.image || "");
  const [catId, setCatId] = useState(item?.category_id || "");
  const [selColors, setSelColors] = useState([]); // would need mapping for existing
  const [selSizes, setSelSizes] = useState([]);   // would need mapping for existing

  return (
    <View style={modalStyles.overlay}>
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{item ? "Edit Product" : "New Product"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.subtleText} /></Pressable>
        </View>

        <ScrollView style={modalStyles.body}>
          <Text style={modalStyles.label}>Product Name</Text>
          <TextInput value={name} onChangeText={setName} style={modalStyles.input} placeholder="e.g. Diamond Necklace" />

          <View style={modalStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Base Price</Text>
              <TextInput value={price} onChangeText={setPrice} style={modalStyles.input} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Discount Price</Text>
              <TextInput value={discountPrice} onChangeText={setDiscountPrice} style={modalStyles.input} keyboardType="numeric" />
            </View>
          </View>

          <View style={modalStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Quantity</Text>
              <TextInput value={quantity} onChangeText={setQuantity} style={modalStyles.input} keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Metal</Text>
              <TextInput value={metal} onChangeText={setMetal} style={modalStyles.input} placeholder="e.g. 18k Gold" />
            </View>
          </View>

          <Text style={modalStyles.label}>Image URL</Text>
          <TextInput value={img} onChangeText={setImg} style={modalStyles.input} placeholder="https://..." />

          <Text style={modalStyles.label}>Description</Text>
          <TextInput value={desc} onChangeText={setDesc} style={[modalStyles.input, { height: 100 }]} multiline numberOfLines={4} />

          <Text style={modalStyles.label}>Category</Text>
          <View style={modalStyles.optionsRow}>
             {categories.map(cat => (
               <Pressable 
                key={cat.id} 
                style={[modalStyles.pill, catId === cat.id && modalStyles.pillActive]}
                onPress={() => setCatId(cat.id)}
               >
                 <Text style={[modalStyles.pillText, catId === cat.id && modalStyles.pillTextActive]}>{cat.name}</Text>
               </Pressable>
             ))}
          </View>

          <Text style={modalStyles.label}>Variations (Select Colors)</Text>
          <View style={modalStyles.optionsRow}>
             {colors.map(c => (
               <Pressable 
                key={c.id} 
                style={[modalStyles.pill, selColors.includes(c.id) && modalStyles.pillActive]}
                onPress={() => {
                  if (selColors.includes(c.id)) setSelColors(selColors.filter(id => id !== c.id));
                  else setSelColors([...selColors, c.id]);
                }}
               >
                 <Text style={[modalStyles.pillText, selColors.includes(c.id) && modalStyles.pillTextActive]}>{c.name}</Text>
               </Pressable>
             ))}
          </View>

          <Text style={modalStyles.label}>Variations (Select Sizes)</Text>
          <View style={modalStyles.optionsRow}>
             {sizes.map(s => (
               <Pressable 
                key={s.id} 
                style={[modalStyles.pill, selSizes.includes(s.id) && modalStyles.pillActive]}
                onPress={() => {
                  if (selSizes.includes(s.id)) setSelSizes(selSizes.filter(id => id !== s.id));
                  else setSelSizes([...selSizes, s.id]);
                }}
               >
                 <Text style={[modalStyles.pillText, selSizes.includes(s.id) && modalStyles.pillTextActive]}>{s.name || s.size}</Text>
               </Pressable>
             ))}
          </View>
        </ScrollView>

        <View style={modalStyles.footer}>
           <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Cancel</Text></Pressable>
           <Pressable style={modalStyles.saveBtn} onPress={() => onSave({
             name, price: Number(price), discount_price: Number(discountPrice), quantity: Number(quantity),
             metal, weight, size, description: desc, image: img, category_id: Number(catId),
             colors: selColors, sizes: selSizes
           })}>
             <Text style={modalStyles.saveBtnText}>Save Product</Text>
           </Pressable>
        </View>
      </View>
    </View>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  container: {
    width: 600,
    maxHeight: "90%",
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
  },
  header: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: { fontSize: 18, fontWeight: "800", color: colors.ink },
  body: { padding: 20 },
  footer: { 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: "#f1f5f9", 
    flexDirection: "row", 
    justifyContent: "flex-end", 
    gap: 12 
  },
  label: { fontSize: 12, fontWeight: "700", color: colors.subtleText, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: colors.ink,
    outlineStyle: "none",
  },
  row: { flexDirection: "row", gap: 16 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  pill: { 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    backgroundColor: "#f8fafc", 
    borderWidth: 1, 
    borderColor: "#e2e8f0" 
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pillText: { fontSize: 11, fontWeight: "600", color: colors.subtleText },
  pillTextActive: { color: "white" },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 10 },
  cancelBtnText: { color: colors.subtleText, fontWeight: "700", fontSize: 14 },
  saveBtn: { backgroundColor: colors.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.subtleText,
    fontSize: 14,
    fontWeight: "600",
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: colors.primary,
    height: "100%",
    paddingTop: spacing.xl,
  },
  sidebarCollapsed: {
    width: 70,
  },
  sidebarHeader: {
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.xxl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: 2,
    fontFamily: Platform.OS === "web" ? "Inter, sans-serif" : undefined,
  },
  collapseBtn: {
    padding: 4,
  },
  sidebarScroll: {
    flex: 1,
  },
  navHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.3)",
    letterSpacing: 1.5,
    paddingHorizontal: spacing.xl,
    marginBottom: 10,
    marginTop: 24,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: spacing.xl,
    gap: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
  navItemText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  navItemTextActive: {
    color: colors.accent,
    fontWeight: "700",
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  countText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginVertical: 10,
    marginHorizontal: spacing.xl,
  },
  sidebarFooter: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  logoutText: {
    color: colors.danger,
    fontWeight: "700",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentHeader: {
    height: 70,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  contentTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  contentSub: {
    fontSize: 12,
    color: colors.subtleText,
    marginTop: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  userProfile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 16,
    borderLeftWidth: 1,
    borderLeftColor: "#f1f5f9",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarChar: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },
  userMeta: {
    justifyContent: "center",
  },
  userName: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  userRole: {
    fontSize: 10,
    color: colors.accent,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  contentScroll: {
    flex: 1,
  },
  contentPadding: {
    padding: spacing.xl,
    paddingBottom: 100,
  },
  dashboardContainer: {
    gap: 24,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    flex: 1,
    minWidth: 240,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderLeftWidth: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" } : {}),
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
  },
  statLabel: {
    fontSize: 14,
    color: colors.subtleText,
    fontWeight: "600",
    marginTop: 2,
  },
  statTrend: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 12,
    fontWeight: "700",
  },
  statCardActive: {
    backgroundColor: "#fcfdfe",
    borderColor: colors.accent,
    transform: [{ scale: 1.02 }],
  },
  activeIndicator: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accent,
    textTransform: "uppercase",
    marginTop: 12,
  },
  tableGraphSection: {
    padding: 20,
    backgroundColor: "#fcfcfd",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableGraphTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 16,
  },
  tableGraphStyle: {
    borderRadius: 12,
  },
  tableCardLoading: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  loadingDataText: {
    marginTop: 10,
    color: colors.subtleText,
    fontSize: 12,
    fontWeight: "600",
  },
  tableCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...(Platform.OS === "web" ? { boxShadow: "0 1px 3px rgba(0,0,0,0.05)" } : {}),
  },
  tableToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 12,
    borderRadius: 8,
    width: 300,
    height: 38,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: colors.ink,
    outlineStyle: "none",
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "700",
  },
  orderStatusBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 7,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  orderStatusBtnText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  tableContainer: {
    padding: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cell: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
  },
  columnName: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.subtleText,
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "500",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
  },
  chartCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    flex: 1,
    minHeight: 320,
    justifyContent: "space-between",
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 15px -3px rgba(0,0,0,0.04)" } : {}),
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  chartSub: {
    fontSize: 12,
    color: colors.subtleText,
    marginTop: 4,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: Platform.OS === "web" ? -20 : 0,
  },
  insightList: {
    marginTop: 20,
    gap: 12,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 10,
  },
  insightText: {
    color: colors.subtleText,
    fontSize: 12,
    fontWeight: "600",
  },
});
