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
import AdminSidebar from "../components/AdminSidebar";
import POSView from "../components/POSView";
import DraftView from "../components/DraftView";
import POSSalesView from "../components/POSSalesView";

const SIDEBAR_WIDTH = 280;
const SIDEBAR_BG = "#f8f9fa";
const SIDEBAR_ACTIVE_BG = "rgba(13, 87, 49, 0.08)";
const TABLE_HEADER_BG = "#f4f6f8";

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

// Manual constants removed - now fetched from API
const INDIAN_STATES = []; 
const GENDER_OPTIONS = [];
const USER_CATEGORIES = [];
const ORDER_LIFECYCLE_OPTIONS = [];
const ORDER_ANALYTICS_STAGES = [];
const APPROVED_COLORS = [];
const APPROVED_SIZES = [];
const APPROVED_UNITS = [];

const APPROVED_UNIT_COLUMNS = [
  { name: "id", dataType: "int" },
  { name: "name", dataType: "varchar" },
  { name: "is_active", dataType: "tinyint" },
];

const APPROVED_SHOP_COLUMNS = [
  { name: "id", dataType: "int" },
  { name: "name", dataType: "varchar" },
  { name: "email", dataType: "varchar" },
  { name: "phone", dataType: "varchar" },
  { name: "is_active", dataType: "tinyint" },
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
          ],
        },
        isActive && { zIndex: 10 }
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(metric.label)}
        style={[
          styles.statCard,
          { borderLeftWidth: 4, borderLeftColor: styleMeta.color }
        ]}
      >
        <View style={styles.statCardHeader}>
          <View>
            <Text style={styles.statValue}>{metric.value}</Text>
            <Text style={styles.statLabel}>{metric.label}</Text>
          </View>
          <View style={[styles.statIconContainer, { backgroundColor: `${styleMeta.color}1A` }]}>
            <Ionicons name={styleMeta.icon} size={22} color={styleMeta.color} />
          </View>
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

function formatCurrency(value) {
  return `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;
}

function formatCompactNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));
}

const sanitizeTableData = (data) => {
  if (!data) return {};
  const cleaned = { ...data };
  // Remove read-only, calculated or virtual fields that backends often reject during updates
  const toRemove = [
    "product_count", 
    "order_count", 
    "category_name", 
    "user_name",
    "user_email",
    "visibility"
  ];
  toRemove.forEach(field => {
    delete cleaned[field];
  });
  return cleaned;
};

export default function AdminPanelScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const navigation = useNavigation();
  const { user, token, logout } = useAuth();
  const { products, reloadProducts } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionFilter, setActiveSectionFilter] = useState("all");
  const [activeOrderStatusFilter, setActiveOrderStatusFilter] = useState("all_orders");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageShopsOpen, setIsManageShopsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [genericFormData, setGenericFormData] = useState({});
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ rows: [], columns: [] });
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStock, setSelectedStock] = useState("all");
  const [expandedMenus, setExpandedMenus] = useState({ "All Orders": true, "Categories": true });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [orderStatusUpdatingKey, setOrderStatusUpdatingKey] = useState("");

  const [metadata, setMetadata] = useState({
    categories: [],
    indianStates: [],
    genders: [],
    orderStatuses: [],
    homeFilters: [],
    sizes: [],
    units: [],
    colors: []
  });

  const toggleMenu = (menuLabel) => {
    setExpandedMenus(prev => ({ ...prev, [menuLabel]: !prev[menuLabel] }));
  };
  const emptyDashboard = {
    metrics: [
      { label: "Earnings", value: "Rs 0" },
      { label: "Products", value: "0" },
      { label: "Orders", value: "0" },
      { label: "Users", value: "0" },
    ],
    analytics: {
      labels: [],
      datasets: {
        revenue: [],
        products: [],
        orders: [],
        users: [],
      }
    },
    categoryDistribution: [],
    recentOrders: [],
    topProducts: [],
  };

  const [dashboardData, setDashboardData] = useState(emptyDashboard);
  const [activeMetric, setActiveMetric] = useState("Earnings");
  const [displayChartData, setDisplayChartData] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [recentReviews, setRecentReviews] = useState([]);
  const [statusUpdatingKey, setStatusUpdatingKey] = useState("");
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
        const metaRes = await apiRequest("/admin/data/metadata", { token });
        if (metaRes && metaRes.metadata) {
          setMetadata(metaRes.metadata);
          setCategories(metaRes.metadata.categories || []);
          setAvailableColors(metaRes.metadata.colors || []);
          setAvailableSizes(metaRes.metadata.sizes || []);
        }
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
    setActiveOrderStatusFilter("all_orders"); // Reset order filter
    try {
      const limitParam = tableName === "products" ? "?limit=1000&orderColumn=id&orderType=DESC" : "";
      let data = await apiRequest(`/admin/data/tables/${tableName}${limitParam}`, { token });
      
      if (tableName === "products" && data.columns) {
        // Add virtual visibility column if it doesn't exist
        if (!data.columns.find(c => c.name === "visibility")) {
          data.columns.push({ name: "visibility", dataType: "virtual" });
        }
      }
      if (Array.isArray(data)) {
        setTableData({ 
          columns: tableData?.columns || [], 
          rows: data 
        });
      } else {
        setTableData(data || { columns: [], rows: [] });
      }
    } catch (err) {
      console.error("Failed to load table content:", err);
      setTableData({ columns: [], rows: [] });
    } finally {
      setContentLoading(false);
    }
  };

  const handleSystemSync = async () => {
    try {
      setContentLoading(true);
      const res = await apiRequest("/admin/data/seed", {
        method: "POST",
        token,
      });
      if (res.success) {
        Alert.alert("Success", "Database synchronized successfully! All catalogs (Colors, Sizes, Units, Shops) are updated.");
        const tablesData = await apiRequest("/admin/data/tables", { token });
        setTables(tablesData.tables || []);
        // Refresh metadata after seed
        const metaRes = await apiRequest("/admin/data/metadata", { token });
        if (metaRes && metaRes.metadata) {
          setMetadata(metaRes.metadata);
          setCategories(metaRes.metadata.categories || []);
          setAvailableColors(metaRes.metadata.colors || []);
          setAvailableSizes(metaRes.metadata.sizes || []);
        }
      } else {
        Alert.alert("Error", "Synchronization failed: " + (res.message || "Unknown error"));
      }
    } catch (err) {
      Alert.alert("Error", "Error during synchronization: " + err.message);
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

    // 3. Category filter (for products table only)
    let matchesCategory = true;
    if (selectedTable === "products" && selectedCategory) {
      matchesCategory = String(row.category_id) === String(selectedCategory);
    }

    // 4. Stock filter (for products table only)
    let matchesStock = true;
    if (selectedTable === "products" && selectedStock !== "all") {
      if (selectedStock === "in_stock") matchesStock = row.stock > 0;
      else if (selectedStock === "out_of_stock") matchesStock = row.stock <= 0;
    }

    // 5. Order Status filter
    let matchesOrderStatus = true;
    if (selectedTable === "orders" && activeOrderStatusFilter !== "all_orders") {
        const rowStatus = String(row.order_status || "").toLowerCase().replace(/_/g, ' ').replace('/', '').trim();
        const filterVal = activeOrderStatusFilter.toLowerCase().replace(/_/g, ' ').replace('/', '').trim();
        
        if (filterVal === "pickup") {
            matchesOrderStatus = rowStatus === "pickup" || rowStatus === "packed";
        } else if (filterVal === "on the way") {
            matchesOrderStatus = rowStatus === "on the way" || rowStatus === "shipped" || rowStatus === "out for delivery";
        } else {
            matchesOrderStatus = rowStatus === filterVal;
        }
    }

    return matchesSearch && matchesSection && matchesCategory && matchesStock && matchesOrderStatus;
  });

  const displayRows =
    selectedTable === "colors" && filteredRows.length === 0 && !searchQuery
      ? APPROVED_COLORS
      : filteredRows;

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
      Alert.alert("Error", "Failed to save product: " + err.message);
    }
  };

  const handleDeleteProduct = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(`/products/${id}`, { method: "DELETE", token });
              pickTable("products");
              reloadProducts();
            } catch (err) {
              Alert.alert("Error", "Delete failed: " + err.message);
            }
          }
        }
      ]
    );
  }

  const handleSaveGenericEntry = async () => {
    try {
      const endpoint = editingItem
        ? `/admin/data/tables/${selectedTable}/${editingItem.id}`
        : `/admin/data/tables/${selectedTable}`;
      const method = editingItem ? "PUT" : "POST";

      const res = await apiRequest(endpoint, {
        method,
        body: sanitizeTableData(genericFormData),
        token
      });

      Alert.alert("Success", editingItem ? "Updated successfully" : "Created successfully");
      pickTable(selectedTable);
      setIsGenericModalOpen(false);
      setEditingItem(null);
      setGenericFormData({});
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
      const metaRes = await apiRequest("/admin/data/metadata", { token });
      if (metaRes && metaRes.metadata) {
        setMetadata(metaRes.metadata);
        setCategories(metaRes.metadata.categories || []);
      }
      Alert.alert("Success", "Categories updated successfully!");
      setIsManageCategoriesOpen(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Failed to update categories.");
    }
  };

  const handleDeleteGenericEntry = (id) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete this record from ${selectedTable}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
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
          }
        }
      ]
    );
  };

  const handleToggleTableStatus = async (row, fieldName = "is_active") => {
    if (!row?.id || !selectedTable) return;

    const updateKey = `${selectedTable}:${row.id}:${fieldName}`;
    const nextValue = Number(row[fieldName]) === 1 ? 0 : 1;
    setStatusUpdatingKey(updateKey);

    try {
      const res = await apiRequest(`/admin/data/tables/${selectedTable}/${row.id}`, {
        method: "PUT",
        token,
        body: { [fieldName]: nextValue },
      });

      if (res && res.success) {
        setTableData((prev) => ({
          ...prev,
          rows: (prev?.rows || []).map((item) =>
            item.id === row.id ? { ...item, [fieldName]: nextValue } : item
          ),
        }));
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      Alert.alert("Error", "Failed to update status");
    } finally {
      setStatusUpdatingKey("");
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

  const SIDEBAR_STRUCTURE = [
    {
      header: "MAIN",
      items: [{ name: "dashboard", label: "Dashboard", icon: "stats-chart-outline", table: null }]
    },
    {
      header: "POS MANAGEMENT",
      items: [
        { name: "pos", label: "POS", icon: "hardware-chip-outline", table: null },
        { name: "draft", label: "Draft", icon: "layers-outline", table: null },
        { name: "pos_sales", label: "POS Sales", icon: "wallet-outline", table: null },
      ]
    },
    {
      header: "ORDER HANDLING",
      items: [
        {
          name: "orders",
          label: "All Orders",
          icon: "receipt-outline",
          subItems: [
            { name: "all_orders", label: "All", count: dashboardData?.businessOverview?.orders || 0, countColor: "#94a3b8", table: "orders" },
            { name: "pending", label: "Pending", count: dashboardData?.orderAnalytics?.pending || 0, countColor: "#f59e0b", table: "orders" },
            { name: "confirm", label: "Confirm", count: dashboardData?.orderAnalytics?.confirm || 0, countColor: "#38bdf8", table: "orders" },
            { name: "processing", label: "Processing", count: dashboardData?.orderAnalytics?.processing || 0, countColor: "#a855f7", table: "orders" },
            { name: "pickup", label: "Pickup", count: dashboardData?.orderAnalytics?.pickup || 0, countColor: "#64748b", table: "orders" },
            { name: "on_the_way", label: "On The Way", count: dashboardData?.orderAnalytics?.onTheWay || 0, countColor: "#475569", table: "orders" },
            { name: "delivered", label: "Delivered", count: dashboardData?.orderAnalytics?.delivered || 0, countColor: "#10b981", table: "orders" },
            { name: "cancelled", label: "Cancelled", count: dashboardData?.orderAnalytics?.cancelled || 0, countColor: "#ef4444", table: "orders" },
          ]
        }
      ]
    },
    {
      header: "PRODUCT MANAGEMENT",
      items: [
        {
          name: "categories_menu",
          label: "Categories",
          icon: "file-tray-full-outline",
          subItems: [
            { name: "category", label: "Category", table: "categories" },
            { name: "sub_category", label: "Sub Category", table: "sub_categories" }
          ]
        },
        { name: "products", label: "Products", icon: "diamond-outline", table: "products" },
      ]
    },
    {
      header: "PRODUCT VARIANTS",
      items: [
        { name: "brand", label: "Brand", icon: "ribbon-outline", table: "brands" },
        { name: "specification", label: "Specification", icon: "list-outline", table: "specifications" },
        { name: "specification_values", label: "Specification Values", icon: "options-outline", table: "specificationvalues" },
        { name: "colors", label: "Color", icon: "color-palette-outline", table: "colors" },
        { name: "sizes", label: "Sizes", icon: "resize-outline", table: "sizes" },
        { name: "unit", label: "Unit", icon: "scale-outline", table: "units" },
      ]
    },
    {
      header: "MANAGE SHOP",
      items: [
        { name: "all_shops", label: "All Shops", icon: "storefront-outline", table: "shops" },
        {
          name: "shop_products",
          label: "Shop Products",
          icon: "basket-outline",
          subItems: [
            { name: "item_request", label: "Item Request", table: "products" },
            { name: "update_request", label: "Update Request", table: "products" },
            { name: "accepted_item", label: "Accepted Item", table: "products" }
          ]
        },
        { name: "flash_sales", label: "Flash Sales", icon: "flash-outline", table: "flash_sales" },
      ]
    },
    {
      header: "USER SUPERVISION",
      items: [
        { name: "riders", label: "Riders", icon: "bicycle-outline", table: "drivers" },
        { name: "customers", label: "Customers", icon: "people-outline", table: "users" },
        { name: "employees", label: "Employees", icon: "person-outline", table: "admin_users" },
      ]
    },
    {
      header: "MARKETING PROMOTIONS",
      items: [
        { name: "promotional_banner", label: "Promotional Banner", icon: "image-outline", table: "banners" },
        { name: "ads", label: "Ads", icon: "megaphone-outline", table: "ads" },
        { name: "promo_code", label: "Promo Code", icon: "ticket-outline", table: "coupons" },
        { name: "push_notification", label: "Push Notification", icon: "notifications-outline", table: "notifications" },
        { name: "blogs", label: "Blogs", icon: "create-outline", table: "blogs" },
      ]
    },
    {
      header: "ACCOUNTS",
      items: [
        { name: "withdraws", label: "Withdraws", icon: "cash-outline", table: "withdraws" },
      ]
    },
    {
      header: "DATABASE & REVIEWS",
      items: [
        { name: "reviews", label: "Reviews", icon: "star-half-outline", table: "reviews" },
      ]
    },
    {
      header: "ASSISTANCE/ SUPPORT",
      items: [
        { name: "help_requests", label: "Help Requests", icon: "help-buoy-outline", table: "support_tickets" },
        { name: "enquires", label: "Enquires", icon: "chatbubble-ellipses-outline", table: "contact_us" },
      ]
    },
    {
      header: "LANGUAGE SETTINGS",
      items: [
        { name: "languages", label: "Languages", icon: "language-outline", table: "languages" },
      ]
    },
    {
      header: "STORE MANAGEMENT",
      items: [
        { name: "shop_profile", label: "Shop Profile", icon: "person-circle-outline", table: "shops" },
      ]
    },
    {
      header: "IMPORT / EXPORT",
      items: [
        { name: "bulk_export", label: "Bulk Export", icon: "download-outline", table: null },
        { name: "bulk_import", label: "Bulk Import", icon: "push-outline", table: null },
        { name: "gallery_import", label: "Gallery Import", icon: "images-outline", table: "galleries" },
      ]
    },
    {
      header: "BUSINESS ADMINISTRATION",
      items: [
        {
          name: "business_settings",
          label: "Business Settings",
          icon: "settings-outline",
          subItems: [
            { name: "general_settings", label: "General Settings", table: "generate_settings" },
            { name: "business_setup", label: "Business Setup", table: "generate_settings" },
            { name: "manage_verification", label: "Manage Verification", table: "verify_manages" },
            { name: "currency", label: "Currency", table: "currencies" },
            { name: "delivery_charge", label: "Delivery Charge", table: "delivery_charges" },
            { name: "vat_tax", label: "VAT & Tax", table: "vat_taxes" },
            { name: "theme_colors", label: "Theme Colors", table: "theme_colors" },
            { name: "social_links", label: "Social Links", table: "social_links" },
            { name: "ticket_issue_types", label: "Ticket Issue Types", table: "ticket_issue_types" },
          ]
        },
        { name: "roles_permissions", label: "Roles & Permissions", icon: "key-outline", table: "roles" },
        {
          name: "legal_pages",
          label: "Legal Pages",
          icon: "document-lock-outline",
          subItems: [
            { name: "privacy_policy", label: "Privacy Policy", table: "legal_pages" },
            { name: "terms_of_service", label: "Terms of Service", table: "legal_pages" },
            { name: "return_policy", label: "Return policy / Refund Policy", table: "legal_pages" },
            { name: "shipping_delivery_policy", label: "Shipping and Delivery Policy", table: "legal_pages" },
            { name: "about_us", label: "About Us", table: "legal_pages" },
            { name: "contact_us", label: "Contact Us", table: "contact_us" },
            { name: "payment_gateway", label: "Payment Gateway", table: "payment_gateways" },
            { name: "sms_gateway", label: "SMS Gateway", table: "s_m_s_configs" },
            { name: "pusher_setup", label: "Pusher Setup", table: "generate_settings" },
            { name: "mail_config", label: "Mail Config", table: "generate_settings" },
            { name: "firebase_notification", label: "Firebase Notification", table: "generate_settings" },
            { name: "google_recaptcha", label: "Google ReCaptcha", table: "google_re_captchas" },
          ]
        },
      ]
    }
  ];

  const orderBreakdownCards = [
    { key: "pending", label: "Pending", value: dashboardData?.orderAnalytics?.pending || 0, color: "#64748b", bg: "#f8fafc", icon: "time-outline" },
    { key: "confirm", label: "Confirm", value: dashboardData?.orderAnalytics?.confirm || 0, color: "#10b981", bg: "#ecfdf5", icon: "checkmark-circle-outline" },
    { key: "processing", label: "Processing", value: dashboardData?.orderAnalytics?.processing || 0, color: "#3b82f6", bg: "#eff6ff", icon: "sync-outline" },
    { key: "pickup", label: "Pickup", value: dashboardData?.orderAnalytics?.pickup || 0, color: "#f59e0b", bg: "#fffbeb", icon: "cube-outline" },
    { key: "on_the_way", label: "On The Way", value: dashboardData?.orderAnalytics?.onTheWay || 0, color: "#8b5cf6", bg: "#f5f3ff", icon: "bicycle-outline" },
    { key: "delivered", label: "Delivered", value: dashboardData?.orderAnalytics?.delivered || 0, color: "#059669", bg: "#ecfdf5", icon: "checkmark-done-outline" },
    { key: "cancelled", label: "Cancelled", value: dashboardData?.orderAnalytics?.cancelled || 0, color: "#ef4444", bg: "#fef2f2", icon: "close-circle-outline" },
  ];

  const metricSeriesByLabel = {
    earnings: dashboardData?.analytics?.datasets?.revenue || [],
    products: dashboardData?.analytics?.datasets?.products || [],
    orders: dashboardData?.analytics?.datasets?.orders || [],
    users: dashboardData?.analytics?.datasets?.users || [],
  };

  const recentOrders = Array.isArray(dashboardData?.recentOrders) ? dashboardData.recentOrders : [];
  const topProducts = Array.isArray(dashboardData?.topProducts) ? dashboardData.topProducts : [];
  const dashboardPeriod = dashboardData?.meta?.period || "Live Data";

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Preparing Admin Dashboard...</Text>
      </View>
    );
  }

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
      <AdminSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        isMobile={isMobile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        expandedMenus={expandedMenus}
        toggleMenu={toggleMenu}
        selectedTable={selectedTable}
        activeView={activeView}
        pickTable={pickTable}
        setActiveView={setActiveView}
        setSelectedTable={setSelectedTable}
        setSearchQuery={setSearchQuery}
        logout={logout}
        dashboardData={dashboardData}
        colors={colors}
        activeOrderStatusFilter={activeOrderStatusFilter}
        setActiveOrderStatusFilter={setActiveOrderStatusFilter}
      />

      {isMobile && isSidebarOpen && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999,
          }}
          onPress={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.contentHeader}>
          <View>
            <View style={styles.contentHeaderTitleGroup}>
              <Text style={styles.contentTitle}>
                {selectedTable
                  ? `${selectedTable.charAt(0).toUpperCase() + selectedTable.slice(1)} Management`
                  : activeView === "pos"
                    ? "POS Terminal"
                    : activeView === "draft"
                      ? "POS Drafts"
                      : activeView === "pos_sales"
                        ? "POS Sales History"
                        : "Dashboard Overview"}
              </Text>
              {selectedTable && tableData?.rows && (
                <Text style={styles.contentSubtitle}>
                  Showing {displayRows.length} of {selectedTable === "colors" && (!tableData?.rows || tableData.rows.length === 0) ? APPROVED_COLORS.length : (tableData?.rows?.length || 0)} total records
                </Text>
              )}
            </View>
            <Text style={styles.contentSub}>
              {selectedTable
                ? `Viewing all records from ${selectedTable} table.`
                : activeView === "pos"
                  ? "Process new in-store orders efficiently."
                  : activeView === "draft"
                    ? "Resume or delete saved point-of-sale sessions."
                    : activeView === "pos_sales"
                      ? "Review all completed terminal transactions."
                      : "Welcome back to your administration suite."}
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

        {activeView === "pos" ? (
          <View style={[styles.contentScroll, { flex: 1, backgroundColor: "#f8fafc" }]}>
             <POSView colors={colors} token={token} apiRequest={apiRequest} />
          </View>
        ) : (
        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentPadding}>
          {contentLoading ? (
            <View style={styles.tableCardLoading}>
              <ActivityIndicator color={colors.accent} />
              <Text style={styles.loadingDataText}>Optimizing records...</Text>
            </View>
          ) : activeView === "draft" ? (
            <DraftView colors={colors} token={token} apiRequest={apiRequest} setActiveView={setActiveView} />
          ) : activeView === "pos_sales" ? (
            <POSSalesView colors={colors} token={token} apiRequest={apiRequest} />
          ) : selectedTable && tableData ? (
            <Animated.View style={[styles.tableCard, overviewPanelAnimatedStyle]}>
              {/* Context Specific Graphs for Tables */}
              {selectedTable === "orders" && dashboardData?.analytics?.labels?.length > 0 && (
                <View style={styles.tableGraphSection}>
                  <Text style={styles.tableGraphTitle}>Orders Performance</Text>
                  <AnimatedChartRevealer width={width - (sidebarCollapsed ? 140 : 380)} height={180} delay={100}>
                    <BarChart
                      data={{
                        labels: dashboardData.analytics.labels,
                        datasets: [{ data: dashboardData.analytics.datasets.orders }]
                      }}
                      width={width - (sidebarCollapsed ? 140 : 380)}
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
                  <AnimatedChartRevealer width={width - (sidebarCollapsed ? 140 : 380)} height={180} delay={100}>
                    <LineChart
                      data={{
                        labels: dashboardData.analytics.labels,
                        datasets: [{ data: dashboardData.analytics.datasets.users }]
                      }}
                      width={width - (sidebarCollapsed ? 140 : 380)}
                      height={180}
                      chartConfig={chartConfigBase(colors.highlight)}
                      bezier
                      style={styles.tableGraphStyle}
                    />
                  </AnimatedChartRevealer>
                </View>
              )}

              {selectedTable === "products" && (
                <View style={styles.filterSection}>
                  <Text style={styles.sectionTitle}>Filter Products</Text>
                  <View style={{ flexDirection: isMobile ? "column" : "row", gap: 16 }}>
                    <View style={styles.filterGroup}>
                      <Text style={styles.filterLabel}>Category</Text>
                      <View style={styles.filterPicker}>
                        <Text style={{ fontSize: 13, color: colors.ink }}>{selectedCategory ? categories.find(c => String(c.id) === String(selectedCategory))?.name : "All Categories"}</Text>
                      </View>
                    </View>

                    <View style={styles.filterGroup}>
                      <Text style={styles.filterLabel}>Stock Status</Text>
                      <View style={styles.filterPicker}>
                        <Text style={{ fontSize: 13, color: colors.ink }}>{selectedStock === "all" ? "All Status" : (selectedStock === "in_stock" ? "In Stock" : "Out of Stock")}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.filterActionRow}>
                    <Pressable
                      style={styles.resetBtn}
                      onPress={() => {
                        setSelectedCategory("");
                        setSelectedStock("all");
                        setSearchQuery("");
                        setActiveSectionFilter("all");
                      }}
                    >
                      <Text style={styles.resetBtnText}>Reset Filters</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
                 <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' }}>
                   {selectedTable ? `${selectedTable.replace(/_/g, ' ').replace('specificationvalues', 'specification values')} List` : "Data Records"}
                 </Text>
                 <View style={{ backgroundColor: "rgba(13, 87, 49, 0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 12 }}>
                   <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>{displayRows.length} Items</Text>
                 </View>
              </View>

              <View style={styles.tableToolbar}>
                <View style={styles.toolbarTop}>
                  <View style={styles.searchContainer}>
                    <Ionicons name="search" size={18} color={colors.muted} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search anything..."
                      placeholderTextColor="#94a3b8"
                      value={searchQuery}
                      onChangeText={(txt) => {
                        setSearchQuery(txt);
                        setCurrentPage(1); // Reset to page 1 on search
                      }}
                    />
                  </View>
                  <View style={styles.toolbarActions}>
                    {(selectedTable === "products" || selectedTable !== "orders") && (
                      <Pressable
                        style={[styles.addBtn, { backgroundColor: "#0d5731", borderRadius: 8, paddingHorizontal: 16 }]}
                        onPress={() => {
                          setEditingItem(null);
                          if (selectedTable === "products") setIsModalOpen(true);
                          else {
                            setGenericFormData({});
                            setIsGenericModalOpen(true);
                          }
                        }}
                      >
                        <Ionicons name="add-circle" size={18} color="white" />
                        <Text style={[styles.addBtnText, { fontWeight: "700" }]}>Create New</Text>
                      </Pressable>
                    )}
                    {selectedTable === "products" && (
                      <Pressable
                        style={[styles.addBtn, { backgroundColor: colors.surface, marginLeft: 8, borderWidth: 1, borderColor: colors.accent }]}
                        onPress={async () => {
                          try {
                            const metaRes = await apiRequest("/admin/data/metadata", { token });
                            if (metaRes && metaRes.metadata) setCategories(metaRes.metadata.categories || []);
                          } catch (err) {
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

                {selectedTable === "products" && metadata.homeFilters && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                    <Pressable
                        onPress={() => setActiveSectionFilter("all")}
                        style={[
                          styles.filterChip,
                          activeSectionFilter === "all" && { backgroundColor: colors.accent, borderColor: colors.accent }
                        ]}
                      >
                        <Ionicons name="grid-outline" size={14} color={activeSectionFilter === "all" ? "white" : colors.subtleText} style={{ marginRight: 6 }} />
                        <Text style={[styles.filterChipText, activeSectionFilter === "all" && { color: "white" }]}>All Products</Text>
                    </Pressable>
                    {metadata.homeFilters.map((f) => (
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

              <View style={styles.tableHeader}>
                <View style={styles.contentHeaderTitleGroup}>
                  <Text style={styles.tableTitle}>{String(selectedTable || "Overview").replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                  <Text style={styles.tableSubtitle}>
                    {selectedTable === "shops" ? "Manage your store locations and vendor information." : `Manage your ${String(selectedTable || "").replace(/_/g, ' ')} and operational data.`}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                  {selectedTable === "shops" && (
                    <View style={styles.viewToggle}>
                      <Pressable style={[styles.toggleBtn, styles.toggleBtnActive]}>
                        <Ionicons name="grid-outline" size={18} color="white" />
                      </Pressable>
                      <Pressable style={styles.toggleBtn}>
                        <Ionicons name="list-outline" size={18} color={colors.subtleText} />
                      </Pressable>
                    </View>
                  )}
                  <Pressable 
                    style={styles.createBtn}
                    onPress={() => {
                      setEditingItem({});
                      setGenericFormData({});
                      if (selectedTable === "products") setIsModalOpen(true);
                      else if (selectedTable === "shops") setIsManageShopsOpen(true);
                      else setIsGenericModalOpen(true);
                    }}
                  >
                    <Ionicons name="add-circle" size={20} color="white" />
                    <Text style={styles.createBtnText}>Create New {selectedTable === "shops" ? "Shop" : "Record"}</Text>
                  </Pressable>
                </View>
              </View>

              {selectedTable === "shops" ? (
                <View style={styles.shopsGrid}>
                  {filteredRows.map((shop) => (
                    <View key={shop.id} style={styles.shopCard}>
                      <View style={styles.shopCardBanner}>
                        <Image source={{ uri: shop.banner_url }} style={styles.shopBannerImg} />
                        <View style={styles.shopCardOverlay}>
                          <Pressable 
                            style={styles.shopActionBtn} 
                            onPress={() => {
                              setEditingItem(shop);
                              setGenericFormData(shop);
                              setIsManageShopsOpen(true);
                            }}
                          >
                            <Ionicons name="create-outline" size={18} color="#0d5731" />
                          </Pressable>
                          <Pressable style={styles.shopActionBtn} onPress={() => { setViewingItem(shop); setIsViewModalOpen(true); }}>
                            <Ionicons name="eye-outline" size={18} color="#0d5731" />
                          </Pressable>
                        </View>
                      </View>
                      <View style={styles.shopLogoContainer}>
                        <Image source={{ uri: shop.logo_url }} style={styles.shopLogoImg} />
                      </View>
                      <View style={styles.shopCardContent}>
                        <Text style={styles.shopCardName} numberOfLines={1}>{shop.name}</Text>
                        <Text style={styles.shopCardEmail} numberOfLines={1}>{shop.email}</Text>
                        
                        <View style={styles.shopStatRow}>
                          <Text style={styles.shopStatLabel}>Status</Text>
                          <Pressable
                            onPress={() => handleToggleTableStatus(shop, "is_active")}
                            disabled={statusUpdatingKey === `shops:${shop.id}:is_active`}
                          >
                            <View style={[styles.toggleTrack, styles.colorToggleTrack, shop.is_active === 1 && styles.toggleTrackActive, { width: 50, height: 26, opacity: statusUpdatingKey === `shops:${shop.id}:is_active` ? 0.6 : 1 }]}>
                              <View style={[styles.toggleThumb, { width: 18, height: 18 }, shop.is_active === 1 && styles.toggleThumbActive]} />
                            </View>
                          </Pressable>
                        </View>

                        <View style={styles.shopStatRow}>
                          <Text style={styles.shopStatLabel}>Products</Text>
                          <View style={styles.shopStatBadge}>
                            <Text style={styles.shopStatBadgeText}>{shop.product_count || 0}</Text>
                          </View>
                        </View>

                        <View style={styles.shopStatRow}>
                          <Text style={styles.shopStatLabel}>Orders</Text>
                          <View style={[styles.shopStatBadge, { backgroundColor: "#064e3b" }]}>
                            <Text style={styles.shopStatBadgeText}>{shop.order_count || 0}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableContainer}>
                  {/* Table Header Row */}
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.cell, { width: 60 }]}>
                      <Text style={styles.columnName}>SL</Text>
                    </View>
                    {(() => {
                      if (selectedTable === "colors") {
                        return [
                          { name: "name", label: "Name", width: 240 },
                          { name: "color_code", label: "Color", width: 180 },
                          { name: "is_active", label: "Status", width: 180 },
                        ].map(col => (
                          <View key={col.name} style={[styles.cell, { width: col.width }]}>
                            <Text style={styles.columnName}>{col.label}</Text>
                          </View>
                        ));
                      }
                      if (selectedTable === "sizes") {
                        return [
                          { name: "name", label: "Name", width: 240 },
                          { name: "size", label: "Size", width: 180 },
                          { name: "is_active", label: "Status", width: 180 },
                        ].map(col => (
                          <View key={col.name} style={[styles.cell, { width: col.width }]}>
                            <Text style={styles.columnName}>{col.label}</Text>
                          </View>
                        ));
                      }
                      if (selectedTable === "units") {
                        return [
                          { name: "name", label: "Name", width: 420 },
                          { name: "is_active", label: "Status", width: 180 },
                        ].map(col => (
                          <View key={col.name} style={[styles.cell, { width: col.width }]}>
                            <Text style={styles.columnName}>{col.label}</Text>
                          </View>
                        ));
                      }
                      return (tableData?.columns?.slice(0, 15) || []).map((col) => {
                        if (!col) return null;
                        return (
                          <View key={col.name} style={[styles.cell, { width: col.name === "visibility" ? 220 : 140 }]}>
                            <Text style={styles.columnName}>{col.name.replace(/_/g, ' ').toUpperCase()}</Text>
                          </View>
                        );
                      });
                    })()}
                    <View style={[styles.cell, { width: (selectedTable === "orders" ? 360 : 150) }]}>
                      <Text style={styles.columnName}>Action</Text>
                    </View>
                  </View>

                  {/* Table Body with Pagination */}
                  {(() => {
                    const filtered = displayRows;
                    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const paginatedRows = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

                    if (paginatedRows.length === 0) {
                      return (
                        <View style={styles.emptyState}>
                          <Ionicons name="search-outline" size={48} color="#e2e8f0" />
                          <Text style={styles.emptyText}>No matching records found</Text>
                        </View>
                      );
                    }

                    return (
                      <>
                        {paginatedRows.map((row, index) => (
                          <View key={row.id || index} style={[styles.tableRow, (selectedTable === "colors" || selectedTable === "sizes") ? styles.colorTableRow : (index % 2 === 1 && { backgroundColor: "#fcfcfd" })]}>
                            <View style={[styles.cell, { width: 60 }]}>
                              <Text style={styles.cellText}>{row.id}</Text>
                            </View>

                            {(() => {
                              if (selectedTable === "colors") {
                                return [
                                  { name: "name", width: 240, type: "text" },
                                  { name: "color_code", width: 180, type: "colorBox" },
                                  { name: "is_active", width: 180, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "colorBox" ? (
                                      row.name === "Multi Colour" ? (
                                        <View style={styles.multiColorSwatch}>
                                          <View style={{ width: "50%", height: "50%", backgroundColor: "#ef4444" }} />
                                          <View style={{ width: "50%", height: "50%", backgroundColor: "#3b82f6" }} />
                                          <View style={{ width: "50%", height: "50%", backgroundColor: "#22c55e" }} />
                                          <View style={{ width: "50%", height: "50%", backgroundColor: "#f59e0b" }} />
                                        </View>
                                      ) : (
                                        <View
                                          style={[
                                            styles.colorSwatch,
                                            {
                                              backgroundColor: row[col.name] || "#ccc",
                                              borderWidth: String(row[col.name] || "").toUpperCase() === "#FFFFFF" ? 1 : 0,
                                            }
                                          ]}
                                        />
                                      )
                                    ) : col.type === "status" ? (
                                      <Pressable
                                        onPress={() => handleToggleTableStatus(row, col.name)}
                                        disabled={statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}`}
                                      >
                                        <View style={[styles.toggleTrack, styles.colorToggleTrack, row[col.name] === 1 && styles.toggleTrackActive, { opacity: statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}` ? 0.6 : 1 }]}>
                                          <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                        </View>
                                      </Pressable>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "sizes") {
                                return [
                                  { name: "name", width: 240, type: "text" },
                                  { name: "size", width: 180, type: "text" },
                                  { name: "is_active", width: 180, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "status" ? (
                                      <Pressable
                                        onPress={() => handleToggleTableStatus(row, col.name)}
                                        disabled={statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}`}
                                      >
                                        <View style={[styles.toggleTrack, styles.colorToggleTrack, row[col.name] === 1 && styles.toggleTrackActive, { opacity: statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}` ? 0.6 : 1 }]}>
                                          <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                        </View>
                                      </Pressable>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "units") {
                                return [
                                  { name: "name", width: 420, type: "text" },
                                  { name: "is_active", width: 180, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "status" ? (
                                      <Pressable
                                        onPress={() => handleToggleTableStatus(row, col.name)}
                                        disabled={statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}`}
                                      >
                                        <View style={[styles.toggleTrack, styles.colorToggleTrack, row[col.name] === 1 && styles.toggleTrackActive, { opacity: statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}` ? 0.6 : 1 }]}>
                                          <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                        </View>
                                      </Pressable>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              return (tableData?.columns?.slice(0, 15) || []).map((col) => {
                                if (!col) return null;
                                const isImageCol = ["image_url", "image", "thumbnail", "thumb"].includes(col.name.toLowerCase());
                                const isCatCol = ["category_id", "category"].includes(col.name.toLowerCase());
                                const isStatusCol = col.name.toLowerCase() === "status" || col.name.toLowerCase() === "is_active";
                                
                                return (
                                  <View key={col.name} style={[styles.cell, { width: col.name === "visibility" ? 220 : isImageCol ? 100 : 140 }]}>
                                    {isImageCol ? (
                                      <View style={styles.thumbnailContainer}>
                                        {row[col.name] ? (
                                          <Image source={{ uri: row[col.name] }} style={styles.thumbnailImg} />
                                        ) : (
                                          <Ionicons name="image-outline" size={20} color="#cbd5e1" />
                                        )}
                                      </View>
                                    ) : isCatCol ? (
                                      <View style={styles.categoryBadge}>
                                        <Text style={styles.categoryBadgeText}>{row.category_name || row[col.name] || "Uncategorized"}</Text>
                                      </View>
                                    ) : isStatusCol ? (
                                      <Pressable
                                        onPress={() => handleToggleTableStatus(row, col.name)}
                                        disabled={statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}`}
                                      >
                                        <View style={[styles.toggleTrack, row[col.name] === 1 && styles.toggleTrackActive, { opacity: statusUpdatingKey === `${selectedTable}:${row.id}:${col.name}` ? 0.6 : 1 }]}>
                                          <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                        </View>
                                      </Pressable>
                                    ) : col.name === "visibility" && selectedTable === "products" ? (
                                      <View style={{ flexDirection: "column", gap: 4 }}>
                                        <View style={[styles.statusBadge, { backgroundColor: row.is_featured === 1 ? colors.accent + "1A" : "#f1f5f9" }]}>
                                          <Text style={[styles.statusBadgeText, { color: row.is_featured === 1 ? colors.accent : colors.subtleText }]}>
                                            {row.is_featured === 1 ? "Showing on Home" : "Not on Home Screen"}
                                          </Text>
                                        </View>
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>
                                        {row[col.name] === null ? "—" : String(row[col.name])}
                                      </Text>
                                    )}
                                  </View>
                                );
                              });
                            })()}

                            <View style={[styles.cell, { width: (selectedTable === "orders" ? 360 : 150), flexDirection: "row", gap: 8, alignItems: "center" }]}>
                                <Pressable 
                                  style={[styles.pageBtn, { backgroundColor: "#f0f9ff", borderColor: "#bae6fd" }]} 
                                  onPress={() => { setViewingItem(row); setIsViewModalOpen(true); }}
                                >
                                  <Ionicons name="eye-outline" size={18} color="#0369a1" />
                                </Pressable>

                                {selectedTable !== "orders" && (
                                  <>
                                    <Pressable style={[styles.pageBtn, { backgroundColor: "#f8fafc" }]} onPress={() => {
                                      setEditingItem(row);
                                      if (selectedTable === "products") setIsModalOpen(true);
                                      else if (selectedTable === "shops") {
                                        setGenericFormData(row);
                                        setIsManageShopsOpen(true);
                                      } else {
                                        setGenericFormData(row);
                                        setIsGenericModalOpen(true);
                                      }
                                    }}>
                                      <Ionicons name="create-outline" size={18} color={colors.accent} />
                                    </Pressable>
                                    <Pressable style={[styles.pageBtn, { backgroundColor: "#fff1f2", borderColor: "#fee2e2" }]} onPress={() => {
                                      if (selectedTable === "products") handleDeleteProduct(row.id);
                                      else handleDeleteGenericEntry(row.id);
                                    }}>
                                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                    </Pressable>
                                  </>
                                )}

                                {selectedTable === "orders" && metadata.orderStatuses && (
                                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 }}>
                                    {metadata.orderStatuses.map((opt) => {
                                      const rs = String(row.order_status || "").toLowerCase().trim();
                                      const ov = String(opt.value || "").toLowerCase().trim();
                                      const isActiveStatus = rs === ov;
                                      return (
                                      <Pressable
                                        key={opt.value}
                                        style={[
                                          styles.statusBadge,
                                          { backgroundColor: isActiveStatus ? "#10b981" : "#f1f5f9" }
                                        ]}
                                        onPress={() => handleOrderLifecycleUpdate(row.id, opt.value)}
                                      >
                                        <Text style={[styles.statusBadgeText, { color: isActiveStatus ? "white" : colors.subtleText, fontSize: 10 }]}>
                                          {opt.label}
                                        </Text>
                                      </Pressable>
                                      );
                                    })}
                                  </View>
                                )}
                            </View>
                          </View>
                        ))}

                        <View style={styles.paginationContainer}>
                          <Text style={styles.paginationInfo}>
                            Showing <Text style={{ fontWeight: "700" }}>{startIndex + 1}</Text> to <Text style={{ fontWeight: "700" }}>{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</Text> of <Text style={{ fontWeight: "700" }}>{filtered.length}</Text> entries
                          </Text>
                          <View style={styles.paginationControls}>
                            <Pressable 
                              style={[styles.pageBtn, currentPage === 1 && styles.pageBtnDisabled]} 
                              onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                            >
                              <Ionicons name="chevron-back" size={18} color={currentPage === 1 ? "#cbd5e1" : colors.ink} />
                            </Pressable>
                            
                            {(() => {
                              const pages = [];
                              const maxVisible = 5;
                              let start = Math.max(1, currentPage - 2);
                              let end = Math.min(totalPages, start + maxVisible - 1);
                              if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

                              for (let i = start; i <= end; i++) {
                                pages.push(
                                  <Pressable 
                                    key={i} 
                                    style={[styles.pageNumber, currentPage === i && styles.pageNumberActive]}
                                    onPress={() => setCurrentPage(i)}
                                  >
                                    <Text style={[styles.pageNumberText, currentPage === i && styles.pageNumberTextActive]}>{i}</Text>
                                  </Pressable>
                                );
                              }
                              return pages;
                            })()}

                            <Pressable 
                              style={[styles.pageBtn, currentPage === totalPages && styles.pageBtnDisabled]} 
                              onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                            >
                              <Ionicons name="chevron-forward" size={18} color={currentPage === totalPages ? "#cbd5e1" : colors.ink} />
                            </Pressable>
                          </View>
                        </View>
                      </>
                    );
                  })()}
                </View>
              </ScrollView>
              )}
            </Animated.View>
          ) : (
            <Animated.View style={[styles.dashboardContainer, overviewPanelAnimatedStyle]}>
              {dashboardLoading ? (
                <View style={styles.tableCardLoading}>
                  <ActivityIndicator color={colors.accent} />
                  <Text style={styles.loadingDataText}>Synchronizing with live analytics...</Text>
                </View>
              ) : dashboardError ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>{dashboardError}</Text>
                </View>
              ) : (
                <>
                  <View style={styles.welcomeSection}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.welcomeTitle}>Welcome Back, {user?.name || "Admin"}</Text>
                      <Text style={styles.welcomeSub}>Monitor your business analytics, order flow, and catalogue performance with live store data.</Text>
                    </View>
                    <Pressable 
                      style={styles.syncBtn} 
                      onPress={handleSystemSync}
                    >
                      <Ionicons name="sync-outline" size={20} color="white" />
                      <Text style={styles.syncBtnText}>Sync Database</Text>
                    </Pressable>
                  </View>

                  <View style={styles.metricsGrid}>
                    {metricCards.map((metric) => {
                      const metricKey = String(metric.label || "").toLowerCase();
                      const styleMeta = metricStyleByLabel[metricKey] || { color: "#6366f1", icon: "stats-chart" };
                      return (
                        <StatCardContainer
                          key={metric.label}
                          metric={metric}
                          isActive={activeMetric === metric.label}
                          styleMeta={styleMeta}
                          onPress={handleMetricCardPress}
                          dashboardReveal={dashboardReveal}
                          data={metricSeriesByLabel[metricKey] || []}
                        />
                      );
                    })}
                  </View>

                  {/* Business Overview Section */}
                  <View style={styles.overviewSection}>
                    <View style={styles.sectionHeaderInline}>
                      <Text style={styles.sectionTitle}>Business Overview</Text>
                      <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveBadgeText}>{dashboardPeriod}</Text>
                      </View>
                    </View>
                    <View style={styles.statsGrid}>
                      <View style={[styles.overviewCard, { borderLeftColor: '#0d5731' }]}>
                        <Ionicons name="storefront-outline" size={28} color="#0d5731" style={styles.overviewIcon} />
                        <View>
                          <Text style={styles.overviewValue}>{dashboardData?.businessOverview?.shops || 0}</Text>
                          <Text style={styles.overviewLabel}>Total Shops</Text>
                        </View>
                      </View>
                      <View style={[styles.overviewCard, { borderLeftColor: '#f6b51e' }]}>
                        <Ionicons name="cube-outline" size={28} color="#f6b51e" style={styles.overviewIcon} />
                        <View>
                          <Text style={styles.overviewValue}>{dashboardData?.businessOverview?.products || 0}</Text>
                          <Text style={styles.overviewLabel}>Total Products</Text>
                        </View>
                      </View>
                      <View style={[styles.overviewCard, { borderLeftColor: '#3b82f6' }]}>
                        <Ionicons name="cart-outline" size={28} color="#3b82f6" style={styles.overviewIcon} />
                        <View>
                          <Text style={styles.overviewValue}>{dashboardData?.businessOverview?.orders || 0}</Text>
                          <Text style={styles.overviewLabel}>Total Orders</Text>
                        </View>
                      </View>
                      <View style={[styles.overviewCard, { borderLeftColor: '#10b981' }]}>
                        <Ionicons name="people-outline" size={28} color="#10b981" style={styles.overviewIcon} />
                        <View>
                          <Text style={styles.overviewValue}>{dashboardData?.businessOverview?.customers || 0}</Text>
                          <Text style={styles.overviewLabel}>Total Customers</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Order Analytics Section */}
                  <View style={styles.overviewSection}>
                    <Text style={styles.sectionTitle}>Order Analytics</Text>
                    <View style={styles.orderGrid}>
                      {orderBreakdownCards.map((item) => (
                        <View key={item.key} style={[styles.orderCard, { backgroundColor: item.bg }]}>
                          <View style={[styles.orderIconBadge, { backgroundColor: `${item.color}18` }]}>
                            <Ionicons name={item.icon} size={16} color={item.color} />
                          </View>
                          <Text style={[styles.orderValue, { color: item.color }]}>{item.value}</Text>
                          <Text style={styles.orderLabel}>{item.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Admin Wallet Section */}
                  <View style={styles.adminWalletSection}>
                    <Text style={styles.sectionTitle}>Admin Wallet</Text>
                    <View style={styles.walletGrid}>
                      <View style={[styles.walletCard, styles.walletMainCard]}>
                        <View style={styles.walletHeader}>
                          <Text style={styles.walletCurrency}>{formatCurrency(dashboardData?.adminWallet?.totalEarning || 0)}</Text>
                          <View style={styles.walletIconMain}>
                            <Ionicons name="wallet" size={24} color={colors.primary} />
                          </View>
                        </View>
                        <Text style={styles.walletTrend}>Live gross order revenue</Text>
                        <Text style={styles.walletLabel}>Total Earning</Text>
                      </View>

                      <View style={styles.walletSubGrid}>
                        <View style={styles.walletSmallCard}>
                          <View style={styles.walletHeader}>
                            <Text style={styles.walletSmallCurrency}>{formatCurrency(dashboardData?.adminWallet?.alreadyWithdraw || 0)}</Text>
                            <Ionicons name="cash-outline" size={18} color={colors.primary} />
                          </View>
                          <Text style={styles.walletSmallLabel}>Already Withdraw</Text>
                        </View>
                        <View style={styles.walletSmallCard}>
                          <View style={styles.walletHeader}>
                            <Text style={styles.walletSmallCurrency}>{formatCurrency(dashboardData?.adminWallet?.pendingWithdraw || 0)}</Text>
                            <Ionicons name="time-outline" size={18} color="#f59e0b" />
                          </View>
                          <Text style={styles.walletSmallLabel}>Pending Withdraw</Text>
                        </View>
                        <View style={styles.walletSmallCard}>
                          <View style={styles.walletHeader}>
                            <Text style={styles.walletSmallCurrency}>{formatCurrency(dashboardData?.adminWallet?.totalCommission || 0)}</Text>
                            <Ionicons name="bar-chart-outline" size={18} color={colors.highlight} />
                          </View>
                          <Text style={styles.walletSmallLabel}>Total Commission</Text>
                        </View>
                        <View style={styles.walletSmallCard}>
                          <View style={styles.walletHeader}>
                            <Text style={styles.walletSmallCurrency}>{formatCurrency(dashboardData?.adminWallet?.rejectedWithdraw || 0)}</Text>
                            <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                          </View>
                          <Text style={styles.walletSmallLabel}>Rejected Withdraw</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.statisticsSection}>
                    <View style={styles.statisticsHeader}>
                      <Text style={styles.sectionTitle}>Statistics</Text>
                      <Text style={styles.statisticsMeta}>{dashboardPeriod} performance snapshot</Text>
                    </View>

                    <View style={styles.statisticsContent}>
                      <View style={styles.statsOverviewColumn}>
                        <View style={styles.statInfoBlock}>
                          <Text style={styles.statBigNumber}>{formatCompactNumber(dashboardData?.businessOverview?.orders || 0)}</Text>
                          <Text style={styles.statSmallLabel}>Orders Processed</Text>
                        </View>
                        <View style={[styles.statInfoBlock, { borderLeftWidth: 1, borderColor: '#f1f5f9', paddingLeft: 30 }]}>
                          <Text style={styles.statBigNumber}>{formatCompactNumber(dashboardData?.businessOverview?.customers || 0)}</Text>
                          <Text style={styles.statSmallLabel}>Customer Base</Text>
                        </View>
                      </View>
                      <View style={styles.statisticsHighlights}>
                        <View style={styles.statisticsHighlightCard}>
                          <Text style={styles.statisticsHighlightLabel}>Products in catalogue</Text>
                          <Text style={styles.statisticsHighlightValue}>{formatCompactNumber(dashboardData?.businessOverview?.products || 0)}</Text>
                        </View>
                        <View style={styles.statisticsHighlightCard}>
                          <Text style={styles.statisticsHighlightLabel}>Revenue tracked</Text>
                          <Text style={styles.statisticsHighlightValue}>{formatCurrency(dashboardData?.adminWallet?.totalEarning || 0)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>


                  <Animated.View style={[styles.chartCard, chartAnimatedStyle]}>
                    <View style={[styles.chartHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }]}>
                      <View>
                        <Text style={styles.chartTitle}>Overview</Text>
                        <Text style={styles.chartSub}>{dashboardPeriod} performance stats</Text>
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
                      </View>
                    </View>
                    <BarChart
                      data={{
                        labels: lineLabels.length ? lineLabels : ["-", "-", "-", "-", "-", "-", "-"],
                        datasets: [{ data: displayChartData.length ? displayChartData : [0, 0, 0, 0, 0, 0, 0] }],
                      }}
                      width={Math.max(340, width - (sidebarCollapsed ? 220 : 520))}
                      height={260}
                      chartConfig={{
                        ...chartConfigBase(selectedChartColor),
                        fillShadowGradientFrom: selectedChartColor,
                        fillShadowGradientFromOpacity: 0.6,
                        fillShadowGradientTo: selectedChartColor,
                        fillShadowGradientToOpacity: 0.1,
                      }}
                      style={styles.chartStyle}
                    />
                  </Animated.View>

                  <View style={styles.chartsGrid}>
                    <Animated.View style={[styles.chartCard, { flex: 1.5, minWidth: 380 }, chartAnimatedStyle]}>
                      <View style={styles.chartHeader}>
                        <Text style={styles.chartTitle}>Category Breakdown</Text>
                        <Text style={styles.chartSub}>Product distribution</Text>
                      </View>
                      {dashboardData?.categoryDistribution?.length > 0 ? (
                        <PieChart
                          data={dashboardData.categoryDistribution}
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
                      ) : (
                        <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text style={{ color: colors.muted }}>No category data available</Text>
                        </View>
                      )}
                    </Animated.View>

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
                                  {[1, 2, 3, 4, 5].map(i => (
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

                  <View style={styles.chartsGrid}>
                    <Animated.View style={[styles.chartCard, { minWidth: 420 }, chartAnimatedStyle]}>
                      <View style={[styles.chartHeader, styles.dataListHeader]}>
                        <View>
                          <Text style={styles.chartTitle}>Recent Orders</Text>
                          <Text style={styles.chartSub}>Latest live order activity</Text>
                        </View>
                        <Pressable onPress={() => pickTable("orders")}>
                          <Text style={styles.linkText}>View Orders</Text>
                        </Pressable>
                      </View>
                      {recentOrders.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Text style={styles.emptyText}>No recent orders found.</Text>
                        </View>
                      ) : (
                        <View style={styles.dataList}>
                          {recentOrders.map((order) => (
                            <View key={order.id} style={styles.dataRow}>
                              <View style={styles.dataRowMain}>
                                <Text style={styles.dataRowTitle}>{order.order_code || `Order #${order.id}`}</Text>
                                <Text style={styles.dataRowSub}>{order.customer_name || "Customer"} • {order.payment_status || "Unknown payment"}</Text>
                              </View>
                              <View style={styles.dataRowMeta}>
                                <Text style={styles.dataRowValue}>{formatCurrency(order.payable_amount)}</Text>
                                <Text style={styles.dataRowStatus}>{order.order_status || "Pending"}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </Animated.View>

                    <Animated.View style={[styles.chartCard, { minWidth: 420 }, chartAnimatedStyle]}>
                      <View style={[styles.chartHeader, styles.dataListHeader]}>
                        <View>
                          <Text style={styles.chartTitle}>Latest Products</Text>
                          <Text style={styles.chartSub}>Newest catalogue additions</Text>
                        </View>
                        <Pressable onPress={() => pickTable("products")}>
                          <Text style={styles.linkText}>Manage Products</Text>
                        </Pressable>
                      </View>
                      {topProducts.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Text style={styles.emptyText}>No products found.</Text>
                        </View>
                      ) : (
                        <View style={styles.dataList}>
                          {topProducts.map((product) => (
                            <View key={product.id} style={styles.dataRow}>
                              <View style={styles.dataRowMain}>
                                <Text style={styles.dataRowTitle}>{product.name || "Product"}</Text>
                                <Text style={styles.dataRowSub}>Stock: {product.quantity || 0}</Text>
                              </View>
                              <View style={styles.dataRowMeta}>
                                <Text style={styles.dataRowValue}>{formatCurrency(product.price)}</Text>
                                <Text style={styles.dataRowStatus}>ID {product.id}</Text>
                              </View>
                            </View>
                          ))}
                        </View>
                      )}
                    </Animated.View>
                  </View>
                </>
              )}
            </Animated.View>
          )}
        </ScrollView>
        )}
      </View>

      {/* Modals */}
      <ProductModal
        visible={isModalOpen || (editingItem && selectedTable === "products")}
        item={editingItem}
        categories={categories}
        colorOptions={availableColors}
        sizeOptions={availableSizes}
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }}
        onSave={handleSaveProduct}
      />

      <GenericEntryModal
        visible={isGenericModalOpen}
        tableName={selectedTable}
        columns={tableData?.columns}
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

      <ViewEntryModal
        visible={isViewModalOpen}
        item={viewingItem}
        tableName={selectedTable}
        onClose={() => { setIsViewModalOpen(false); setViewingItem(null); }}
      />

      <ManageShopsModal
        visible={isManageShopsOpen}
        item={editingItem}
        onClose={() => { setIsManageShopsOpen(false); setEditingItem(null); }}
        onSave={async (updatedShop) => {
          try {
            setContentLoading(true);
            const shopId = updatedShop.id || editingItem?.id;
            const endpoint = shopId 
              ? `/admin/data/tables/shops/${shopId}` 
              : `/admin/data/tables/shops`;
            const method = shopId ? "PUT" : "POST";

            const res = await apiRequest(endpoint, {
              method,
              token,
              body: sanitizeTableData(updatedShop)
            });
            Alert.alert("Success", shopId ? "Shop updated successfully!" : "Shop created successfully!");
            setIsManageShopsOpen(false);
            setEditingItem(null);
            pickTable("shops");
          } catch (err) {
            Alert.alert("Error", "Error saving shop: " + err.message);
          } finally {
            setContentLoading(false);
          }
        }}
      />
    </View>
  );
}

// Sub-components

function ViewEntryModal({ visible, item, tableName, onClose }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  if (!visible || !item) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '90%' : 500 }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <Text style={modalStyles.title}>Details: {tableName?.replace(/s$/, "") || "Entry"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={modalStyles.body} showsVerticalScrollIndicator={false}>
          {Object.entries(item).map(([key, value]) => {
            if (key === 'id') return null;
            const label = key.replace(/_/g, " ").toUpperCase();
            const isImage = ["image_url", "image", "thumbnail"].includes(key.toLowerCase());
            
            return (
              <View key={key} style={{ marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#f8fafc', paddingBottom: 10 }}>
                <Text style={[modalStyles.label, { marginBottom: 4 }]}>{label}</Text>
                {isImage && value ? (
                  <View style={[styles.thumbnailContainer, { width: 120, height: 120, borderRadius: 12 }]}>
                    <Image source={{ uri: String(value) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                ) : (
                  <Text style={[styles.cellText, { fontSize: 15, color: '#334155' }]}>
                    {value === null || value === undefined ? "—" : String(value)}
                  </Text>
                )}
              </View>
            );
          })}
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={[modalStyles.saveBtn, { backgroundColor: colors.accent }]} onPress={onClose}>
            <Text style={modalStyles.saveBtnText}>Close View</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ManageCategoriesModal({ visible, categories, products, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
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
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
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
            const isBoolean = col.dataType?.toLowerCase().includes("tinyint") || col.name.startsWith("is_") || col.name === "status";

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

function ProductModal({ visible, item, categories, colorOptions, sizeOptions, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("0");
  const [quantity, setQuantity] = useState("0");
  const [metal, setMetal] = useState("");
  const [weight, setWeight] = useState("");
  const [size, setSize] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [catId, setCatId] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isAuspicious, setIsAuspicious] = useState(false);
  const [isFlashSale, setIsFlashSale] = useState(false);
  const [isBannerMain, setIsBannerMain] = useState(false);
  const [isBannerEarrings, setIsBannerEarrings] = useState(false);
  const [isBannerNecklaces, setIsBannerNecklaces] = useState(false);
  const [isPopularJewellery, setIsPopularJewellery] = useState(false);
  const [isMensShirts, setIsMensShirts] = useState(false);
  const [isWomensHighlights, setIsWomensHighlights] = useState(false);
  const [isPremiumSarees, setIsPremiumSarees] = useState(false);
  const [isAd, setIsAd] = useState(false);
  const [selColors, setSelColors] = useState([]);
  const [selSizes, setSelSizes] = useState([]);

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      setPrice(String(item?.price || ""));
      setDiscountPrice(String(item?.discount_price || "0"));
      setQuantity(String(item?.quantity || "0"));
      setMetal(item?.metal || "");
      setWeight(item?.weight || "");
      setSize(item?.size || "");
      setDesc(item?.description || "");
      setImg(item?.image || "");
      setCatId(item?.category_id || "");
      setIsFeatured(Boolean(item?.is_featured));
      setIsAuspicious(Boolean(item?.is_auspicious));
      setIsFlashSale(Boolean(item?.is_flash_sale));
      setIsBannerMain(Boolean(item?.is_banner_main));
      setIsBannerEarrings(Boolean(item?.is_banner_earrings));
      setIsBannerNecklaces(Boolean(item?.is_banner_necklaces));
      setIsPopularJewellery(Boolean(item?.is_popular_jewellery));
      setIsMensShirts(Boolean(item?.is_mens_shirts));
      setIsWomensHighlights(Boolean(item?.is_womens_highlights));
      setIsPremiumSarees(Boolean(item?.is_premium_sarees));
      setIsAd(Boolean(item?.is_ad));
      setSelColors(item?.colors ? (Array.isArray(item.colors) ? item.colors : []) : []);
      setSelSizes(item?.sizes ? (Array.isArray(item.sizes) ? item.sizes : []) : []);
    }
  }, [visible, item]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 600 }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{item ? "Edit Product" : "New Product"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.subtleText} /></Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={modalStyles.body}>
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
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            <TextInput 
              value={img} 
              onChangeText={setImg} 
              style={[modalStyles.input, { flex: 1 }]} 
              placeholder="https://..." 
            />
            <Pressable 
              style={[styles.createBtn, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0', minHeight: 46 }]}
              onPress={() => {
                if (Platform.OS === "web" && typeof document !== "undefined") {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => setImg(event.target.result);
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                } else {
                  Alert.alert("Notice", "Local file picking is optimized for Web.");
                }
              }}
            >
              <Ionicons name="image-outline" size={18} color={colors.ink} />
              <Text style={{ color: colors.ink, fontWeight: '700', marginLeft: 6 }}>Pick</Text>
            </Pressable>
          </View>

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

            <Pressable
              style={[modalStyles.pill, isAd && modalStyles.pillActive]}
              onPress={() => setIsAd(!isAd)}
            >
              <Ionicons name={isAd ? "megaphone" : "megaphone-outline"} size={14} color={isAd ? "white" : colors.subtleText} style={{ marginRight: 4 }} />
              <Text style={[modalStyles.pillText, isAd && modalStyles.pillTextActive]}>
                {isAd ? "In Advertisement" : "Not in Ad"}
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
            {colorOptions.map(c => (
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
            {sizeOptions.map(s => (
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
            is_ad: isAd ? 1 : 0,
            colors: selColors, sizes: selSizes
          })}>
            <Text style={modalStyles.saveBtnText}>Save Product</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ManageShopsModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (visible && item) {
      setFormData({ ...item });
    }
  }, [visible, item]);

  if (!visible) return null;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePickImage = (field) => {
    if (Platform.OS === "web" && typeof document !== "undefined") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            updateField(field, event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      Alert.alert("Notice", "Local file picking is currently supported on Web. For other platforms, please paste an image URL.");
    }
  };

  const SectionTitle = ({ title, icon }) => (
    <View style={modalStyles.sectionHeader}>
      <Ionicons name={icon} size={18} color={colors.ink} />
      <Text style={modalStyles.sectionTitleText}>{title}</Text>
    </View>
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 900, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="storefront-outline" size={20} color={colors.accent} />
            <Text style={modalStyles.title}>{formData.id ? "Edit Shop" : "New Shop"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
          <View style={{ paddingBottom: 30 }}>
            <SectionTitle title="User Information" icon="person-outline" />
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>First Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.first_name}
                  onChangeText={(v) => updateField("first_name", v)}
                  placeholder="First Name"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Last Name</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.last_name}
                  onChangeText={(v) => updateField("last_name", v)}
                  placeholder="Last Name"
                />
              </View>
              <View style={{ width: 180, alignItems: 'center' }}>
                <View style={[styles.shopLogoContainer, { marginTop: 0, marginLeft: 0, width: 120, height: 120, borderRadius: 12 }]}>
                   <Image source={{ uri: formData.user_profile_url || formData.logo_url }} style={{ width: '100%', height: '100%' }} />
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Phone Number <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.phone}
                  onChangeText={(v) => updateField("phone", v)}
                  placeholder="Phone Number"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Gender</Text>
                <View style={modalStyles.input}>
                  <Text style={{ fontSize: 14 }}>{formData.gender || "Select Gender"}</Text>
                </View>
              </View>
              <View style={{ width: 180 }}>
                <Text style={modalStyles.label}>User profile URL</Text>
                <TextInput
                  style={[modalStyles.input, { marginBottom: 8 }]}
                  value={formData.user_profile_url}
                  onChangeText={(v) => updateField("user_profile_url", v)}
                  placeholder="https://..."
                />
                <Pressable 
                  style={styles.filePicker}
                  onPress={() => handlePickImage("user_profile_url")}
                >
                  <Text style={styles.filePickerBtn}>Choose File</Text>
                  <Text style={styles.filePickerText} numberOfLines={1}>
                    {formData.user_profile_url?.startsWith("data:") ? "Local file selected" : "No file chosen"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Email <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.email}
                  onChangeText={(v) => updateField("email", v)}
                  placeholder="Email"
                />
              </View>
            </View>

            <View style={{ height: 20 }} />

            <SectionTitle title="Shop Information" icon="business-outline" />
            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Shop Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.name}
                  onChangeText={(v) => updateField("name", v)}
                  placeholder="Shop Name"
                />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>State</Text>
                <View style={modalStyles.input}>
                  <Text style={{ fontSize: 14 }}>{formData.state || "Select State"}</Text>
                </View>
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Address</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.address}
                  onChangeText={(v) => updateField("address", v)}
                  placeholder="Address"
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>GST</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.gst_id}
                  onChangeText={(v) => updateField("gst_id", v)}
                  placeholder="Enter gst id"
                />
              </View>
              <View style={{ flex: 2, alignItems: 'center' }}>
                <View style={[styles.shopLogoContainer, { marginTop: 0, marginLeft: 0, width: 120, height: 120, borderRadius: 12 }]}>
                   <Image source={{ uri: formData.logo_url }} style={{ width: '100%', height: '100%' }} />
                </View>
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Shop logo URL</Text>
                <TextInput
                  style={[modalStyles.input, { marginBottom: 8 }]}
                  value={formData.logo_url}
                  onChangeText={(v) => updateField("logo_url", v)}
                  placeholder="https://..."
                />
                <Pressable 
                  style={styles.filePicker}
                  onPress={() => handlePickImage("logo_url")}
                >
                  <Text style={styles.filePickerBtn}>Choose File</Text>
                  <Text style={styles.filePickerText} numberOfLines={1}>
                    {formData.logo_url?.startsWith("data:") ? "Local file selected" : "No file chosen"}
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.formRow}>
               <View style={{ flex: 1 }}>
                  <View style={[styles.shopCardBanner, { height: 160, borderRadius: 12, marginBottom: 12 }]}>
                    <Image source={{ uri: formData.banner_url }} style={styles.shopBannerImg} />
                  </View>
                  <Text style={modalStyles.label}>Shop banner URL (Ratio 4:1)</Text>
                  <TextInput
                    style={[modalStyles.input, { marginBottom: 8 }]}
                    value={formData.banner_url}
                    onChangeText={(v) => updateField("banner_url", v)}
                    placeholder="https://..."
                  />
                  <Pressable 
                    style={styles.filePicker}
                    onPress={() => handlePickImage("banner_url")}
                  >
                    <Text style={styles.filePickerBtn}>Choose File</Text>
                    <Text style={styles.filePickerText} numberOfLines={1}>
                      {formData.banner_url?.startsWith("data:") ? "Local file selected" : "No file chosen"}
                    </Text>
                  </Pressable>
               </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Description</Text>
                <TextInput
                  style={[modalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formData.description}
                  onChangeText={(v) => updateField("description", v)}
                  placeholder="Enter Description"
                  multiline
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={[modalStyles.saveBtn, { backgroundColor: '#0d5731' }]} onPress={() => onSave(formData)}>
            <Text style={modalStyles.saveBtnText}>Update</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Consolidated Styles

const modalStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "90%",
    ...(Platform.OS === "web" ? { boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" } : {}),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  body: {
    padding: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.subtleText,
    marginBottom: 8,
    marginTop: 12
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: colors.ink,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  row: { flexDirection: "row", gap: 16 },
  optionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    flexDirection: "row",
    alignItems: "center",
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8,
  },
  sectionTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.ink,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: 0.5,
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
  content: {
    flex: 1,
    height: "100%",
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
  welcomeSection: {
    marginBottom: 32,
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: 15,
    color: colors.subtleText,
    marginTop: 4,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0d5731",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  syncBtnText: { color: "white", fontSize: 14, fontWeight: "700" },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: 260,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    justifyContent: "space-between",
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } : {}),
  },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statValue: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.ink,
  },
  statLabel: {
    fontSize: 13,
    color: colors.subtleText,
    fontWeight: "700",
    marginTop: 4,
  },
  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  sectionHeaderInline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#16a34a",
  },
  liveBadgeText: {
    color: "#166534",
    fontSize: 12,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginTop: 12,
  },
  overviewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 20,
    flex: 1,
    minWidth: 220,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderLeftWidth: 4,
    gap: 16,
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } : {}),
  },
  overviewIcon: {
    backgroundColor: "#f8fafc",
    padding: 10,
    borderRadius: 10,
  },
  overviewValue: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.ink,
  },
  overviewLabel: {
    fontSize: 12,
    color: colors.subtleText,
    fontWeight: "600",
    marginTop: 2,
  },
  orderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  orderCard: {
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 130,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  orderIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  orderValue: {
    fontSize: 22,
    fontWeight: "800",
  },
  orderLabel: {
    fontSize: 12,
    color: colors.ink,
    fontWeight: "700",
    marginTop: 4,
  },
  adminWalletSection: {
    marginBottom: 20,
  },
  walletGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  walletMainCard: {
    flex: 1.2,
    minWidth: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'space-between',
    ...(Platform.OS === "web" ? { boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" } : {}),
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletCurrency: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
  },
  walletIconMain: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 87, 49, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletTrend: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 8,
  },
  walletLabel: {
    color: colors.subtleText,
    fontWeight: '600',
    fontSize: 15,
  },
  walletSubGrid: {
    flex: 2,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  walletSmallCard: {
    flex: 1,
    minWidth: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'space-between',
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } : {}),
  },
  walletSmallCurrency: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.ink,
  },
  walletSmallLabel: {
    color: colors.subtleText,
    fontSize: 13,
    fontWeight: '600',
  },
  statisticsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } : {}),
  },
  statisticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  statisticsMeta: {
    color: colors.subtleText,
    fontSize: 13,
    fontWeight: '600',
  },
  statisticsContent: {
    flexDirection: 'row',
    gap: 30,
    flexWrap: 'wrap',
  },
  statsOverviewColumn: {
    flexDirection: 'column',
    gap: 20,
    width: 150,
  },
  statInfoBlock: {
    paddingBottom: 20,
  },
  statBigNumber: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 4,
  },
  statSmallLabel: {
    color: colors.subtleText,
    fontSize: 13,
    fontWeight: '600',
  },
  statisticsHighlights: {
    flex: 1,
    minWidth: 240,
    gap: 12,
  },
  statisticsHighlightCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  statisticsHighlightLabel: {
    color: colors.subtleText,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  statisticsHighlightValue: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: "800",
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
    marginBottom: 24,
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
  chartSub: {
    fontSize: 12,
    color: colors.subtleText,
    marginTop: 4,
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
  chartStyle: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: Platform.OS === "web" ? -44 : -40,
  },
  chartsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 24,
    marginBottom: 24,
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
  dataListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    color: colors.accent,
    fontWeight: "700",
    fontSize: 13,
  },
  dataList: {
    gap: 12,
  },
  dataRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  dataRowMain: {
    flex: 1,
    gap: 4,
  },
  dataRowTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "700",
  },
  dataRowSub: {
    color: colors.subtleText,
    fontSize: 12,
    fontWeight: "500",
  },
  dataRowMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  dataRowValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: "800",
  },
  dataRowStatus: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  tableCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    ...(Platform.OS === "web" ? { boxShadow: "0 8px 20px rgba(13, 87, 49, 0.08)" } : {}),
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  refreshBtn: {
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
  tableHeader: {
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tableTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.ink,
  },
  tableSubtitle: {
    fontSize: 12,
    color: colors.subtleText,
    marginTop: 2,
  },
  createBtn: {
    backgroundColor: "#0d5731",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  createBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  tableContainer: {
    padding: 12,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  columnName: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.subtleText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "white",
  },
  colorTableRow: {
    minHeight: 78,
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  cellText: {
    fontSize: 15,
    color: colors.ink,
    fontWeight: "500",
  },
  thumbnailContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumbnailImg: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    backgroundColor: "#f6b51e",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
  },
  categoryBadgeText: {
    color: "#0d5731",
    fontSize: 11,
    fontWeight: "800",
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
  toggleTrack: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#e2e8f0",
    padding: 2,
    justifyContent: "center",
  },
  toggleTrackActive: {
    backgroundColor: "#0d5731",
    alignItems: "flex-end",
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "white",
  },
  toggleThumbActive: {
    backgroundColor: "white",
  },
  colorToggleTrack: {
    width: 72,
    height: 36,
    borderRadius: 18,
    padding: 3,
  },
  multiColorSwatch: {
    width: 64,
    height: 42,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#d1d5db",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  colorSwatch: {
    width: 64,
    height: 42,
    borderRadius: 6,
    borderColor: "#d1d5db",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 10,
  },
  paginationInfo: {
    fontSize: 13,
    color: "#64748b",
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pageBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  pageBtnDisabled: {
    backgroundColor: "#f8fafc",
    borderColor: "#f1f5f9",
  },
  pageNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pageNumberActive: {
    backgroundColor: colors.accent,
  },
  pageNumberText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.ink,
  },
  pageNumberTextActive: {
    color: "white",
  },
  shopsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 20,
    gap: 20,
  },
  shopCard: {
    width: 280,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    position: "relative",
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 12px rgba(0,0,0,0.03)" } : {}),
  },
  shopCardBanner: {
    height: 120,
    width: "100%",
  },
  shopBannerImg: {
    width: "100%",
    height: "100%",
    contentFit: "cover",
  },
  shopCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 12,
    gap: 8,
    opacity: 0.8,
  },
  shopActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  shopLogoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "white",
    borderWidth: 4,
    borderColor: "white",
    marginTop: -32,
    marginLeft: 20,
    overflow: "hidden",
    zIndex: 10,
    ...(Platform.OS === "web" ? { boxShadow: "0 4px 8px rgba(0,0,0,0.1)" } : {}),
  },
  shopLogoImg: {
    width: "100%",
    height: "100%",
    contentFit: "cover",
  },
  shopCardContent: {
    padding: 20,
    paddingTop: 12,
  },
  shopCardName: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  shopCardEmail: {
    fontSize: 12,
    color: colors.subtleText,
    marginTop: 2,
  },
  shopStatRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
  },
  shopStatLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
  },
  shopStatBadge: {
    backgroundColor: "#0d5731",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  shopStatBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "800",
  },
  formRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  formCol: {
    flex: 1,
    minWidth: 200,
  },
  formColFull: {
    width: "100%",
  },
  filePicker: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  filePickerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#e2e8f0",
    color: colors.ink,
    fontSize: 13,
    fontWeight: "700",
  },
  filePickerText: {
    paddingHorizontal: 12,
    fontSize: 13,
    color: colors.subtleText,
    flex: 1,
  },
  tableGraphStyle: {
    borderRadius: 12,
  },
  emptyState: {
    padding: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    color: colors.muted,
    fontSize: 14,
    fontWeight: "600",
  },
});
