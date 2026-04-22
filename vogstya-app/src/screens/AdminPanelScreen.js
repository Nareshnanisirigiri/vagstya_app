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
  Animated,
  Easing,
  useWindowDimensions,
} from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductsContext";
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

const StatCardContainer = ({ metric, isActive, styleMeta, onPress, dashboardReveal, data }) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const [animatedData, setAnimatedData] = useState([]);
  const animValue = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const targetData = Array.isArray(data) && data.length > 0 ? data.slice(-7) : [12, 18, 15, 22, 19, 25, 24]; // Fallback to semi-random trend if no data
    animValue.setValue(0);
    
    const anim = Animated.timing(animValue, {
      toValue: 1,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const listener = animValue.addListener(({ value }) => {
      setAnimatedData(targetData.map(v => v * value));
    });

    anim.start();

    return () => {
      animValue.removeListener(listener);
      anim.stop();
    };
  }, [data]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };
  const handleHoverIn = () => {
    if (Platform.OS === 'web') {
      Animated.spring(scale, { toValue: 1.04, tension: 80, friction: 5, useNativeDriver: true }).start();
    }
  };
  const handleHoverOut = () => {
    if (Platform.OS === 'web') {
      Animated.spring(scale, { toValue: 1, tension: 80, friction: 5, useNativeDriver: true }).start();
    }
  };

  return (
    <Animated.View
      style={[
        {
          opacity: dashboardReveal.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
          transform: [
            { scale },
            {
              translateY: dashboardReveal.interpolate({
                inputRange: [0, 1],
                outputRange: [26, 0],
              }),
            },
          ],
        },
        isActive && { zIndex: 10 }
      ]}
    >
      <Pressable
        onHoverIn={handleHoverIn}
        onHoverOut={handleHoverOut}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(metric.label)}
        style={[
          styles.statCard,
          isActive && styles.statCardActive,
          isActive && { borderColor: styleMeta.color, borderWidth: 1.5, ...(Platform.OS === "web" ? { boxShadow: `0 12px 28px ${styleMeta.color}33` } : {}) }
        ]}
      >
        <View style={styles.statCardHeader}>
          <View>
            <Text style={styles.statLabel}>{metric.label}</Text>
            <Text style={styles.statValue}>{metric.value}</Text>
            <Text style={styles.statTrend}>
              <Text style={{ color: styleMeta.color, fontWeight: "800" }}>+12.5% </Text>vs last month
            </Text>
          </View>
          <View style={[styles.statIconContainer, { backgroundColor: `${styleMeta.color}1A` }]}>
            <Ionicons name={styleMeta.icon} size={18} color={styleMeta.color} />
          </View>
        </View>

        <View style={styles.miniChartContainer}>
           {animatedData.length > 0 && (
             <LineChart
                data={{
                   labels: ["1", "2", "3", "4", "5", "6", "7"],
                   datasets: [{ data: animatedData }]
                }}
                width={Dimensions.get("window").width / 3}
                height={70}
                withHorizontalLabels={false}
                withVerticalLabels={false}
                withInnerLines={false}
                withOuterLines={false}
                withDots={false}
                withShadow={false}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  color: () => styleMeta.color,
                  labelColor: () => "transparent",
                  propsForBackgroundLines: { strokeWidth: 0 },
                  strokeWidth: 3,
                }}
                bezier
                style={{ 
                  paddingRight: 0, 
                  paddingLeft: 0,
                  marginLeft: -64, 
                  marginBottom: -16, 
                  marginTop: 15 
                }}
             />
           )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const AnimatedChartRevealer = ({ width, height, children, delay = 0 }) => {
  const slideAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    slideAnim.setValue(0);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 1000,
      delay: delay,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [width, children]); 

  return (
    <View style={{ overflow: "hidden", position: "relative", borderRadius: 16 }}>
      {children}
      <Animated.View
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: width + 50, 
          backgroundColor: "#ffffff",
          transform: [
            {
              translateX: slideAnim.interpolate({
                 inputRange: [0, 1],
                 outputRange: [0, width + 50],
              })
            }
          ]
        }}
      />
    </View>
  );
};

export default function AdminPanelScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const navigation = useNavigation();
  const { user, token, logout } = useAuth();
  const { products, reloadProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionFilter, setActiveSectionFilter] = useState("all"); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const HOME_SECTION_FILTERS = [
    { id: "all", label: "All Products", color: colors.accent, icon: "grid-outline" },
    { id: "is_featured", label: "Featured Edit", color: "#6366f1", icon: "star-outline" },
    { id: "is_auspicious", label: "Auspicious", color: "#f59e0b", icon: "leaf-outline" },
    { id: "is_popular_jewellery", label: "Popular Jewellery", color: "#06b6d4", icon: "diamond-outline" },
    { id: "is_mens_shirts", label: "Men's Shirts", color: "#10b981", icon: "shirt-outline" },
    { id: "is_womens_highlights", label: "Women's Highlights", color: "#f43f5e", icon: "female-outline" },
    { id: "is_premium_sarees", label: "Premium Sarees", color: "#ec4899", icon: "color-palette-outline" },
    { id: "is_flash_sale", label: "Flash Sale", color: "#ef4444", icon: "flash-outline" },
  ];
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [genericFormData, setGenericFormData] = useState({});
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ rows: [], columns: [] });
  const [loading, setLoading] = useState(true);
  const sampleDashboard = {
    metrics: [
       { label: "Earnings", value: "Rs 42,151.6" },
       { label: "Products", value: "368" },
       { label: "Orders", value: "33" },
       { label: "Users", value: "33" },
    ],
    analytics: {
       labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
       datasets: {
          revenue: [15000, 22000, 18000, 32000, 28000, 42000, 38000, 52000, 45000, 62000, 55000, 72000],
          products: [120, 145, 130, 210, 195, 280, 260, 340, 310, 368, 350, 390],
          orders: [5, 8, 4, 12, 10, 18, 15, 22, 18, 33, 28, 40],
          users: [8, 12, 10, 22, 18, 35, 30, 45, 38, 33, 30, 50],
       }
    }
  };

  const [dashboardData, setDashboardData] = useState(sampleDashboard);
  const [activeMetric, setActiveMetric] = useState("Earnings");
  const [displayChartData, setDisplayChartData] = useState(sampleDashboard.analytics.datasets.revenue);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const chartAnimValue = React.useRef(new Animated.Value(0)).current;

  // Animation for chart values "0 to increase"
  useEffect(() => {
    if (!dashboardData) return;
    
    const metricKey = String(activeMetric).trim().toLowerCase();
    const datasets = dashboardData?.analytics?.datasets || {};
    let targetData = [];
    
    if (metricKey.includes("earning") || metricKey.includes("revenue")) {
       targetData = datasets.revenue || [];
    } else if (metricKey.includes("profit")) {
       targetData = (datasets.revenue || []).map(v => v * 0.72);
    } else if (metricKey.includes("product")) {
       targetData = datasets.products || [];
    } else if (metricKey.includes("order")) {
       targetData = datasets.orders || [];
    } else {
       targetData = datasets.users || [];
    }

    if (!Array.isArray(targetData) || targetData.length === 0) return;

    // Reset and start animation
    chartAnimValue.setValue(0);
    const anim = Animated.timing(chartAnimValue, {
      toValue: 1,
      duration: 1000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const listener = chartAnimValue.addListener(({ value }) => {
      const interpolated = targetData.map(v => v * value);
      setDisplayChartData(interpolated);
    });

    anim.start();

    return () => {
      chartAnimValue.removeListener(listener);
      anim.stop();
    };
  }, [activeMetric, dashboardData]);
  const [dashboardError, setDashboardError] = useState(null);
  const [orderStatusUpdatingKey, setOrderStatusUpdatingKey] = useState("");
  const dashboardReveal = React.useRef(new Animated.Value(0)).current;

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
        const [dash, rev] = await Promise.all([
           apiRequest("/admin/dashboard", { token }),
           apiRequest("/products/reviews/all", { token })
        ]);
        
        if (dash && dash.analytics && dash.metrics) {
          setDashboardData(dash);
          setActiveMetric(dash.metrics[0].label);
        }
        
        if (rev && rev.reviews) {
           setRecentReviews(rev.reviews.slice(0, 5));
        }
      } catch (err) {
        console.error("Dashboard hit error:", err);
      } finally {
        setDashboardLoading(false);
      }
    }
    if (token) loadDashboard();
  }, [token]);

  useEffect(() => {
    dashboardReveal.setValue(0);
    Animated.spring(dashboardReveal, {
      toValue: 1,
      tension: 40,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [selectedTable, dashboardLoading, contentLoading, dashboardData, dashboardReveal]);

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
      const limitParam = tableName === "products" ? "?limit=1000&orderColumn=id&orderType=DESC" : "";
      const data = await apiRequest(`/admin/data/tables/${tableName}${limitParam}`, { token });
      if (tableName === "products" && data.columns) {
        // Add virtual visibility column if it doesn't exist
        if (!data.columns.find(c => c.name === "visibility")) {
          data.columns.push({ name: "visibility", dataType: "virtual" });
        }
      }
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

  const filteredRows = (tableData?.rows || []).filter((row) => {
    // 1. Search filter
    const matchesSearch = !searchQuery || Object.values(row).some((val) =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Section filter (for products table only)
    let matchesSection = true;
    if (selectedTable === "products" && activeSectionFilter !== "all") {
      matchesSection = row[activeSectionFilter] === 1;
    }

    return matchesSearch && matchesSection;
  });

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
      reloadProducts();
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
       reloadProducts();
     } catch (err) {
       alert("Delete failed: " + err.message);
     }
  }

  const handleQuickRemoveFromSection = async (id, sectionKey) => {
    try {
      const response = await apiRequest(`/admin/data/tables/products/${id}`, {
        method: "PUT",
        token,
        body: { [sectionKey]: 0 },
      });

      if (response && response.success) {
        // Update local state instead of re-fetching everything
        setTableData({
          ...tableData,
          rows: tableData.rows.map((r) => 
            r.id === id ? { ...r, [sectionKey]: 0 } : r
          ),
        });
        reloadProducts();
      }
    } catch (err) {
      console.error("Quick remove error:", err);
      alert("Failed to remove from section");
    }
  };

  const handleToggleFlashSale = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      // We use the specialized products endpoint because it handles the join table sync
      await apiRequest(`/products/${id}`, {
        method: "PUT",
        token,
        body: { is_flash_sale: newStatus },
      });

      // Update local state for immediate feedback
      setTableData({
        ...tableData,
        rows: tableData.rows.map((r) => 
          r.id === id ? { ...r, is_flash_sale: newStatus } : r
        ),
      });
      reloadProducts();
    } catch (err) {
      console.error("Flash sale toggle error:", err);
      alert("Failed to toggle Flash Sale status");
    }
  };

  const handleSaveGenericEntry = async () => {
    try {
      const endpoint = editingItem 
        ? `/admin/data/tables/${selectedTable}/${editingItem.id}` 
        : `/admin/data/tables/${selectedTable}`;
      const method = editingItem ? "PUT" : "POST";
      
      const res = await apiRequest(endpoint, {
        method,
        body: genericFormData,
        token
      });

      if (res && res.success) {
        Alert.alert("Success", editingItem ? "Updated successfully" : "Created successfully");
        pickTable(selectedTable);
        setIsGenericModalOpen(false);
        setEditingItem(null);
        setGenericFormData({});
      }
    } catch (err) {
      console.error("Save generic error:", err);
      Alert.alert("Error", "Failed to save record");
    }
  };

  const handleSaveCategories = async (updates) => {
    try {
      await Promise.all(
        updates.map(update => 
          apiRequest(`/admin/data/tables/categories/${update.id}`, {
            method: "PUT",
            body: { image_url: update.image_url },
            token
          })
        )
      );
      // Reload metadata
      const catData = await apiRequest("/admin/data/tables/categories", { token });
      setCategories(catData.rows || []);
      Alert.alert("Success", "Categories updated successfully!");
      setIsManageCategoriesOpen(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update categories.");
    }
  };

  const handleDeleteGenericEntry = async (id) => {
    if (!confirm(`Are you sure you want to delete this record from ${selectedTable}?`)) return;
    try {
      const res = await apiRequest(`/admin/data/tables/${selectedTable}/${id}`, {
        method: "DELETE",
        token
      });

      if (res && res.success) {
        Alert.alert("Success", "Deleted successfully");
        setTableData({
          ...tableData,
          rows: tableData.rows.filter(r => r.id !== id)
        });
      }
    } catch (err) {
      console.error("Delete generic error:", err);
      Alert.alert("Error", "Failed to delete record");
    }
  };


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

  const metricStyleByLabel = {
    earnings: { color: "#10b981", icon: "cash" },
    revenue: { color: "#10b981", icon: "cash" },
    products: { color: "#f59e0b", icon: "cube" },
    orders: { color: "#3b82f6", icon: "cart" },
    users: { color: "#06b6d4", icon: "people" },
  };
  const metricCards = dashboardData?.metrics || [];
  const lineLabels = dashboardData?.analytics?.labels || [];
  const selectedMetricKey = String(activeMetric || "").trim().toLowerCase();
  
  const selectedChartColor = 
    selectedMetricKey.includes("earning") || selectedMetricKey.includes("revenue") ? "#10b981" : 
    selectedMetricKey.includes("order") ? "#3b82f6" : 
    selectedMetricKey.includes("user") ? "#06b6d4" : 
    selectedMetricKey.includes("product") ? "#f59e0b" : "#6366f1";
    
  const overviewPanelAnimatedStyle = {
    opacity: dashboardReveal,
    transform: [
      {
        translateY: dashboardReveal.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };
  const chartAnimatedStyle = {
    opacity: dashboardReveal.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0, 0.25, 1],
    }),
    transform: [
      {
        scale: dashboardReveal.interpolate({
          inputRange: [0, 1],
          outputRange: [0.985, 1],
        }),
      },
    ],
  };
  if (loading) return <View><Text>Loading...</Text></View>;
  return <View><Text>Admin Panel</Text></View>;

  return (
    <View style={[styles.root, isMobile && { flexDirection: "column" }]}>
      {isMobile && (
        <View style={styles.mobileHeader}>
          <Pressable onPress={() => setIsSidebarOpen(true)} style={styles.mobileMenuBtn}>
            <Ionicons name="menu" size={28} color={colors.ink} />
          </Pressable>
          <Text style={styles.mobileLogoText}>VOGSTYA</Text>
          <View style={{ width: 28 }} />
        </View>
      )}

      {/* Sidebar */}
      {(!isMobile || isSidebarOpen) && (
        <View style={[
          styles.sidebar, 
          sidebarCollapsed && styles.sidebarCollapsed,
          isMobile && styles.sidebarMobile
        ]}>
          <View style={styles.sidebarHeader}>
            {!sidebarCollapsed && <Text style={styles.logoText}>VOGSTYA</Text>}
            {isMobile ? (
               <Pressable onPress={() => setIsSidebarOpen(false)} style={styles.collapseBtn}>
                 <Ionicons name="close" size={24} color="rgba(255,255,255,0.7)" />
               </Pressable>
            ) : (
              <Pressable onPress={() => setSidebarCollapsed(!sidebarCollapsed)} style={styles.collapseBtn}>
                <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
              </Pressable>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
            <Text style={styles.navHeader}>{sidebarCollapsed ? "•••" : "PLATFORM"}</Text>
            
            <Pressable 
              style={[styles.navItem, !selectedTable && styles.navItemActive]}
              onPress={() => {
                setSelectedTable(null);
                if(isMobile) setIsSidebarOpen(false);
              }}
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
                onPress={() => {
                  pickTable(table.name);
                  if(isMobile) setIsSidebarOpen(false);
                }}
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
      )}

      {isMobile && isSidebarOpen && (
        <Pressable 
          style={styles.sidebarBackdrop} 
          onPress={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <View>
            <View style={styles.contentHeaderTitleGroup}>
              <Text style={styles.contentTitle}>
                {selectedTable ? `${selectedTable.charAt(0).toUpperCase() + selectedTable.slice(1)} Management` : "Dashboard Overview"}
              </Text>
              {selectedTable && tableData?.rows && (
                <Text style={styles.contentSubtitle}>
                  Showing {filteredRows.length} of {tableData.rows.length} total records
                </Text>
              )}
            </View>
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
            <Animated.View style={[styles.tableCard, overviewPanelAnimatedStyle]}>
              {/* Context Specific Graphs for Tables */}
              {selectedTable === "orders" && dashboardData?.analytics?.labels?.length > 0 && (
                <View style={styles.tableGraphSection}>
                  <Text style={styles.tableGraphTitle}>Orders Performance</Text>
                  <AnimatedChartRevealer width={Dimensions.get("window").width - (sidebarCollapsed ? 140 : 380)} height={180} delay={100}>
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
                  </AnimatedChartRevealer>
                </View>
              )}

              {selectedTable === "users" && dashboardData?.analytics?.labels?.length > 0 && (
                <View style={styles.tableGraphSection}>
                  <Text style={styles.tableGraphTitle}>User Growth Trend</Text>
                  <AnimatedChartRevealer width={Dimensions.get("window").width - (sidebarCollapsed ? 140 : 380)} height={180} delay={100}>
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
                  </AnimatedChartRevealer>
                </View>
              )}

              <View style={styles.tableToolbar}>
                <View style={styles.toolbarTop}>
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
                    {(selectedTable === "products" || selectedTable !== "orders") && (
                      <Pressable 
                        style={styles.addBtn} 
                        onPress={() => {
                          setEditingItem(null);
                          if (selectedTable === "products") setIsModalOpen(true);
                          else {
                            setGenericFormData({});
                            setIsGenericModalOpen(true);
                          }
                        }}
                      >
                          <Ionicons name="add" size={20} color="white" />
                          <Text style={styles.addBtnText}>New {selectedTable?.replace(/s$/, "") || "Item"}</Text>
                      </Pressable>
                    )}
                    {selectedTable === "products" && (
                      <Pressable 
                        style={[styles.addBtn, { backgroundColor: colors.surface, marginLeft: 8, borderWidth: 1, borderColor: colors.accent }]} 
                        onPress={async () => {
                          try {
                            const catData = await apiRequest("/admin/data/tables/categories", { token });
                            if (catData && catData.rows) setCategories(catData.rows);
                          } catch(err) {
                            console.error(err);
                          }
                          setIsManageCategoriesOpen(true);
                        }}
                      >
                          <Ionicons name="folder-open" size={18} color={colors.ink} />
                          <Text style={[styles.addBtnText, { color: colors.ink }]}>Manage Categories</Text>
                      </Pressable>
                    )}
                    <Pressable style={styles.refreshBtn} onPress={() => pickTable(selectedTable)}>
                      <Ionicons name="refresh" size={16} color={colors.subtleText} />
                    </Pressable>
                  </View>
                </View>
                
                {selectedTable === "products" && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                    {HOME_SECTION_FILTERS.map((f) => (
                      <Pressable 
                        key={f.id} 
                        onPress={() => setActiveSectionFilter(f.id)}
                        style={[
                          styles.filterChip, 
                          activeSectionFilter === f.id && { backgroundColor: f.color, borderColor: f.color }
                        ]}
                      >
                        <Ionicons 
                          name={f.icon} 
                          size={14} 
                          color={activeSectionFilter === f.id ? "white" : colors.subtleText} 
                          style={{ marginRight: 6 }}
                        />
                        <Text style={[
                          styles.filterChipText, 
                          activeSectionFilter === f.id && { color: "white" }
                        ]}>
                          {f.label}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              <ScrollView horizontal={isMobile} showsHorizontalScrollIndicator={false}>
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
                      <View key={col.name} style={[styles.cell, { width: col.name === "visibility" ? 220 : 140 }]}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                          {col.name === "visibility" && selectedTable === "products" ? (
                            <View style={{ flexDirection: "column", gap: 4 }}>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_featured === 1 ? colors.accent + "1A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_featured === 1 ? colors.accent : colors.subtleText }]}>
                                  {row.is_featured === 1 ? "Showing on Home" : "Not on Home Screen"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_auspicious === 1 ? "#f59e0b1A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_auspicious === 1 ? "#f59e0b" : colors.subtleText }]}>
                                  {row.is_auspicious === 1 ? "In Auspicious" : "Not in Auspicious"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_banner_main === 1 ? "#3b82f61A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_banner_main === 1 ? "#3b82f6" : colors.subtleText }]}>
                                  {row.is_banner_main === 1 ? "Main Banner" : "Not Main Banner"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_banner_earrings === 1 ? "#ec48991A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_banner_earrings === 1 ? "#ec4899" : colors.subtleText }]}>
                                  {row.is_banner_earrings === 1 ? "Earrings Banner" : "Not in Earrings"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_banner_necklaces === 1 ? "#8b5cf61A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_banner_necklaces === 1 ? "#8b5cf6" : colors.subtleText }]}>
                                  {row.is_banner_necklaces === 1 ? "Necklace Banner" : "Not in Necklaces"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_popular_jewellery === 1 ? "#06b6d41A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_popular_jewellery === 1 ? "#06b6d4" : colors.subtleText }]}>
                                  {row.is_popular_jewellery === 1 ? "In Popular Jewellery" : "Not in Popular Jewellery"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_mens_shirts === 1 ? "#10b9811A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_mens_shirts === 1 ? "#10b981" : colors.subtleText }]}>
                                  {row.is_mens_shirts === 1 ? "In Men's Shirts" : "Not in Men's Shirts"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: row.is_womens_highlights === 1 ? "#f43f5e1A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: row.is_womens_highlights === 1 ? "#f43f5e" : colors.subtleText }]}>
                                  {row.is_womens_highlights === 1 ? "In Women's Highlights" : "Not in Women's Highlights"}
                                </Text>
                              </View>
                              <View style={[styles.statusBadge, { backgroundColor: (row.is_premium_sarees === 1 || row.is_flash_sale === 1) ? "#ec48991A" : "#f1f5f9" }]}>
                                <Text style={[styles.statusBadgeText, { color: (row.is_premium_sarees === 1 || row.is_flash_sale === 1) ? "#ec4899" : colors.subtleText }]}>
                                  {row.is_flash_sale === 1 ? "FLASH SALE" : (row.is_premium_sarees === 1 ? "In Premium Sarees" : "Not in Collection")}
                                </Text>
                              </View>
                            </View>
                          ) : (
                            <Text style={styles.cellText} numberOfLines={1}>
                               {row[col.name] === null ? "—" : String(row[col.name])}
                            </Text>
                          )}
                        </View>
                      </View>
                        ))}
                         <View style={[styles.cell, { width: selectedTable === "orders" ? 360 : 100, flexDirection: "row", gap: 12, flexWrap: "wrap", alignItems: "center" }]}>
                          {selectedTable === "products" ? (
                            <>
                              <Pressable onPress={() => setEditingItem(row)} hitSlop={8} title="Edit">
                                <Ionicons name="create-outline" size={18} color={colors.accent} />
                              </Pressable>
                              <Pressable 
                                onPress={() => handleToggleFlashSale(row.id, row.is_flash_sale)} 
                                hitSlop={8} 
                                title={row.is_flash_sale === 1 ? "Remove from Flash Sale" : "Add to Flash Sale"}
                              >
                                <Ionicons 
                                  name={row.is_flash_sale === 1 ? "flash" : "flash-outline"} 
                                  size={18} 
                                  color={row.is_flash_sale === 1 ? "#e03131" : colors.subtleText} 
                                />
                              </Pressable>
                              {activeSectionFilter !== "all" && (
                                <Pressable 
                                  onPress={() => handleQuickRemoveFromSection(row.id, activeSectionFilter)} 
                                  hitSlop={8}
                                  title="Remove from Section"
                                >
                                  <Ionicons name="close-circle-outline" size={18} color="#f43f5e" />
                                </Pressable>
                              )}
                              <Pressable onPress={() => handleDeleteProduct(row.id)} hitSlop={8} title="Delete">
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
                            <>
                              <Pressable onPress={() => {
                                setEditingItem(row);
                                setGenericFormData(row);
                                setIsGenericModalOpen(true);
                              }} hitSlop={8}>
                                <Ionicons name="create-outline" size={18} color={colors.accent} />
                              </Pressable>
                              <Pressable onPress={() => handleDeleteGenericEntry(row.id)} hitSlop={8}>
                                <Ionicons name="trash-outline" size={18} color={colors.danger} />
                              </Pressable>
                            </>
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
            </Animated.View>
          ) : (
            <Animated.View style={[styles.dashboardContainer, overviewPanelAnimatedStyle]}>
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
                      
                      const trendData = 
                        key.includes("earning") || key.includes("revenue") ? dashboardData?.analytics?.datasets?.revenue :
                        key.includes("order") ? dashboardData?.analytics?.datasets?.orders :
                        key.includes("user") ? dashboardData?.analytics?.datasets?.users :
                        key.includes("product") ? dashboardData?.analytics?.datasets?.products : [];

                      return (
                        <StatCardContainer
                          key={metric.label}
                          metric={metric}
                          isActive={isActive}
                          styleMeta={styleMeta}
                          onPress={handleMetricCardPress}
                          dashboardReveal={dashboardReveal}
                          data={trendData}
                        />
                      );
                    })}
                  </View>

                  <Animated.View style={[styles.chartCard, chartAnimatedStyle]}>
                    <View style={[styles.chartHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                      <View>
                        <Text style={styles.chartTitle}>Overview</Text>
                        <Text style={styles.chartSub}>Monthly performance for the current year</Text>
                      </View>
                      <View style={styles.chartTabsContainer}>
                         <Pressable 
                           onPress={() => setActiveMetric("Earnings")}
                           style={activeMetric.toLowerCase().includes("earning") ? styles.chartTabActive : styles.chartTab}
                         >
                           <Text style={activeMetric.toLowerCase().includes("earning") ? styles.chartTabTextActive : styles.chartTabText}>Revenue</Text>
                         </Pressable>
                         <Pressable 
                           onPress={() => setActiveMetric("Orders")}
                           style={activeMetric.toLowerCase().includes("order") ? styles.chartTabActive : styles.chartTab}
                         >
                           <Text style={activeMetric.toLowerCase().includes("order") ? styles.chartTabTextActive : styles.chartTabText}>Orders</Text>
                         </Pressable>
                         <Pressable 
                           onPress={() => setActiveMetric("Profit")} 
                           style={activeMetric.toLowerCase().includes("profit") ? styles.chartTabActive : styles.chartTab}
                         >
                           <Text style={activeMetric.toLowerCase().includes("profit") ? styles.chartTabTextActive : styles.chartTabText}>Profit</Text>
                         </Pressable>
                      </View>
                    </View>
                    <LineChart
                      data={{
                        labels: lineLabels.length ? lineLabels : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                        datasets: [{ data: displayChartData.length ? displayChartData : [10, 20, 15, 30, 25, 40, 35, 50, 45, 60, 55, 70] }],
                      }}
                      width={Math.max(340, Dimensions.get("window").width - (sidebarCollapsed ? 220 : 520))}
                      height={260}
                      chartConfig={{
                        ...chartConfigBase(selectedChartColor),
                        fillShadowGradientFrom: selectedChartColor,
                        fillShadowGradientFromOpacity: 0.2,
                        fillShadowGradientTo: "#ffffff",
                        fillShadowGradientToOpacity: 0,
                      }}
                      bezier
                      style={styles.chartStyle}
                    />
                  </Animated.View>

                  <View style={styles.chartsGrid}>
                    {/* Traffic Sources Pie Chart */}
                    <Animated.View style={[styles.chartCard, { flex: 1.5, minWidth: 380 }, chartAnimatedStyle]}>
                       <View style={styles.chartHeader}>
                          <Text style={styles.chartTitle}>Traffic Sources</Text>
                          <Text style={styles.chartSub}>Where your visitors come from</Text>
                       </View>
                       <PieChart
                          data={[
                            { name: "Direct", population: 35, color: "#10b981", legendFontColor: "#7F7F7F", legendFontSize: 12 },
                            { name: "Organic", population: 28, color: "#3b82f6", legendFontColor: "#7F7F7F", legendFontSize: 12 },
                            { name: "Referral", population: 22, color: "#f59e0b", legendFontColor: "#7F7F7F", legendFontSize: 12 },
                            { name: "Social", population: 15, color: "#6366f1", legendFontColor: "#7F7F7F", legendFontSize: 12 },
                          ]}
                          width={340}
                          height={200}
                          chartConfig={chartConfigBase("#10b981")}
                          accessor={"population"}
                          backgroundColor={"transparent"}
                          paddingLeft={"15"}
                          center={[0, 0]}
                          absolute
                          hasLegend={true}
                       />
                    </Animated.View>

                    {/* Monthly Goals Progress bars */}
                    <Animated.View style={[styles.chartCard, { flex: 1, minWidth: 300 }, chartAnimatedStyle]}>
                       <View style={styles.chartHeader}>
                          <Text style={styles.chartTitle}>Monthly Goals</Text>
                          <Text style={styles.chartSub}>Track progress toward targets</Text>
                       </View>
                       <View style={styles.goalsList}>
                          {[
                            { label: "Monthly Revenue", value: "88%", color: "#10b981", progress: 0.88 },
                            { label: "New Customers", value: "62%", color: "#3b82f6", progress: 0.62 },
                            { label: "Review Score", value: "94%", color: "#f59e0b", progress: 0.94 },
                          ].map(goal => (
                            <View key={goal.label} style={styles.goalItem}>
                               <View style={goal.label === "Review Score" ? { flexDirection: 'row', justifyContent: 'space-between' } : styles.goalHeader}>
                                  <Text style={styles.goalLabel}>{goal.label}</Text>
                                  <Text style={styles.goalValue}>{goal.value}</Text>
                               </View>
                               <View style={styles.progressBarBg}>
                                  <View style={[styles.progressBarFill, { width: goal.value, backgroundColor: goal.color }]} />
                                </View>
                            </View>
                          ))}
                       </View>
                    </Animated.View>

                    {/* NEW: Recent Reviews Widget */}
                    <Animated.View style={[styles.chartCard, { flex: 1.5, minWidth: 380, maxHeight: 400 }, chartAnimatedStyle]}>
                       <View style={[styles.chartHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                          <View>
                            <Text style={styles.chartTitle}>Recent Feedback</Text>
                            <Text style={styles.chartSub}>Latest customer reviews</Text>
                          </View>
                          <Pressable onPress={() => pickTable("product_reviews")}>
                             <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 13 }}>View All</Text>
                          </Pressable>
                       </View>
                       <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
                          {recentReviews.length === 0 ? (
                             <View style={{ padding: 20, alignItems: 'center' }}>
                                <Text style={{ color: colors.muted }}>No reviews yet</Text>
                             </View>
                          ) : (
                            recentReviews.map((rev) => (
                               <View key={rev.id} style={styles.reviewSnippet}>
                                  <View style={styles.reviewSnippetHeader}>
                                     <Text style={styles.reviewSnippetUser}>{rev.user_name}</Text>
                                     <View style={styles.reviewSnippetStars}>
                                        {[1,2,3,4,5].map(i => (
                                           <Ionicons key={i} name={i <= rev.rating ? "star" : "star-outline"} size={10} color="#ffa41c" />
                                        ))}
                                     </View>
                                  </View>
                                  <Text style={styles.reviewSnippetTitle} numberOfLines={1}>{rev.title}</Text>
                                  <Text style={styles.reviewSnippetText} numberOfLines={2}>{rev.comment}</Text>
                               </View>
                            ))
                          )}
                       </ScrollView>
                    </Animated.View>
                  </View>
                </>
              )}
            </Animated.View>
          )}
        </ScrollView>
      </View>

      {/* Product Modal */}
      {(isModalOpen || editingItem) && (
        <ProductModal 
          visible={isModalOpen || editingItem}
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

      <GenericEntryModal
        visible={isGenericModalOpen}
        tableName={selectedTable}
        columns={tableData.columns}
        formData={genericFormData}
        onClose={() => { setIsGenericModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
        onSave={handleSaveGenericEntry}
        onChange={setGenericFormData}
      />
      <ManageCategoriesModal
        visible={isManageCategoriesOpen}
        categories={categories}
        products={products}
        onClose={() => setIsManageCategoriesOpen(false)}
        onSave={handleSaveCategories}
      />
    </View>
  );
}

function ManageCategoriesModal({ visible, categories, products, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (visible && categories) {
      const initial = {};
      categories.forEach(cat => { initial[cat.id] = (cat.image_url && cat.image_url !== "null") ? String(cat.image_url) : ""; });
      setFormData(initial);
      if (categories.length > 0 && !activeCategoryId) setActiveCategoryId(categories[0].id);
    }
  }, [visible, categories]);

  if (!visible) return null;

  const handleSave = () => {
    const updates = categories
      .filter(cat => formData[cat.id] !== ((cat.image_url && cat.image_url !== "null") ? String(cat.image_url) : ""))
      .map(cat => ({ id: cat.id, image_url: formData[cat.id] }));
    if (updates.length === 0) { onClose(); return; }
    onSave(updates);
  };

  const activeCategory = categories.find(c => c.id === activeCategoryId);
  const filteredProducts = (products || []).filter(p => {
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (!activeCategory) return true;
    let filterCat = activeCategory.name;
    if (filterCat === "Women's Wear") filterCat = "Women";
    if (filterCat === "Men's Wear") filterCat = "Men";
    if (filterCat.toLowerCase() === "browse all") return true; 
    
    const pCat = p.category ? String(p.category).toLowerCase() : "";
    return pCat === filterCat.toLowerCase();
  });

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { 
        width: isMobile ? '95%' : 900, 
        height: isMobile ? '90%' : 600, 
        flexDirection: 'column', 
        padding: 0, 
        overflow: 'hidden' 
      }]}>
        <View style={[modalStyles.header, { padding: 20, borderBottomWidth: 1, borderColor: colors.border, marginBottom: 0 }]}>
          <Text style={modalStyles.title}>Manage Category Images</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <View style={{ flex: 1, flexDirection: isMobile ? 'column' : 'row' }}>
          {/* LEFT SIDEBAR: CATEGORIES */}
          <View style={{ 
            width: isMobile ? '100%' : 250, 
            height: isMobile ? 180 : 'auto',
            borderRightWidth: isMobile ? 0 : 1, 
            borderBottomWidth: isMobile ? 1 : 0,
            borderColor: colors.border, 
            backgroundColor: '#fcfcfd' 
          }}>
            <ScrollView showsVerticalScrollIndicator={false} horizontal={isMobile}>
              {(categories || []).map(cat => {
                 const isActive = cat.id === activeCategoryId;
                 return (
                   <Pressable
                     key={cat.id}
                     onPress={() => setActiveCategoryId(cat.id)}
                     style={{
                        padding: 16,
                        borderBottomWidth: isMobile ? 0 : 1,
                        borderRightWidth: isMobile ? 1 : 0,
                        borderColor: colors.border,
                        backgroundColor: isActive ? 'white' : 'transparent',
                        borderLeftWidth: isMobile ? 0 : 4,
                        borderBottomWidth: isMobile ? 4 : 0,
                        borderLeftColor: (isActive && !isMobile) ? colors.accent : 'transparent',
                        borderBottomColor: (isActive && isMobile) ? colors.accent : 'transparent',
                        flexDirection: isMobile ? 'row' : 'column',
                        minWidth: isMobile ? 140 : 'auto'
                     }}
                   >
                     <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                       <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9", marginRight: 10, overflow: 'hidden' }}>
                          {formData[cat.id] ? (
                            <Image source={{ uri: formData[cat.id] }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                          ) : (
                            <Ionicons name="image-outline" size={16} color={colors.muted} style={{ alignSelf: 'center', marginTop: 8 }} />
                          )}
                       </View>
                       <Text 
                         numberOfLines={1}
                         style={{ 
                           fontSize: 13,
                           fontWeight: isActive ? '700' : '500', 
                           color: isActive ? colors.ink : colors.subtleText, 
                           flex: 1 
                         }}
                       >
                         {cat.name}
                       </Text>
                     </View>
                   </Pressable>
                 )
              })}
            </ScrollView>
          </View>

          {/* RIGHT SIDEBAR: PRODUCTS PICKER */}
          <View style={{ flex: 1, backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
            {activeCategory ? (
              <>
                  <View style={{ 
                    flexDirection: isMobile ? 'column' : 'row', 
                    justifyContent: 'space-between', 
                    alignItems: isMobile ? 'flex-start' : 'center', 
                    padding: 16, 
                    gap: 12,
                    borderBottomWidth: 1, 
                    borderColor: "rgba(0,0,0,0.05)" 
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.ink }}>
                      Select image for <Text style={{ color: colors.accent }}>{activeCategory.name}</Text>
                    </Text>
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      backgroundColor: '#f1f5f9', 
                      borderRadius: 8, 
                      paddingHorizontal: 12,
                      width: isMobile ? '100%' : 'auto'
                    }}>
                       <Ionicons name="search" size={16} color={colors.muted} />
                       <TextInput
                          style={{ padding: 8, flex: isMobile ? 1 : 0, width: isMobile ? 'auto' : 200, fontSize: 13 }}
                          placeholder="Search products..."
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                       />
                    </View>
                 </View>

                 <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 }}>
                    {filteredProducts.map(product => {
                       const isSelected = formData[activeCategoryId] === product.image;
                       return (
                         <Pressable
                           key={product.id}
                           onPress={() => setFormData({ ...formData, [activeCategoryId]: product.image })}
                           style={{
                              width: isMobile ? '47%' : '23%',
                              aspectRatio: 1,
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: isSelected ? colors.accent : 'transparent',
                              overflow: 'hidden',
                              position: 'relative',
                              backgroundColor: '#f1f5f9'
                           }}
                         >
                           <Image source={{ uri: product.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                           {isSelected && (
                             <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: colors.accent, borderRadius: 12 }}>
                               <Ionicons name="checkmark-circle" size={24} color="white" />
                             </View>
                           )}
                           <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 4 }}>
                              <Text style={{ color: 'white', fontSize: 10, textAlign: 'center' }} numberOfLines={1}>{product.name}</Text>
                           </View>
                         </Pressable>
                       )
                    })}
                    {filteredProducts.length === 0 && (
                      <Text style={{ color: colors.muted, marginTop: 20, textAlign: 'center', width: '100%' }}>No products found.</Text>
                    )}
                 </ScrollView>
              </>
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                 <Ionicons name="images-outline" size={48} color={colors.muted} />
                 <Text style={{ marginTop: 16, color: colors.subtleText }}>Select a category on the left to pick its image</Text>
              </View>
            )}
          </View>
        </View>

        <View style={[modalStyles.footer, { padding: 20, borderTopWidth: 1, borderColor: colors.border, backgroundColor: 'white' }]}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Cancel</Text></Pressable>
          <Pressable style={modalStyles.saveBtn} onPress={handleSave}>
             <Text style={modalStyles.saveBtnText}>Save Images</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function GenericEntryModal({ visible, tableName, columns, formData, onClose, onSave, onChange }) {
  if (!visible) return null;

  const editableColumns = (columns || []).filter(c => 
    !["id", "created_at", "updated_at", "visibility"].includes(c.name.toLowerCase())
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '90%' : 450 }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{formData.id ? "Edit" : "New"} {tableName?.replace(/s$/, "") || "Entry"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
          {editableColumns.map((col) => {
            const label = col.name.replace(/_/g, " ").toUpperCase();
            const value = formData[col.name] !== undefined ? String(formData[col.name]) : "";
            const isBoolean = col.dataType?.toLowerCase().includes("tinyint") || col.name.startsWith("is_");

            return (
              <View key={col.name} style={{ marginBottom: 16 }}>
                <Text style={modalStyles.label}>{label}</Text>
                {isBoolean ? (
                  <View style={modalStyles.optionsRow}>
                    <Pressable 
                      style={[modalStyles.pill, formData[col.name] == 1 && modalStyles.pillActive]}
                      onPress={() => onChange({ ...formData, [col.name]: 1 })}
                    >
                      <Text style={[modalStyles.pillText, formData[col.name] == 1 && modalStyles.pillTextActive]}>Yes / Active</Text>
                    </Pressable>
                    <Pressable 
                      style={[modalStyles.pill, (formData[col.name] == 0 || !formData[col.name]) && modalStyles.pillActive]}
                      onPress={() => onChange({ ...formData, [col.name]: 0 })}
                    >
                      <Text style={[modalStyles.pillText, (formData[col.name] == 0 || !formData[col.name]) && modalStyles.pillTextActive]}>No / Inactive</Text>
                    </Pressable>
                  </View>
                ) : (
                  <TextInput
                    style={modalStyles.input}
                    value={value}
                    onChangeText={(val) => {
                      let finalVal = val;
                      if (col.dataType?.includes("int") || col.dataType?.includes("decimal")) {
                        finalVal = val.replace(/[^0-9.]/g, "");
                      }
                      onChange({ ...formData, [col.name]: finalVal });
                    }}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    multiline={col.dataType === "text"}
                    numberOfLines={col.dataType === "text" ? 4 : 1}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Cancel</Text></Pressable>
          <Pressable style={modalStyles.saveBtn} onPress={onSave}>
             <Text style={modalStyles.saveBtnText}>Save Changes</Text>
          </Pressable>
        </View>
      </View>
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
  const [isFeatured, setIsFeatured] = useState(Boolean(item?.is_featured));
  const [isAuspicious, setIsAuspicious] = useState(Boolean(item?.is_auspicious));
  const [isFlashSale, setIsFlashSale] = useState(Boolean(item?.is_flash_sale));
  const [isBannerMain, setIsBannerMain] = useState(Boolean(item?.is_banner_main));
  const [isBannerEarrings, setIsBannerEarrings] = useState(Boolean(item?.is_banner_earrings));
  const [isBannerNecklaces, setIsBannerNecklaces] = useState(Boolean(item?.is_banner_necklaces));
  const [isPopularJewellery, setIsPopularJewellery] = useState(Boolean(item?.is_popular_jewellery));
  const [isMensShirts, setIsMensShirts] = useState(Boolean(item?.is_mens_shirts));
  const [isWomensHighlights, setIsWomensHighlights] = useState(Boolean(item?.is_womens_highlights));
  const [isPremiumSarees, setIsPremiumSarees] = useState(Boolean(item?.is_premium_sarees));
  const [selColors, setSelColors] = useState([]); // would need mapping for existing
  const [selSizes, setSelSizes] = useState([]);   // would need mapping for existing

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 600 }]}>
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

          <Text style={modalStyles.label}>Visibility & Home Section</Text>
          <View style={modalStyles.optionsRow}>
             <Pressable 
              style={[modalStyles.pill, isFeatured && modalStyles.pillActive]}
              onPress={() => setIsFeatured(!isFeatured)}
             >
               <Ionicons name={isFeatured ? "home" : "home-outline"} size={14} color={isFeatured ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isFeatured && modalStyles.pillTextActive]}>
                 {isFeatured ? "Featured on Home" : "Not on Home Screen"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isAuspicious && modalStyles.pillActive]}
              onPress={() => setIsAuspicious(!isAuspicious)}
             >
               <Ionicons name={isAuspicious ? "star" : "star-outline"} size={14} color={isAuspicious ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isAuspicious && modalStyles.pillTextActive]}>
                 {isAuspicious ? "Auspicious Section" : "Not in Auspicious"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isBannerMain && modalStyles.pillActive]}
              onPress={() => setIsBannerMain(!isBannerMain)}
             >
               <Ionicons name={isBannerMain ? "image" : "image-outline"} size={14} color={isBannerMain ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isBannerMain && modalStyles.pillTextActive]}>
                 {isBannerMain ? "Main Banner" : "Not Main Banner"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isBannerEarrings && modalStyles.pillActive]}
              onPress={() => setIsBannerEarrings(!isBannerEarrings)}
             >
               <Ionicons name={isBannerEarrings ? "easel" : "easel-outline"} size={14} color={isBannerEarrings ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isBannerEarrings && modalStyles.pillTextActive]}>
                 {isBannerEarrings ? "Earrings Banner" : "Not Earrings"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isBannerNecklaces && modalStyles.pillActive]}
              onPress={() => setIsBannerNecklaces(!isBannerNecklaces)}
             >
               <Ionicons name={isBannerNecklaces ? "grid" : "grid-outline"} size={14} color={isBannerNecklaces ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isBannerNecklaces && modalStyles.pillTextActive]}>
                 {isBannerNecklaces ? "Necklace Banner" : "Not Necklace"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isPopularJewellery && modalStyles.pillActive]}
              onPress={() => setIsPopularJewellery(!isPopularJewellery)}
             >
               <Ionicons name={isPopularJewellery ? "diamond" : "diamond-outline"} size={14} color={isPopularJewellery ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isPopularJewellery && modalStyles.pillTextActive]}>
                 {isPopularJewellery ? "In Popular Jewellery" : "Not Popular Jewellery"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isMensShirts && modalStyles.pillActive]}
              onPress={() => setIsMensShirts(!isMensShirts)}
             >
               <Ionicons name={isMensShirts ? "shirt" : "shirt-outline"} size={14} color={isMensShirts ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isMensShirts && modalStyles.pillTextActive]}>
                 {isMensShirts ? "In Men's Shirts" : "Not in Men's Shirts"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isWomensHighlights && modalStyles.pillActive]}
              onPress={() => setIsWomensHighlights(!isWomensHighlights)}
             >
               <Ionicons name={isWomensHighlights ? "female" : "female-outline"} size={14} color={isWomensHighlights ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isWomensHighlights && modalStyles.pillTextActive]}>
                 {isWomensHighlights ? "In Women's Highlights" : "Not Women's Highlights"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isPremiumSarees && modalStyles.pillActive]}
              onPress={() => setIsPremiumSarees(!isPremiumSarees)}
             >
               <Ionicons name={isPremiumSarees ? "color-palette" : "color-palette-outline"} size={14} color={isPremiumSarees ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isPremiumSarees && modalStyles.pillTextActive]}>
                 {isPremiumSarees ? "In Premium Sarees" : "Not Premium Sarees"}
               </Text>
             </Pressable>

             <Pressable 
              style={[modalStyles.pill, isFlashSale && modalStyles.pillActive]}
              onPress={() => setIsFlashSale(!isFlashSale)}
             >
               <Ionicons name={isFlashSale ? "flash" : "flash-outline"} size={14} color={isFlashSale ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
               <Text style={[modalStyles.pillText, isFlashSale && modalStyles.pillTextActive]}>
                 {isFlashSale ? "FLASH SALE" : "Not Flash Sale"}
               </Text>
             </Pressable>
          </View>

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
             is_featured: isFeatured ? 1 : 0,
             is_auspicious: isAuspicious ? 1 : 0,
             is_banner_main: isBannerMain ? 1 : 0,
             is_banner_earrings: isBannerEarrings ? 1 : 0,
             is_banner_necklaces: isBannerNecklaces ? 1 : 0,
             is_popular_jewellery: isPopularJewellery ? 1 : 0,
             is_mens_shirts: isMensShirts ? 1 : 0,
             is_womens_highlights: isWomensHighlights ? 1 : 0,
             is_premium_sarees: isPremiumSarees ? 1 : 0,
             is_flash_sale: isFlashSale ? 1 : 0,
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
  mobileHeader: {
    height: 60,
    backgroundColor: colors.white,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    zIndex: 100,
  },
  mobileMenuBtn: { padding: 4 },
  mobileLogoText: { fontSize: 18, fontWeight: "900", color: colors.ink, letterSpacing: 1.5 },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#111822",
    height: "100%",
    paddingTop: spacing.xl,
    zIndex: 1000,
  },
  sidebarMobile: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    boxShadow: "10px 0px 30px rgba(0,0,0,0.3)",
  },
  sidebarBackdrop: {
    position: "absolute",
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 900,
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
    padding: spacing.md,
    paddingBottom: 100,
  },
  dashboardContainer: {
    gap: 16,
  },
  dashboardGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    flex: 1,
    minWidth: 280,
    minHeight: 180,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    overflow: "hidden",
    justifyContent: "space-between",
    marginRight: 10,
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.03)", transition: "all 0.3s ease" } : {}),
  },
  statCardHeader: {
    padding: 20,
    paddingBottom: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statLabel: {
    fontSize: 13,
    color: colors.subtleText,
    fontWeight: "700",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
    marginTop: 8,
    letterSpacing: -0.5,
  },
  statTrend: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 6,
    fontWeight: "600",
  },
  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  miniChartContainer: {
    height: 70,
    marginTop: 20,
    alignItems: "center",
  },
  statCardActive: {
    backgroundColor: "#ffffff",
  },
  activeIndicator: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.accent,
    textTransform: "uppercase",
    marginTop: 8,
    letterSpacing: 0.5,
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
    ...(Platform.OS === "web" ? { boxShadow: "0 8px 20px rgba(13, 87, 49, 0.08)" } : {}),
  },
  tableToolbar: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    gap: 12,
  },
  toolbarTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filterChipsRow: {
    paddingVertical: 4,
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.subtleText,
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
  contentHeaderTitleGroup: {
    gap: 2,
  },
  contentTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  contentSubtitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.accent,
    textTransform: "uppercase",
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
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    flex: 1,
    minHeight: 320,
    justifyContent: "space-between",
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 40px -8px rgba(0,0,0,0.06)" } : {}),
  },
  chartHeader: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  chartTabsContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 4,
  },
  chartTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  chartTabActive: {
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    ...(Platform.OS === "web" ? { boxShadow: "0 2px 4px rgba(0,0,0,0.05)" } : {}),
  },
  chartTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.subtleText,
  },
  chartTabTextActive: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.ink,
  },
  chartSub: {
    fontSize: 12,
    color: colors.subtleText,
    marginTop: 4,
  },
  goalsList: {
    marginTop: 10,
    gap: 20,
  },
  goalItem: {
    gap: 8,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  goalLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.ink,
  },
  goalValue: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.subtleText,
  },
  miniBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: Platform.OS === "web" ? -44 : -40, // Pull chart to the left to align Y-axis labels with container edge
    paddingRight: 0,
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
  reviewSnippet: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  reviewSnippetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  reviewSnippetUser: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink,
  },
  reviewSnippetStars: {
    flexDirection: 'row',
    gap: 1,
  },
  reviewSnippetTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  reviewSnippetText: {
    fontSize: 11,
    color: colors.subtleText,
    lineHeight: 16,
  },
});
