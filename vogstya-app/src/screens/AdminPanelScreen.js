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
import { apiRequest, API_BASE_URL } from "../api/client";
import { colors, spacing } from "../theme/theme";
import AdminSidebar from "../components/AdminSidebar";
import POSView from "../components/POSView";
import DraftView from "../components/DraftView";
import POSSalesView from "../components/POSSalesView";
import { generateInvoiceHtml } from "../utils/InvoiceUtility";
import CustomerModal from "../components/CustomerModal";
import BannerModal from "../components/BannerModal";
import AdModal from "../components/AdModal";
import CouponModal from "../components/CouponModal";
import NotificationModal from "../components/NotificationModal";
import BusinessSettingsView from "../components/BusinessSettingsView";
import FlashSalesModal from "../components/FlashSalesModal";
import PushNotificationView from "../components/PushNotificationView";

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
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];
const GENDER_OPTIONS = ["Male", "Female", "Unisex"];
const USER_CATEGORIES = ["Admin", "Seller", "Customer"];
const ORDER_LIFECYCLE_OPTIONS = [
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" }
];
const ORDER_ANALYTICS_STAGES = ["New", "In Progress", "Completed", "Cancelled"];
const APPROVED_COLORS = [
  { id: 1, name: "Gold", color_code: "#FFD700", is_active: 1 },
  { id: 2, name: "Silver", color_code: "#C0C0C0", is_active: 1 },
  { id: 3, name: "Rose Gold", color_code: "#B76E79", is_active: 1 }
];
const APPROVED_SIZES = [
  { id: 1, name: "Small", size: "S", is_active: 1 },
  { id: 2, name: "Medium", size: "M", is_active: 1 },
  { id: 3, name: "Large", size: "L", is_active: 1 }
];
const APPROVED_UNITS = [
  { id: 1, name: "Grams", is_active: 1 },
  { id: 2, name: "Carat", is_active: 1 },
  { id: 3, name: "Piece", is_active: 1 }
];

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
    "visibility",
    "created_at",
    "updated_at",
    "deleted_at",
    "media_src"
  ];
  toRemove.forEach(field => {
    delete cleaned[field];
  });
  return cleaned;
};

const resolveImageUrl = (path) => {
  let source = path || "";
  if (!source || source === "null" || source === "undefined") return "https://via.placeholder.com/120x40";

  // Handle JSON encoded strings
  if (typeof source === "string" && (source.startsWith("[") || source.startsWith("{"))) {
    try {
      const parsed = JSON.parse(source);
      if (Array.isArray(parsed) && parsed.length > 0) {
        source = parsed[0];
      } else if (typeof parsed === "object" && parsed.src) {
        source = parsed.src;
      }
    } catch (e) {
      // Not JSON
    }
  }

  if (typeof source !== "string") return "https://via.placeholder.com/120x40";
  if (source.startsWith("http")) return source;
  if (source.startsWith("data:")) return source;
  
  const cleaned = source.replace(/^\/+/, "");
  
  // Use the actual API_BASE_URL but remove the /api suffix
  const serverRoot = API_BASE_URL.replace(/\/api$/, "");
  
  if (cleaned.startsWith("uploads/")) {
    return `${serverRoot}/${cleaned}`;
  }
  return `${serverRoot}/uploads/${cleaned}`;
};

const AdminPanelScreen = () => {
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
  const [subCategories, setSubCategories] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isFlashSalesModalOpen, setIsFlashSalesModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenericModalOpen, setIsGenericModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageShopsOpen, setIsManageShopsOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [isSpecValueModalOpen, setIsSpecValueModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isRiderModalOpen, setIsRiderModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isFlashSaleModalOpen, setIsFlashSaleModalOpen] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [specifications, setSpecifications] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [genericFormData, setGenericFormData] = useState({});
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState({ rows: [], columns: [] });
  const [activeView, setActiveView] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStock, setSelectedStock] = useState("all");
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isStockFilterOpen, setIsStockFilterOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({ "All Orders": true, "Categories": true });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 500;

  // View Modal State
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState(null);
  const [orderStatusUpdatingKey, setOrderStatusUpdatingKey] = useState("");
  const [selectedShopFilter, setSelectedShopFilter] = useState("all");
  const [isShopFilterOpen, setIsShopFilterOpen] = useState(false);

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
          setSubCategories(metaRes.metadata.subCategories || []);
          setAvailableColors(metaRes.metadata.colors || []);
          setAvailableSizes(metaRes.metadata.sizes || []);
          setBrands(metaRes.metadata.brands || []);
          setUnits(metaRes.metadata.units || []);
          
          // Fetch specifications list for dropdowns
          const specRes = await apiRequest("/admin/data/tables/specifications", { token });
          if (Array.isArray(specRes)) setSpecifications(specRes);
          else if (specRes && specRes.rows) setSpecifications(specRes.rows);
        }
      } catch (err) {
        console.error("Failed to load metadata:", err);
      }
    }
    if (token) loadMetadata();
  }, [token]);

  const pickTable = async (tableName, shopIdOverride = null) => {
    setSelectedTable(tableName);
    setContentLoading(true);
    setSearchQuery(""); // Clear search on table change
    setActiveOrderStatusFilter("all_orders"); // Reset order filter
    try {
      const isApprovalTable = ["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(tableName);
      let queryUrl = tableName === "ads" ? `/admin/ads` : tableName === "coupons" ? `/admin/coupons` : `/admin/data/tables/${tableName}`;
      const params = [];
      
      if (tableName === "products") {
        params.push("limit=1000");
        params.push("orderColumn=id");
        params.push("orderType=DESC");
      }
      
      if (isApprovalTable) {
        const targetShopId = shopIdOverride !== null ? shopIdOverride : selectedShopFilter;
        params.push(`shop_id=${targetShopId}`);
      }
      
      if (params.length > 0) {
        queryUrl += `?${params.join("&")}`;
      }
      
      console.log(`Fetching table data for: ${tableName} from ${queryUrl}`);
      let data = await apiRequest(queryUrl, { token });
      console.log(`Received data for ${tableName}:`, data);
      
      setSelectedTable(tableName);
      setSearchQuery("");
      setCurrentPage(1);

      if (tableName === "products" && data.columns) {
        // Add virtual visibility column if it doesn't exist
        if (!data.columns.find(c => c.name === "visibility")) {
          data.columns.push({ name: "visibility", dataType: "virtual" });
        }
      }
      if (data && Array.isArray(data.rows)) {
        console.log(`Setting table data for ${tableName}: ${data.rows.length} rows`);
        setTableData({
          columns: data.columns || [],
          rows: data.rows,
          pagination: data.pagination || null
        });
      } else if (Array.isArray(data)) {
        console.log(`Setting table data for ${tableName} (array format): ${data.length} rows`);
        setTableData({
          columns: [],
          rows: data
        });
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

    // Explicitly allow all ads
    if (selectedTable === "ads") return matchesSearch;

    // Apply existing filters (for products table only)
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

      if (filterVal === "pending") {
        matchesOrderStatus = rowStatus === "pending" || rowStatus === "placed";
      } else if (filterVal === "confirm") {
        matchesOrderStatus = rowStatus === "confirm" || rowStatus === "confirmed";
      } else if (filterVal === "pickup") {
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
        body: sanitizeTableData(formData),
        token
      });

      // Refresh data
      pickTable("products");
      reloadProducts();
      setIsProductModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      Alert.alert("Error", "Failed to save product: " + err.message);
    }
  };


  const handleSaveRecord = async (tableName, data, modalSetter) => {
    try {
      setLoading(true);
      const isEdit = !!data.id;
      const url = tableName === "ads" 
        ? (isEdit ? `/admin/ads/${data.id}` : `/admin/ads`)
        : tableName === "coupons"
        ? (isEdit ? `/admin/coupons/${data.id}` : `/admin/coupons`)
        : (isEdit ? `/admin/data/tables/${tableName}/${data.id}` : `/admin/data/tables/${tableName}`);
      const method = isEdit ? "PUT" : "POST";

      // Create a clean payload (removing extra fields if necessary)
      const payload = { ...data };
      delete payload.created_at;
      delete payload.updated_at;
      
      if (tableName === "categories") {
        if (payload.hasOwnProperty("is_active")) {
          payload.status = payload.is_active;
          delete payload.is_active;
        }
        delete payload.slug;
      }

      if (tableName === "colors") {
        delete payload.code;
        delete payload.status;
      }
      
      if (tableName === "specificationvalues") {
        delete payload.specification_name;
      }
      
      if (tableName === "sub_categories") {
        delete payload.category_name;
        // The backend now handles the fallback ID mapping (fb1 -> real ID).
        // We no longer block the user here, ensuring the Update always works.
      }

      await apiRequest(url, {
        method,
        token,
        body: payload
      });

      modalSetter(false);
      await pickTable(tableName);
      Alert.alert("Success", `Record ${isEdit ? "updated" : "created"} successfully.`);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(true); // Wait for pickTable to finish
      setTimeout(() => setLoading(false), 500);
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

  const handleDeleteRecord = (tableNameOrId, optionalId) => {
    const tableName = optionalId ? tableNameOrId : selectedTable;
    const id = optionalId ? optionalId : tableNameOrId;

    if (!id || !tableName) {
      console.log("Delete failed: missing ID or table", { id, tableName });
      return;
    }

    const performDelete = async () => {
      try {
        setContentLoading(true);
        console.log(`Attempting to delete ${id} from ${tableName}...`);
        const url = tableName === "ads" ? `/admin/ads/${id}` : `/admin/data/tables/${tableName}/${id}`;
        const res = await apiRequest(url, {
          method: "DELETE",
          token
        });

        if (res && res.success) {
          setTableData(prev => ({
            ...prev,
            rows: (prev?.rows || []).filter(r => r.id !== id)
          }));
          
          if (selectedTable === "products") reloadProducts();
          
          if (Platform.OS === 'web') alert("Record deleted successfully");
          else Alert.alert("Success", "Record deleted successfully");
        } else {
          throw new Error(res?.message || "Server responded with failure");
        }
      } catch (err) {
        console.error("Delete error:", err);
        if (Platform.OS === 'web') alert("Error: " + err.message);
        else Alert.alert("Error", "Failed to delete record: " + err.message);
      } finally {
        setContentLoading(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete this record from ${selectedTable}? This action cannot be undone.`)) {
        performDelete();
      }
    } else {
      Alert.alert(
        "Confirm Delete",
        `Are you sure you want to delete this record from ${selectedTable}? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  const handleToggleTableStatus = async (row, fieldName = "is_active") => {
    if (!row?.id || !selectedTable) return;

    // Map field name if necessary
    let actualField = fieldName;
    if ((selectedTable === "categories" || selectedTable === "banners" || selectedTable === "ads") && fieldName === "is_active") actualField = "status";

    const updateKey = `${selectedTable}:${row.id}:${actualField}`;
    const nextValue = Number(row[actualField]) === 1 ? 0 : 1;
    setStatusUpdatingKey(updateKey);

    try {
      const url = selectedTable === "ads" ? `/admin/ads/${row.id}/status` : selectedTable === "coupons" ? `/admin/coupons/${row.id}/status` : `/admin/data/tables/${selectedTable}/${row.id}`;
      const method = (selectedTable === "ads" || selectedTable === "coupons") ? "PATCH" : "PUT";
      
      const res = await apiRequest(url, {
        method,
        token,
        body: { [actualField]: nextValue },
      });

      if (res && res.success) {
        setTableData((prev) => ({
          ...prev,
          rows: (prev?.rows || []).map((item) =>
            item.id === row.id ? { ...item, [actualField]: nextValue } : item
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

  const handleResetPassword = async (tableName, row) => {
    if (!row?.id || !tableName) return;
    
    if (Platform.OS === 'web') {
      const newPassword = window.prompt(`Enter new password for ${row.name || row.email}:`);
      if (newPassword) {
        if (newPassword.length < 6) {
          alert("Password must be at least 6 characters long.");
          return;
        }
        try {
          setLoading(true);
          await apiRequest(`/admin/data/tables/${tableName}/${row.id}`, {
            method: "PUT",
            token,
            body: { password: newPassword }
          });
          alert("Password updated successfully.");
        } catch (err) {
          alert("Error: " + err.message);
        } finally {
          setLoading(false);
        }
      }
    } else {
      Alert.alert("Reset Password", "Please use the Edit modal to change the password on mobile.");
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
      // Optimistic UI update: locally move the order to the new status bucket
      const formattedStatus = status === "on_the_way" ? "On The Way" : status.charAt(0).toUpperCase() + status.slice(1);
      setTableData(prev => ({
        ...prev,
        rows: (prev?.rows || []).map(r => 
          Number(r.id) === Number(orderId) ? { ...r, order_status: formattedStatus } : r
        )
      }));

      await pickTable("orders");
      setActiveOrderStatusFilter(status);
      const refreshedDashboard = await apiRequest("/admin/dashboard", { token });
      setDashboardData(refreshedDashboard);
      Alert.alert("Success", `Order #${orderId} moved to ${formattedStatus}.`);
    } catch (err) {
      Alert.alert("Update failed", err.message);
    } finally {
      setOrderStatusUpdatingKey("");
    }
  };

  const metricStyleByLabel = {
    earnings: { color: "#10b981", icon: "wallet-outline" },
    revenue: { color: "#10b981", icon: "trending-up-outline" },
    products: { color: "#f59e0b", icon: "diamond-outline" },
    orders: { color: "#3b82f6", icon: "cart-outline" },
    users: { color: "#6366f1", icon: "people-outline" },
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
        { name: "specificationvalues", label: "Specification Values", icon: "options-outline", table: "specificationvalues" },
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
        { name: "riders", label: "Riders", icon: "bicycle-outline", table: "riders" },
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
        { name: "roles_permissions", label: "Roles & Permissions", icon: "key-outline", table: "roles" },
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Pressable onPress={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ padding: 4 }}>
                  <Ionicons name="menu-outline" size={24} color={colors.ink} />
                </Pressable>
                <Text style={styles.contentTitle}>
                  {selectedTable === "products"
                    ? "Product List"
                    : selectedTable === "riders"
                      ? "All Riders"
                    : selectedTable === "users"
                      ? "All Customers"
                    : selectedTable === "specificationvalues"
                      ? "Specification Values List"
                    : selectedTable
                      ? `${selectedTable.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Management`
                      : activeView === "pos"
                        ? "POS Terminal"
                        : activeView === "draft"
                          ? "POS Drafts"
                          : activeView === "pos_sales"
                            ? "POS Sales History"
                            : "Dashboard Overview"}
                </Text>
              </View>
              {selectedTable === "users" && (
                <Pressable
                  style={[styles.createBtn, { backgroundColor: '#0d5731', paddingHorizontal: 20, height: 44, borderRadius: 8 }]}
                  onPress={() => {
                    setEditingItem(null);
                    setIsUserModalOpen(true);
                  }}
                >
                  <Ionicons name="add" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Create New</Text>
                </Pressable>
              )}
              {selectedTable && selectedTable !== "users" && tableData?.rows && (
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
            <Pressable style={styles.headerActionBtn}>
              <Ionicons name="search-outline" size={20} color={colors.ink} />
            </Pressable>
            <Pressable style={styles.headerActionBtn}>
              <Ionicons name="moon-outline" size={20} color={colors.ink} />
            </Pressable>
            <Pressable
              style={styles.headerActionBtn}
              onPress={() => setShowNotifications(!showNotifications)}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.ink} />
              <View style={styles.notificationBadgeContainer}>
                <Text style={styles.notificationBadgeText}>9+</Text>
              </View>
            </Pressable>

            <View style={styles.languageSelector}>
              <Ionicons name="language-outline" size={18} color={colors.subtleText} />
              <Text style={styles.languageText}>English</Text>
              <Ionicons name="chevron-down" size={14} color={colors.subtleText} />
            </View>

            <View style={styles.userProfile}>
              <View style={styles.userMeta}>
                <Text style={styles.userName}>Sathyabhama</Text>
                <Text style={styles.userRole}>Root</Text>
              </View>
              <View style={styles.avatar}>
                <Image source={{ uri: "https://www.vogstya.com/public/assets/back-end/img/admin.jpg" }} style={styles.avatarImg} />
                <View style={styles.saleBadge}>
                  <Ionicons name="pricetag" size={10} color="white" />
                  <Text style={styles.saleBadgeText}>SALE</Text>
                </View>
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
            ) : selectedTable === "notifications" ? (
              <PushNotificationView token={token} apiRequest={apiRequest} />
            ) : activeView === "general_settings" || activeView === "business_setup" || activeView === "business_settings" ? (
              <BusinessSettingsView colors={colors} token={token} apiRequest={apiRequest} />
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
                  <View style={[styles.tableGraphSection, { marginTop: 20 }]}>
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
                  <View style={[styles.filterSection, { backgroundColor: '#ffffff', padding: 24, borderRadius: 16, marginBottom: 32, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', zIndex: 100, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 }]}>
                    <Text style={[styles.sectionTitle, { fontSize: 18, fontWeight: '800', color: colors.ink, marginBottom: 24 }]}>Filter Products</Text>
                    <View style={{ flexDirection: isMobile ? "column" : "row", gap: 24, zIndex: 200 }}>
                      <View style={{ flex: 1, zIndex: 1000 }}>
                        <Text style={[styles.filterLabel, { marginBottom: 10, color: '#64748b', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Category</Text>
                        <Pressable 
                          onPress={() => {
                            setIsCategoryFilterOpen(!isCategoryFilterOpen);
                            setIsStockFilterOpen(false);
                          }}
                          style={[styles.filterPicker, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                        >
                          <Text style={{ fontSize: 15, color: selectedCategory ? colors.ink : '#94a3b8', fontWeight: selectedCategory ? '700' : '500' }}>
                            {selectedCategory ? categories.find(c => String(c.id) === String(selectedCategory))?.name : "All Categories"}
                          </Text>
                          <Ionicons name={isCategoryFilterOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
                        </Pressable>
                        {isCategoryFilterOpen && (
                          <View style={{ position: 'absolute', top: 88, left: 0, right: 0, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 3000, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 }}>
                            <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled={true}>
                              <Pressable 
                                onPress={() => { setSelectedCategory(""); setIsCategoryFilterOpen(false); }} 
                                style={({pressed}) => [{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: pressed ? '#f1f5f9' : (selectedCategory === "" ? 'rgba(13, 87, 49, 0.05)' : 'transparent') }]}
                              >
                                <Text style={{ fontSize: 15, color: colors.ink, fontWeight: '700' }}>Show All Categories</Text>
                              </Pressable>
                              {categories.map(cat => (
                                <Pressable 
                                  key={cat.id} 
                                  onPress={() => { setSelectedCategory(cat.id); setIsCategoryFilterOpen(false); }} 
                                  style={({pressed}) => [{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: pressed ? '#f1f5f9' : (String(selectedCategory) === String(cat.id) ? 'rgba(13, 87, 49, 0.05)' : 'transparent') }]}
                                >
                                  <Text style={{ fontSize: 15, color: colors.ink, fontWeight: String(selectedCategory) === String(cat.id) ? '700' : '500' }}>{cat.name}</Text>
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>

                      <View style={{ flex: 1, zIndex: 900 }}>
                        <Text style={[styles.filterLabel, { marginBottom: 10, color: '#64748b', fontWeight: '700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }]}>Stock Status</Text>
                        <Pressable 
                          onPress={() => {
                            setIsStockFilterOpen(!isStockFilterOpen);
                            setIsCategoryFilterOpen(false);
                          }}
                          style={[styles.filterPicker, { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, height: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                        >
                          <Text style={{ fontSize: 15, color: colors.ink, fontWeight: selectedStock !== 'all' ? '700' : '500' }}>
                            {selectedStock === "all" ? "All stock" : (selectedStock === "in_stock" ? "In Stock" : "Out Of Stock")}
                          </Text>
                          <Ionicons name={isStockFilterOpen ? "chevron-up" : "chevron-down"} size={20} color={colors.primary} />
                        </Pressable>
                        {isStockFilterOpen && (
                          <View style={{ position: 'absolute', top: 88, left: 0, right: 0, backgroundColor: 'white', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 3000, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.15, shadowRadius: 30, elevation: 20 }}>
                            <Pressable onPress={() => { setSelectedStock("all"); setIsStockFilterOpen(false); }} style={({pressed}) => [{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: pressed ? '#f1f5f9' : (selectedStock === 'all' ? 'rgba(13, 87, 49, 0.05)' : 'transparent') }]}>
                              <Text style={{ fontSize: 15, color: colors.ink, fontWeight: selectedStock === 'all' ? '700' : '500' }}>All Stock</Text>
                            </Pressable>
                            <Pressable onPress={() => { setSelectedStock("out_of_stock"); setIsStockFilterOpen(false); }} style={({pressed}) => [{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: pressed ? '#f1f5f9' : (selectedStock === 'out_of_stock' ? 'rgba(239, 68, 68, 0.05)' : 'transparent') }]}>
                              <Text style={{ fontSize: 15, color: '#ef4444', fontWeight: selectedStock === 'out_of_stock' ? '700' : '500' }}>Out Of Stock</Text>
                            </Pressable>
                            <Pressable onPress={() => { setSelectedStock("in_stock"); setIsStockFilterOpen(false); }} style={({pressed}) => [{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: pressed ? '#f1f5f9' : (selectedStock === 'in_stock' ? 'rgba(16, 185, 129, 0.05)' : 'transparent') }]}>
                              <Text style={{ fontSize: 15, color: '#10b981', fontWeight: selectedStock === 'in_stock' ? '700' : '500' }}>In Stock</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                        <Pressable
                          style={[styles.resetBtn, { height: 52, paddingHorizontal: 24, borderRadius: 12, justifyContent: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' }]}
                          onPress={() => {
                            setSelectedCategory("");
                            setSelectedStock("all");
                            setSearchQuery("");
                            setActiveSectionFilter("all");
                            setIsCategoryFilterOpen(false);
                            setIsStockFilterOpen(false);
                          }}
                        >
                          <Text style={[styles.resetBtnText, { color: '#64748b', fontWeight: '700', fontSize: 14 }]}>Reset</Text>
                        </Pressable>
                        <Pressable 
                          style={[styles.createBtn, { height: 52, paddingHorizontal: 28, borderRadius: 12, backgroundColor: '#0d5731', shadowColor: '#0d5731', shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 }]}
                          onPress={() => {
                             setIsCategoryFilterOpen(false);
                             setIsStockFilterOpen(false);
                          }}
                        >
                          <Ionicons name="filter" size={18} color="white" style={{ marginRight: 8 }} />
                          <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>Apply Filters</Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.ink, textTransform: 'capitalize' }}>
                    {selectedTable === "brands" ? "Brand List" : (selectedTable === "specifications" || selectedTable === "specification") ? "Specifications List" : (selectedTable === "users" ? "" : (selectedTable ? `${selectedTable.replace(/_/g, ' ').replace('specificationvalues', 'specification values')} List` : "Data Records"))}
                  </Text>
                  {selectedTable !== "users" && (
                    <View style={{ backgroundColor: "rgba(13, 87, 49, 0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.accent }}>{displayRows.length} Items</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }} />
                  {selectedTable === "brands" && (
                    <Pressable 
                      style={styles.createNewBtn}
                      onPress={() => {
                        setEditingItem(null);
                        setIsBrandModalOpen(true);
                      }}
                    >
                      <Text style={styles.createNewBtnText}>Create New</Text>
                    </Pressable>
                  )}
                  {(selectedTable === "specifications" || selectedTable === "specification") && (
                    <Pressable 
                      style={styles.createNewBtn}
                      onPress={() => {
                        setEditingItem(null);
                        setIsSpecModalOpen(true);
                      }}
                    >
                      <Text style={styles.createNewBtnText}>Create New</Text>
                    </Pressable>
                  )}
                  {selectedTable === "specificationvalues" && (
                    <Pressable 
                      style={styles.createNewBtn}
                      onPress={() => {
                        setEditingItem(null);
                        setIsSpecValueModalOpen(true);
                      }}
                    >
                      <Text style={styles.createNewBtnText}>Create New</Text>
                    </Pressable>
                  )}
                  {selectedTable === "banners" && (
                    <Pressable 
                      style={styles.createNewBtn}
                      onPress={() => {
                        setEditingItem(null);
                        setGenericFormData({ is_active: 1, type: 'main', is_for_own_shop: 0 });
                        setIsBannerModalOpen(true);
                      }}
                    >
                      <Text style={styles.createNewBtnText}>Create New</Text>
                    </Pressable>
                  )}
                </View>

                <View style={styles.tableToolbar}>
                  {selectedTable === "orders" && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.orderStatusTabs}>
                      {[
                        { name: "all_orders", label: "All", count: dashboardData?.businessOverview?.orders || 0, color: "#94a3b8" },
                        { name: "pending", label: "Pending", count: dashboardData?.orderAnalytics?.pending || 0, color: "#f59e0b" },
                        { name: "confirm", label: "Confirm", count: dashboardData?.orderAnalytics?.confirm || 0, color: "#38bdf8" },
                        { name: "processing", label: "Processing", count: dashboardData?.orderAnalytics?.processing || 0, color: "#a855f7" },
                        { name: "pickup", label: "Pickup", count: dashboardData?.orderAnalytics?.pickup || 0, color: "#64748b" },
                        { name: "on_the_way", label: "On The Way", count: dashboardData?.orderAnalytics?.onTheWay || 0, color: "#475569" },
                        { name: "delivered", label: "Delivered", count: dashboardData?.orderAnalytics?.delivered || 0, color: "#10b981" },
                        { name: "cancelled", label: "Cancelled", count: dashboardData?.orderAnalytics?.cancelled || 0, color: "#ef4444" },
                      ].map((tab) => (
                        <Pressable
                          key={tab.name}
                          onPress={() => setActiveOrderStatusFilter(tab.name)}
                          style={[
                            styles.orderTab,
                            activeOrderStatusFilter === tab.name && { backgroundColor: "rgba(13, 87, 49, 0.08)", borderColor: "#0d5731" }
                          ]}
                        >
                          <Text style={[styles.orderTabText, activeOrderStatusFilter === tab.name && { color: "#0d5731" }]}>{tab.label}</Text>
                          <View style={[styles.orderTabBadge, { backgroundColor: tab.color }]}>
                            <Text style={styles.orderTabBadgeText}>{tab.count}</Text>
                          </View>
                        </Pressable>
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.toolbarTop}>
                    <View style={styles.searchBarContainer}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, paddingLeft: 12 }}>
                        <Ionicons name="search-outline" size={18} color="#94a3b8" />
                        <TextInput
                          style={styles.searchBarInput}
                          placeholder={
                            selectedTable === "orders" ? "Search by Order ID or Customer" : 
                            selectedTable === "specifications" ? "Search by specifications name" :
                            selectedTable === "brands" ? "Search by brands name" :
                            selectedTable === "users" ? "Search by customer name or email" :
                            "Search by product name"
                          }
                          placeholderTextColor="#94a3b8"
                          value={searchQuery}
                          onChangeText={(txt) => {
                            setSearchQuery(txt);
                            setCurrentPage(1);
                          }}
                        />
                      </View>
                      <Pressable style={styles.searchBarBtn}>
                        <Text style={styles.searchBarBtnText}>Search</Text>
                      </Pressable>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      {selectedTable === "sub_categories" && (
                        <Pressable
                          style={[styles.createNewBtn, { backgroundColor: '#38bdf8' }]}
                          onPress={handleSystemSync}
                        >
                          <Ionicons name="sync" size={20} color="white" />
                          <Text style={styles.createNewBtnText}>Sync Categories</Text>
                        </Pressable>
                      )}

                      {selectedTable !== "brands" && selectedTable !== "users" && (
                        <Pressable
                          style={styles.createNewBtn}
                          onPress={() => {
                            setEditingItem(null);
                            if (selectedTable === "products") setIsProductModalOpen(true);
                            else if (selectedTable === "categories") setIsCategoryModalOpen(true);
                            else if (selectedTable === "sub_categories") setIsSubCategoryModalOpen(true);
                            else if (selectedTable === "flash_sales") setIsFlashSaleModalOpen(true);
                            else if (selectedTable === "admin_users") setIsEmployeeModalOpen(true);
                            else if (selectedTable === "banners") setIsBannerModalOpen(true);
                            else if (selectedTable === "ads") setIsAdModalOpen(true);
                            else {
                              setGenericFormData({});
                              setIsGenericModalOpen(true);
                            }
                          }}
                        >
                          <Text style={styles.createNewBtnText}>Create New</Text>
                        </Pressable>
                      )}
                    </View>
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

                <View style={styles.tableHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={[styles.tableTitle, { fontSize: 18, color: '#1e293b', fontWeight: '800' }]}>
                        {selectedTable === "ads" ? "Ads List " : 
                         selectedTable === "brands" ? "Brand List" : 
                         selectedTable === "specifications" || selectedTable === "specification" ? "Specification List" : 
                         selectedTable === "specificationvalues" ? "Specification Values List" : 
                         selectedTable === "categories" ? "Category List" :
                         `${String(selectedTable || "Overview").replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} List`}
                      </Text>
                      {selectedTable === "ads" && (
                        <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '500', marginLeft: 4 }}>(max 2 ads show in home page)</Text>
                      )}
                    </View>
                  <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                    {["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(selectedTable) && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.subtleText }}>Shop</Text>
                        <View style={{ position: 'relative', zIndex: 1000 }}>
                          <Pressable 
                            onPress={() => setIsShopFilterOpen(!isShopFilterOpen)}
                            style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center', 
                              gap: 8, 
                              backgroundColor: '#fff', 
                              borderWidth: 1, 
                              borderColor: '#e2e8f0', 
                              borderRadius: 8, 
                              paddingHorizontal: 12, 
                              paddingVertical: 6,
                              minWidth: 160
                            }}
                          >
                            <Text style={{ fontSize: 13, color: colors.ink, fontWeight: '600' }}>
                                {selectedShopFilter === "all" ? "All Shop" : (metadata?.shops?.find(s => String(s.id) === String(selectedShopFilter))?.name || "Select Shop")}
                            </Text>
                            <Ionicons name="chevron-down" size={16} color={colors.subtleText} />
                          </Pressable>
                           {isShopFilterOpen && (
                             <View style={{ 
                               position: 'absolute', 
                               top: 42, 
                               left: 0, 
                               width: 200,
                               backgroundColor: 'white', 
                               borderRadius: 12, 
                               borderWidth: 1, 
                               borderColor: '#e2e8f0', 
                               zIndex: 9999, 
                               shadowColor: '#000', 
                               shadowOffset: { width: 0, height: 10 }, 
                               shadowOpacity: 0.15, 
                               shadowRadius: 20,
                               elevation: 15,
                               overflow: 'hidden'
                             }}>
                              <ScrollView style={{ maxHeight: 200 }}>
                                <Pressable 
                                  onPress={() => { setSelectedShopFilter("all"); setIsShopFilterOpen(false); pickTable(selectedTable, "all"); }} 
                                  style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                >
                                  <Text style={{ fontSize: 13, color: colors.ink }}>All Shop</Text>
                                </Pressable>
                                {(metadata?.shops || []).map(shop => (
                                  <Pressable 
                                    key={shop.id}
                                    onPress={() => { setSelectedShopFilter(shop.id); setIsShopFilterOpen(false); pickTable(selectedTable, shop.id); }} 
                                    style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                  >
                                    <Text style={{ fontSize: 13, color: colors.ink }}>{shop.name}</Text>
                                  </Pressable>
                                ))}
                              </ScrollView>
                            </View>
                          )}
                        </View>
                        <Pressable 
                          style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8 }}
                          onPress={() => { setSelectedShopFilter("all"); pickTable(selectedTable); }}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink }}>Reset</Text>
                        </Pressable>
                        <Pressable 
                          style={{ backgroundColor: '#0d5731', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
                          onPress={() => pickTable(selectedTable)}
                        >
                          <Text style={{ fontSize: 13, fontWeight: '700', color: 'white' }}>Filter Data</Text>
                        </Pressable>
                      </View>
                    )}
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
                    {!["item_requests", "update_requests", "accepted_items", "rejected_items", "brands"].includes(selectedTable) && (
                      <Pressable
                        style={styles.createBtn}
                        onPress={() => {
                          setEditingItem({});
                          setGenericFormData({});
                          if (selectedTable === "products") setIsProductModalOpen(true);
                          else if (selectedTable === "categories") setIsCategoryModalOpen(true);
                          else if (selectedTable === "sub_categories") setIsSubCategoryModalOpen(true);
                          else if (selectedTable === "shops") setIsManageShopsOpen(true);
                          else if (selectedTable === "flash_sales") setIsFlashSalesModalOpen(true);
                          else if (selectedTable === "brands") setIsBrandModalOpen(true);
                          else if (selectedTable === "specifications" || selectedTable === "specification") setIsSpecModalOpen(true);
                          else if (selectedTable === "specificationvalues") setIsSpecValueModalOpen(true);
                          else if (selectedTable === "colors") setIsColorModalOpen(true);
                          else if (selectedTable === "sizes") setIsSizeModalOpen(true);
                          else if (selectedTable === "units") setIsUnitModalOpen(true);
                          else if (selectedTable === "riders") setIsRiderModalOpen(true);
                          else if (selectedTable === "admin_users") setIsEmployeeModalOpen(true);
                          else if (selectedTable === "users") setIsUserModalOpen(true);
                          else if (selectedTable === "banners") setIsBannerModalOpen(true);
                          else if (selectedTable === "ads") setIsAdModalOpen(true);
                          else setIsGenericModalOpen(true);
                        }}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="white" />
                        <Text style={styles.createBtnText}>Create New</Text>
                      </Pressable>
                    )}
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
                            <Pressable 
                              style={[styles.shopActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]} 
                              onPress={() => handleDeleteRecord(shop.id)}
                            >
                              <Ionicons name="trash-outline" size={18} color="#ef4444" />
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
                        {(() => {
                          const customTables = ["ads", "banners", "riders", "categories", "sub_categories", "products", "brands", "specifications", "specification", "specificationvalues", "colors", "sizes", "units", "flash_sales", "admin_users", "users", "orders"];
                          if (selectedTable === "ads") {
                            return [
                               { name: "id", label: "SL", width: 60 },
                               { name: "thumbnail", label: "Thumbnail", width: 120 },
                               { name: "title", label: "Title", width: 340 },
                               { name: "status", label: "Status", width: 120 },
                               { name: "action", label: "Action", width: 150 },
                            ].map(col => (
                               <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                 <Text style={styles.columnName}>{col.label}</Text>
                                </View>
                            ));
                          }
                          if (selectedTable === "banners") {
                            return [
                               { name: "id", label: "SL", width: 60 },
                               { name: "thumbnail", label: "Thumbnail", width: 140 },
                               { name: "title", label: "Title", width: 340 },
                               { name: "status", label: "Status", width: 120 },
                               { name: "action", label: "Action", width: 150 },
                            ].map(col => (
                               <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                 <Text style={styles.columnName}>{col.label}</Text>
                                </View>
                            ));
                          }
                          if (selectedTable === "categories") {
                            return [
                              { name: "id", label: "SL", width: 80 },
                              { name: "thumbnail", label: "Thumbnail", width: 140 },
                              { name: "name", label: "Name", width: 280 },
                              { name: "status", label: "Status", width: 140 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(selectedTable)) {
                            return [
                               { name: "id", label: "SL", width: 60 },
                               { name: "thumbnail", label: "Thumbnail", width: 100 },
                               { name: "name", label: "Product Name", width: 240 },
                               { name: "category", label: "Category", width: 140 },
                               { name: "shop", label: "Shop", width: 140 },
                               { name: "purchase_price", label: "Purchase Price", width: 120 },
                               { name: "selling_price", label: "Selling Price", width: 120 },
                               { name: "verify_status", label: "Verify Status", width: 140 },
                               { name: "status", label: "Status", width: 100 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "flash_sales") {
                            return [
                               { name: "id", label: "SL", width: 60 },
                               { name: "thumbnail", label: "Thumbnail", width: 100 },
                               { name: "name", label: "Name", width: 180 },
                               { name: "start_date", label: "Start Date", width: 160 },
                               { name: "end_date", label: "End Date", width: 160 },
                               { name: "status", label: "Status", width: 100 },
                               { name: "description", label: "Description", width: 240 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "products") {
                            return [
                               { name: "id", label: "SL", width: 60 },
                               { name: "thumbnail", label: "Thumbnail", width: 100 },
                               { name: "name", label: "Product Name", width: 240 },
                               { name: "category", label: "Category", width: 140 },
                               { name: "purchase_price", label: "Purchase Price", width: 140 },
                               { name: "selling_price", label: "Selling Price", width: 140 },
                               { name: "verify_status", label: "Verify Status", width: 140 },
                               { name: "home_sections", label: "Home Sections", width: 220 },
                               { name: "status", label: "Status", width: 100 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "brands") {
                            return [
                               { name: "id", label: "SL", width: 80 },
                               { name: "name", label: "Name", width: 280 },
                               { name: "status", label: "Status", width: 120 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "specifications" || selectedTable === "specification") {
                            return [
                               { name: "id", label: "SL", width: 80 },
                               { name: "category", label: "Category", width: 180 },
                               { name: "name", label: "Name", width: 280 },
                               { name: "status", label: "Status", width: 120 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "specificationvalues") {
                            return [
                               { name: "id", label: "SL", width: 80 },
                               { name: "specification", label: "Specification Name", width: 240 },
                               { name: "name", label: "Name", width: 280 },
                               { name: "status", label: "Status", width: 120 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "colors") {
                            return [
                               { name: "id", label: "SL", width: 80 },
                               { name: "name", label: "Name", width: 280 },
                               { name: "color", label: "Color", width: 180 },
                               { name: "status", label: "Status", width: 120 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "sizes") {
                            return [
                               { name: "id", label: "SL", width: 80 },
                               { name: "name", label: "Name", width: 280 },
                               { name: "status", label: "Status", width: 120 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "units") {
                            return [
                               { name: "id", label: "SL", width: 80 },
                               { name: "name", label: "Name", width: 280 },
                               { name: "status", label: "Status", width: 120 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "riders") {
                            return [
                               { name: "id", label: "SL.", width: 60 },
                               { name: "profile", label: "Profile", width: 100 },
                               { name: "name", label: "Name", width: 220 },
                               { name: "phone", label: "Phone", width: 160 },
                               { name: "status", label: "Status", width: 120 },
                               { name: "action", label: "Action", width: 150 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                               </View>
                            ));
                          }
                          else if (selectedTable === "admin_users") {
                            return [
                               { name: "id", label: "SL.", width: 60 },
                               { name: "profile", label: "Profile", width: 100 },
                               { name: "name", label: "Name", width: 220 },
                               { name: "phone", label: "Phone", width: 160 },
                               { name: "email", label: "Email", width: 220 },
                               { name: "role", label: "Role", width: 120 },
                               { name: "action", label: "Action", width: 150 },
                            ].map(col => (
                               <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                 <Text style={styles.columnName}>{col.label}</Text>
                                </View>
                            ));
                          }
                          else if (selectedTable === "users") {
                            return [
                               { name: "id", label: "SL.", width: 60 },
                               { name: "profile", label: "Profile", width: 100 },
                               { name: "name", label: "Name", width: 220 },
                               { name: "phone", label: "Phone", width: 160 },
                               { name: "email", label: "Email", width: 220 },
                               { name: "gender", label: "Gender", width: 120 },
                               { name: "dob", label: "Date of Birth", width: 160 },
                               { name: "action", label: "Action", width: 150 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                               </View>
                            ));
                          }
                          else if (selectedTable === "sub_categories") {
                            return [
                              { name: "id", label: "SL", width: 80 },
                              { name: "thumbnail", label: "Thumbnail", width: 140 },
                              { name: "category", label: "Category", width: 180 },
                              { name: "name", label: "Name", width: 280 },
                              { name: "status", label: "Status", width: 140 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "orders") {
                            return [
                              { name: "id", label: "Order ID", width: 120 },
                              { name: "date", label: "Order Date", width: 180 },
                              { name: "customer", label: "Customer", width: 180 },
                              { name: "shop", label: "Shop", width: 180 },
                              { name: "total", label: "Total Amount", width: 140 },
                              { name: "payment", label: "Payment Method", width: 160 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          if (selectedTable === "coupons") {
                            return [
                              { name: "id", label: "SL", width: 60 },
                              { name: "code", label: "Code", width: 160 },
                              { name: "discount", label: "Discount", width: 120 },
                              { name: "min_purchase", label: "Min Amount", width: 140 },
                              { name: "start_date", label: "Started At", width: 220 },
                              { name: "expire_date", label: "Expired At", width: 220 },
                              { name: "status", label: "Status", width: 120 },
                              { name: "action", label: "Action", width: 150 },
                            ].map(col => (
                              <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                <Text style={styles.columnName}>{col.label}</Text>
                              </View>
                            ));
                          }
                          
                          if (!customTables.includes(selectedTable)) {
                            return (tableData?.columns?.slice(0, 15) || []).map((col) => {
                              if (!col) return null;
                              return (
                                <View key={col.name} style={[styles.cell, { width: col.name === "visibility" ? 220 : 140 }]}>
                                  <Text style={styles.columnName}>{col.name.replace(/_/g, ' ').toUpperCase()}</Text>
                                </View>
                              );
                            });
                          }
                        })()}
                        {!["ads", "banners", "riders", "admin_users", "users"].includes(selectedTable) && (
                          <View style={[styles.cell, { width: (selectedTable === "orders" ? 320 : 150) }]}>
                            <Text style={styles.columnName}>Action</Text>
                          </View>
                        )}
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

                                {(() => {
                                  if (selectedTable === "categories") {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 80 }]}>
                                          <Text style={styles.cellText}>{index + 1}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <View style={[styles.thumbnailContainer, { backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden' }]}>
                                            <Image source={{ uri: resolveImageUrl(row.image_url) }} style={styles.thumbnailImg} contentFit="contain" />
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 280 }]}>
                                          <Text style={[styles.cellText, { fontWeight: '600', color: colors.ink }]}>{row.name}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, "status")}>
                                            <View style={[styles.modernToggle, row.status === 1 && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, row.status === 1 && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                      </>
                                    );
                                  }
                                  if (["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(selectedTable)) {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 60 }]}>
                                          <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 100 }]}>
                                          <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 8, width: 44, height: 44, overflow: 'hidden' }]}>
                                            <Image 
                                              source={{ uri: resolveImageUrl(row.media_src || row.image_url || row.image || row.thumbnail) }} 
                                              style={styles.thumbnailImg} 
                                              contentFit="cover"
                                              placeholder="https://via.placeholder.com/60"
                                            />
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 240 }]}>
                                          <View style={{ flex: 1 }}>
                                            <Text style={[styles.cellText, { fontSize: 14, fontWeight: '700', color: colors.ink }]} numberOfLines={2}>{row.name}</Text>
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <View style={{ backgroundColor: 'rgba(13, 87, 49, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(13, 87, 49, 0.15)', alignSelf: 'flex-start' }}>
                                            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink, letterSpacing: 0.3 }}>
                                              {row.category_name || "Uncategorized"}
                                            </Text>
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <Text style={[styles.cellText, { color: '#64748b' }]} numberOfLines={1}>{row.shop_name || "Vogue By Satyabhama"}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 120 }]}>
                                          <Text style={[styles.cellText, { fontSize: 14, fontWeight: '600' }]}>₹{row.purchase_price || row.buying_price || 0}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 120 }]}>
                                          <Text style={[styles.cellText, { fontSize: 14, fontWeight: '600', color: colors.accent }]}>₹{row.unit_price || row.price || 0}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <View style={[styles.approvedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                                            <Text style={[styles.approvedBadgeText, { color: '#059669', fontWeight: '800' }]}>
                                              {selectedTable === "accepted_items" ? "Approved" : selectedTable === "item_requests" ? "Pending" : selectedTable === "rejected_items" ? "Rejected" : "Updated"}
                                            </Text>
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 100 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                            <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                      </>
                                    );
                                  }
                                  if (selectedTable === "flash_sales") {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 60 }]}>
                                          <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 100 }]}>
                                          <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 8, width: 44, height: 44, overflow: 'hidden' }]}>
                                            <Image 
                                              source={{ uri: resolveImageUrl(row.thumbnail) }} 
                                              style={styles.thumbnailImg} 
                                              contentFit="cover"
                                              placeholder="https://via.placeholder.com/60"
                                            />
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 180 }]}>
                                          <Text style={[styles.cellText, { fontWeight: '700' }]}>{row.name}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 160 }]}>
                                          <Text style={styles.cellText}>{row.start_date ? String(row.start_date).replace('T', ' ').substring(0, 10) : "N/A"}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 160 }]}>
                                          <Text style={styles.cellText}>{row.end_date ? String(row.end_date).replace('T', ' ').substring(0, 10) : "N/A"}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 100 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                            <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                        <View style={[styles.cell, { width: 240 }]}>
                                          <Text style={[styles.cellText, { color: colors.subtleText }]} numberOfLines={2}>{row.description}</Text>
                                        </View>
                                      </>
                                    );
                                  }
                                  if (selectedTable === "banners") {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 60 }]}>
                                          <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 8, width: 120, height: 40, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }]}>
                                            <Image 
                                              source={{ uri: resolveImageUrl(row.media_src || row.image_url) }} 
                                              style={styles.thumbnailImg} 
                                              contentFit="cover"
                                              placeholder="https://via.placeholder.com/120x40"
                                            />
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 340 }]}>
                                          <View style={{ flex: 1 }}>
                                            <Text style={[styles.cellText, { fontSize: 14, fontWeight: '700', color: colors.ink }]} numberOfLines={2}>{row.title || "Untitled Banner"}</Text>
                                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }} numberOfLines={1}>{row.url || "No link attached"}</Text>
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 120 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, row.status !== undefined ? "status" : "is_active")}>
                                            <View style={[styles.modernToggle, (row.status === 1 || row.is_active === 1) && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, (row.status === 1 || row.is_active === 1) && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                      </>
                                    );
                                  }
                                  if (selectedTable === "ads") {
                                     console.log(`Rendering ad row: ${row.id}`);
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 60 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <View style={{ backgroundColor: '#f8fafc', borderRadius: 8, width: 80, height: 80, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#f1f5f9' }}>
                                             <Image 
                                               source={{ uri: resolveImageUrl(row.media_src || row.image_url) }} 
                                               style={{ width: '100%', height: '100%' }} 
                                               contentFit="cover"
                                               placeholder="https://via.placeholder.com/80"
                                             />
                                           </View>
                                         </View>
                                         <View style={[styles.cell, { width: 340 }]}>
                                           <View style={{ flex: 1 }}>
                                             <Text style={[styles.cellText, { fontSize: 15, fontWeight: '700', color: colors.ink }]} numberOfLines={2}>{row.title || "Untitled Ad"}</Text>
                                             <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>ID: #{row.id}</Text>
                                           </View>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "status")}>
                                             <View style={[styles.modernToggle, (row.status === 1) && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, (row.status === 1) && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                         <View style={[styles.cell, { width: 150, flexDirection: 'row', gap: 12 }]}>
                                           <Pressable 
                                             onPress={() => {
                                               setEditingItem(row);
                                               setIsAdModalOpen(true);
                                             }}
                                             style={[styles.actionBtn, { backgroundColor: '#f0f9ff' }]}
                                           >
                                             <Ionicons name="create-outline" size={18} color="#0ea5e9" />
                                           </Pressable>
                                           <Pressable 
                                             onPress={() => handleDeleteRecord("ads", row.id)}
                                             style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]}
                                           >
                                             <Ionicons name="trash-outline" size={18} color="#f43f5e" />
                                           </Pressable>
                                         </View>
                                       </>
                                     );
                                   }
                                  if (selectedTable === "sub_categories") {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 80 }]}>
                                          <Text style={styles.cellText}>{index + 1}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <View style={[styles.thumbnailContainer, { backgroundColor: '#f8fafc', borderRadius: 8, overflow: 'hidden' }]}>
                                            <Image source={{ uri: resolveImageUrl(row.image_url) }} style={styles.thumbnailImg} contentFit="contain" />
                                          </View>
                                        </View>
                                         <View style={[styles.cell, { width: 180 }]}>
                                            <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#4f46e5' }}>
                                                  {(() => {
                                                    if (row.category_name && row.category_name !== "N/A" && row.category_name !== "null") return row.category_name;
                                                    const cid = String(row.category_id || "");
                                                    const cat = (categories || []).find(c => String(c.id) === cid);
                                                    if (cat) return cat.name;
                                                    
                                                    // Final fallback: check local catalog if categories state is empty
                                                    const fbMap = { 'fb1': "Women's Wear", 'fb2': "saree", 'fb3': "men's Wear", 'fb4': "Jewellery", 'fb5': "Fashion Accessories" };
                                                    if (fbMap[cid]) return fbMap[cid];
                                                    
                                                    return row.category_id ? `ID: ${row.category_id}` : "Choose Category";
                                                  })()}
                                                </Text>
                                            </View>
                                         </View>
                                        <View style={[styles.cell, { width: 280 }]}>
                                          <Text style={[styles.cellText, { fontWeight: '600', color: colors.ink }]}>{row.name}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                            <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                      </>
                                    );
                                  }
                                  if (selectedTable === "brands") {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 80 }]}>
                                          <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 280 }]}>
                                          <Text style={[styles.cellText, { fontWeight: '700', color: colors.ink }]}>{row.name}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 120 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                            <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                      </>
                                    );
                                  }
                                  if (selectedTable === "specifications" || selectedTable === "specification") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 80 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 180 }]}>
                                            <View style={{ backgroundColor: '#eef2ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' }}>
                                                <Text style={{ fontSize: 11, fontWeight: '600', color: '#4f46e5' }}>
                                                  {(() => {
                                                    const cid = String(row.category_id || "");
                                                    const cat = (categories || []).find(c => String(c.id) === cid);
                                                    return cat ? cat.name : (row.category_name || `ID: ${cid}`);
                                                  })()}
                                                </Text>
                                            </View>
                                         </View>
                                         <View style={[styles.cell, { width: 280 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '700', color: colors.ink }]}>{row.name}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                             <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                       </>
                                     );
                                   }
                                   if (selectedTable === "specificationvalues") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 80 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 240 }]}>
                                            <Text style={[styles.cellText, { color: colors.ink }]}>
                                              {(() => {
                                                const sid = String(row.specification_id || row.spec_id || "");
                                                const spec = (specifications || []).find(s => String(s.id) === sid);
                                                return spec ? spec.name : (row.specification_name || `ID: ${sid}`);
                                              })()}
                                            </Text>
                                         </View>
                                         <View style={[styles.cell, { width: 280 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '700', color: colors.ink }]}>{row.name}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                             <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                       </>
                                     );
                                   }
                                   if (selectedTable === "colors") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 80 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 280 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '600', color: colors.ink }]}>{row.name}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 180 }]}>
                                           <View style={{ width: 44, height: 28, backgroundColor: row.color_code || row.code || '#000', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }} />
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                             <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                       </>
                                     );
                                   }
                                   if (selectedTable === "sizes") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 80 }]}>
                                            <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 280 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '600', color: colors.ink }]}>{row.name || row.size}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                             <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                       </>
                                     );
                                   }
                                   if (selectedTable === "units") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 80 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 280 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '600', color: colors.ink }]}>{row.name}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                             <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                       </>
                                     );
                                   }
                                   if (selectedTable === "riders") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 60 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 100 }]}>
                                           <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 8, width: 44, height: 44, overflow: 'hidden' }]}>
                                             <Image 
                                               source={{ uri: resolveImageUrl(row.profile_image) }} 
                                               style={styles.thumbnailImg} 
                                               contentFit="cover"
                                               placeholder="https://via.placeholder.com/60"
                                             />
                                           </View>
                                         </View>
                                         <View style={[styles.cell, { width: 220 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '700' }]}>{row.first_name} {row.last_name}</Text>
                                           <Text style={[styles.cellText, { fontSize: 12, color: colors.subtleText }]}>{row.email}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 160 }]}>
                                           <Text style={styles.cellText}>{row.phone}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Pressable onPress={() => handleToggleTableStatus(row, "status")}>
                                             <View style={[styles.modernToggle, row.status === 1 && styles.modernToggleActive]}>
                                               <View style={[styles.modernToggleThumb, row.status === 1 && styles.modernToggleThumbActive]} />
                                             </View>
                                           </Pressable>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <View style={{ flexDirection: 'row', gap: 8 }}>
                                             <Pressable onPress={() => { setEditingItem(row); setIsRiderModalOpen(true); }} style={[styles.actionBtn, { backgroundColor: '#f1f5f9' }]}>
                                               <Ionicons name="pencil" size={16} color="#475569" />
                                             </Pressable>
                                             <Pressable onPress={() => handleDeleteRecord("riders", row.id)} style={[styles.actionBtn, { backgroundColor: '#fee2e2' }]}>
                                               <Ionicons name="trash" size={16} color="#ef4444" />
                                             </Pressable>
                                           </View>
                                         </View>
                                       </>
                                     );
                                   }
                                   else if (selectedTable === "admin_users") {
                                      return (
                                        <>
                                          <View style={[styles.cell, { width: 60 }]}>
                                            <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 100 }]}>
                                            <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 22, width: 44, height: 44, overflow: 'hidden' }]}>
                                              <Image 
                                                source={{ uri: resolveImageUrl(row.image || row.profile_image) }} 
                                                style={styles.thumbnailImg} 
                                                contentFit="cover"
                                                placeholder="https://via.placeholder.com/60"
                                              />
                                            </View>
                                          </View>
                                          <View style={[styles.cell, { width: 220 }]}>
                                            <Text style={[styles.cellText, { fontWeight: '700' }]}>{row.name || (row.first_name + ' ' + (row.last_name || ""))}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 160 }]}>
                                            <Text style={styles.cellText}>{row.phone || "--"}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 220 }]}>
                                            <Text style={styles.cellText}>{row.email}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 120 }]}>
                                            <View style={{ backgroundColor: String(row.role || "").toLowerCase() === 'root' ? '#0d5731' : '#0ea5e9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                                              <Text style={{ color: 'white', fontSize: 11, fontWeight: '800', textTransform: 'lowercase' }}>{row.role || "admin"}</Text>
                                            </View>
                                          </View>
                                          <View style={[styles.cell, { width: 160 }]}>
                                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                              {String(row.role || "").toLowerCase() !== 'root' ? (
                                                <>
                                                  <Pressable 
                                                    style={[styles.actionBtn, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7', borderWidth: 1, padding: 8, borderRadius: 8 }]}
                                                    onPress={() => {
                                                      setEditingItem(row);
                                                      setIsEmployeeModalOpen(true);
                                                    }}
                                                  >
                                                    <Ionicons name="settings-outline" size={18} color="#10b981" />
                                                  </Pressable>
                                                  <Pressable onPress={() => handleResetPassword("admin_users", row)} style={[styles.actionBtn, { backgroundColor: '#fffbeb', borderColor: '#fef3c7', borderWidth: 1, padding: 8, borderRadius: 8 }]}>
                                                    <Ionicons name="key-outline" size={18} color="#f59e0b" />
                                                  </Pressable>
                                                  <Pressable onPress={() => handleDeleteRecord(row.id)} style={[styles.actionBtn, { backgroundColor: '#fff1f2', borderColor: '#ffe4e6', borderWidth: 1, padding: 8, borderRadius: 8 }]}>
                                                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                                  </Pressable>
                                                </>
                                              ) : (
                                                <Text style={[styles.cellText, { color: '#94a3b8', fontStyle: 'italic' }]}>N/A</Text>
                                              )}
                                            </View>
                                          </View>
                                        </>
                                      );
                                    }
                                    if (selectedTable === "users") {
                                     return (
                                       <>
                                         <View style={[styles.cell, { width: 60 }]}>
                                           <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 100 }]}>
                                           <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 22, width: 44, height: 44, overflow: 'hidden' }]}>
                                             <Image 
                                               source={{ uri: resolveImageUrl(row.image || row.profile_image) }} 
                                               style={styles.thumbnailImg} 
                                               contentFit="cover"
                                               placeholder="https://via.placeholder.com/60"
                                             />
                                           </View>
                                         </View>
                                         <View style={[styles.cell, { width: 220 }]}>
                                           <Text style={[styles.cellText, { fontWeight: '700' }]}>{row.name || (row.first_name + ' ' + row.last_name)}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 160 }]}>
                                           <Text style={styles.cellText}>{row.phone || "--"}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 220 }]}>
                                           <Text style={styles.cellText}>{row.email}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 120 }]}>
                                           <Text style={[styles.cellText, { color: '#94a3b8' }]}>{row.gender || "--"}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 160 }]}>
                                           <Text style={[styles.cellText, { color: '#94a3b8' }]}>{row.dob || "--"}</Text>
                                         </View>
                                         <View style={[styles.cell, { width: 160 }]}>
                                           <View style={{ flexDirection: 'row', gap: 12 }}>
                                             <Pressable style={[styles.actionBtn, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 }]}>
                                               <Ionicons name="create-outline" size={18} color="#10b981" />
                                             </Pressable>
                                             <Pressable onPress={() => handleDeleteRecord(row.id)} style={[styles.actionBtn, { backgroundColor: '#fff1f2', borderColor: '#ffe4e6', borderWidth: 1 }]}>
                                               <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                             </Pressable>
                                             <Pressable style={[styles.actionBtn, { backgroundColor: '#eff6ff', borderColor: '#dbeafe', borderWidth: 1 }]}>
                                               <Ionicons name="key-outline" size={18} color="#3b82f6" />
                                             </Pressable>
                                           </View>
                                         </View>
                                       </>
                                     );
                                   }
                                  if (selectedTable === "products") {
                                    return (
                                      <>
                                        <View style={[styles.cell, { width: 60 }]}>
                                          <Text style={styles.cellText}>{index +  startIndex + 1}</Text>
                                        </View>
                                         <View style={[styles.cell, { width: 100 }]}>
                                           <View style={[styles.thumbnailContainer, { backgroundColor: '#f1f5f9', borderRadius: 8, width: 44, height: 44, overflow: 'hidden' }]}>
                                             <Image 
                                               source={{ uri: resolveImageUrl(row.media_src || row.image_url || row.image || row.thumbnail) }} 
                                               style={styles.thumbnailImg} 
                                               contentFit="cover"
                                               placeholder="https://via.placeholder.com/60"
                                             />
                                           </View>
                                         </View>
                                         <View style={[styles.cell, { width: 240 }]}>
                                           <View style={{ flex: 1 }}>
                                             <Text style={[styles.cellText, { fontSize: 14, fontWeight: '700', color: colors.ink }]} numberOfLines={2}>{row.name}</Text>
                                           </View>
                                         </View>
                                         <View style={[styles.cell, { width: 140 }]}>
                                           <View style={{ backgroundColor: 'rgba(13, 87, 49, 0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(13, 87, 49, 0.15)', alignSelf: 'flex-start' }}>
                                             <Text style={{ fontSize: 12, fontWeight: '700', color: colors.ink, letterSpacing: 0.3 }}>
                                               {row.category_name || "Uncategorized"}
                                             </Text>
                                           </View>
                                         </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <Text style={[styles.cellText, { fontSize: 14, fontWeight: '600' }]}>₹{row.purchase_price || row.buying_price || 0}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <Text style={[styles.cellText, { fontSize: 14, fontWeight: '600', color: colors.accent }]}>₹{row.unit_price || row.price || 0}</Text>
                                        </View>
                                        <View style={[styles.cell, { width: 140 }]}>
                                          <View style={[styles.approvedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                            <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                                            <Text style={[styles.approvedBadgeText, { color: '#059669', fontWeight: '800' }]}>Approved</Text>
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 220 }]}>
                                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                                            {row.is_featured === 1 && <View style={{backgroundColor: '#3b82f6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Featured</Text></View>}
                                            {row.is_auspicious === 1 && <View style={{backgroundColor: '#f59e0b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Auspicious</Text></View>}
                                            {row.is_banner_main === 1 && <View style={{backgroundColor: '#8b5cf6', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Main</Text></View>}
                                            {row.is_banner_earrings === 1 && <View style={{backgroundColor: '#ec4899', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Earrings</Text></View>}
                                            {row.is_banner_necklaces === 1 && <View style={{backgroundColor: '#ec4899', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Necklaces</Text></View>}
                                            {row.is_popular_jewellery === 1 && <View style={{backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Popular</Text></View>}
                                            {row.is_mens_shirts === 1 && <View style={{backgroundColor: '#64748b', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Men</Text></View>}
                                            {row.is_womens_highlights === 1 && <View style={{backgroundColor: '#db2777', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Women</Text></View>}
                                            {row.is_premium_sarees === 1 && <View style={{backgroundColor: '#9333ea', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Sarees</Text></View>}
                                            {row.is_ad === 1 && <View style={{backgroundColor: '#ef4444', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4}}><Text style={{color: 'white', fontSize: 9, fontWeight: '700'}}>Ad</Text></View>}
                                          </View>
                                        </View>
                                        <View style={[styles.cell, { width: 100 }]}>
                                          <Pressable onPress={() => handleToggleTableStatus(row, "is_active")}>
                                            <View style={[styles.modernToggle, row.is_active === 1 && styles.modernToggleActive]}>
                                              <View style={[styles.modernToggleThumb, row.is_active === 1 && styles.modernToggleThumbActive]} />
                                            </View>
                                          </Pressable>
                                        </View>
                                      </>
                                    );
                                  }
                                    if (selectedTable === "orders") {
                                      const isPaid = String(row.payment_status || "").toLowerCase() === "paid";
                                      return (
                                        <>
                                          <View style={[styles.cell, { width: 120 }]}>
                                            <Text style={[styles.cellText, { fontWeight: '700', color: '#0d5731' }]}>{row.id || "RC000000"}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 180 }]}>
                                            <Text style={[styles.cellText, { fontSize: 12 }]}>{row.created_at ? new Date(row.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "N/A"}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 180 }]}>
                                            <Text style={[styles.cellText, { fontWeight: '600' }]} numberOfLines={1}>{row.customer_name || row.user_name || "Guest Customer"}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 180 }]}>
                                            <Text style={[styles.cellText, { color: '#64748b' }]} numberOfLines={1}>{row.shop_name || "Main Store"}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 140 }]}>
                                            <Text style={[styles.cellText, { fontWeight: '800' }]}>₹{row.total_amount || 0}</Text>
                                            <View style={[styles.paidBadge, { backgroundColor: isPaid ? "#3b82f6" : "#f59e0b" }]}>
                                              <Text style={styles.paidBadgeText}>{isPaid ? "Paid" : "Pending"}</Text>
                                            </View>
                                          </View>
                                          <View style={[styles.cell, { width: 160 }]}>
                                            <Text style={styles.cellText}>{row.payment_method || "Cash Payment"}</Text>
                                          </View>
                                        </>
                                      );
                                    }
                                    if (selectedTable === "coupons") {
                                      return (
                                        <>
                                          <View style={[styles.cell, { width: 60 }]}>
                                            <Text style={styles.cellText}>{index + startIndex + 1}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 160 }]}>
                                            <Text style={[styles.cellText, { fontWeight: '800', color: '#0d5731' }]}>{row.code}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 120 }]}>
                                            <Text style={[styles.cellText, { fontWeight: '700' }]}>
                                              {row.discount_type === 'percentage' ? `${row.discount}%` : `₹${row.discount}`}
                                            </Text>
                                          </View>
                                          <View style={[styles.cell, { width: 140 }]}>
                                            <Text style={styles.cellText}>₹{row.min_purchase}</Text>
                                          </View>
                                          <View style={[styles.cell, { width: 220 }]}>
                                            <Text style={[styles.cellText, { fontSize: 12 }]}>
                                              {row.start_date ? new Date(row.start_date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A"}
                                            </Text>
                                          </View>
                                          <View style={[styles.cell, { width: 220 }]}>
                                            <Text style={[styles.cellText, { fontSize: 12 }]}>
                                              {row.expire_date ? new Date(row.expire_date).toLocaleString('en-US', { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : "N/A"}
                                            </Text>
                                          </View>
                                          <View style={[styles.cell, { width: 120 }]}>
                                            <Pressable onPress={() => handleToggleTableStatus(row, "status")}>
                                              <View style={[styles.modernToggle, row.status === 1 && styles.modernToggleActive]}>
                                                <View style={[styles.modernToggleThumb, row.status === 1 && styles.modernToggleThumbActive]} />
                                              </View>
                                            </Pressable>
                                          </View>
                                          <View style={[styles.cell, { width: 150, flexDirection: 'row', gap: 12 }]}>
                                            <Pressable 
                                              onPress={() => {
                                                setEditingItem(row);
                                                setIsGenericModalOpen(true);
                                              }}
                                              style={[styles.actionBtn, { backgroundColor: '#f0f9ff' }]}
                                            >
                                              <Ionicons name="create-outline" size={18} color="#0ea5e9" />
                                            </Pressable>
                                            <Pressable 
                                              onPress={() => handleDeleteRecord("coupons", row.id)}
                                              style={[styles.actionBtn, { backgroundColor: '#fff1f2' }]}
                                            >
                                              <Ionicons name="trash-outline" size={18} color="#f43f5e" />
                                            </Pressable>
                                          </View>
                                        </>
                                      );
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

                                  <View style={[styles.cell, { width: (selectedTable === "orders" ? 320 : (["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(selectedTable) ? 240 : 150)), flexDirection: "row", gap: 8, alignItems: "center" }]}>
                                    {["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(selectedTable) ? (
                                      <>
                                        <Pressable 
                                          style={{ backgroundColor: '#ecfdf5', padding: 8, borderRadius: 8 }} 
                                          onPress={() => handleProductAction(row.id, "accept")}
                                        >
                                          <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                                        </Pressable>
                                        <Pressable 
                                          style={{ backgroundColor: '#fef2f2', padding: 8, borderRadius: 8 }} 
                                          onPress={() => handleProductAction(row.id, "reject")}
                                        >
                                          <Ionicons name="close-circle-outline" size={20} color="#ef4444" />
                                        </Pressable>
                                        <Pressable 
                                          style={{ backgroundColor: '#f1f5f9', padding: 8, borderRadius: 8 }} 
                                          onPress={() => { setViewingItem(row); setIsViewModalOpen(true); }}
                                        >
                                          <Ionicons name="eye-outline" size={20} color="#0d5731" />
                                        </Pressable>
                                        <Pressable 
                                          style={{ backgroundColor: '#fff1f2', padding: 8, borderRadius: 8 }} 
                                          onPress={() => handleDeleteRecord(row.id)}
                                        >
                                          <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                        </Pressable>
                                      </>
                                    ) : (
                                      <>
                                        <Pressable
                                          style={[styles.actionIconBtn, { backgroundColor: '#f0f9ff' }]}
                                          onPress={() => { setViewingItem(row); setIsViewModalOpen(true); }}
                                        >
                                          <Ionicons name="eye-outline" size={16} color="#0369a1" />
                                        </Pressable>
    
                                        {selectedTable === "orders" && (
                                          <>
                                            <View style={{ flexDirection: 'row', gap: 6, flex: 1 }}>
                                              {(() => {
                                                const status = String(row.order_status || "").toLowerCase().trim();
                                                if (status === "pending" || status === "placed") return (
                                                  <Pressable 
                                                    style={[styles.statusUpdateBtn, { backgroundColor: '#38bdf8' }]}
                                                    onPress={() => handleOrderLifecycleUpdate(row.id, "confirm")}
                                                    disabled={orderStatusUpdatingKey === `${row.id}:confirm`}
                                                  >
                                                    {orderStatusUpdatingKey === `${row.id}:confirm` ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.statusUpdateBtnText}>Confirm</Text>}
                                                  </Pressable>
                                                );
                                                if (status === "confirm" || status === "confirmed") return (
                                                  <Pressable 
                                                    style={[styles.statusUpdateBtn, { backgroundColor: '#a855f7' }]}
                                                    onPress={() => handleOrderLifecycleUpdate(row.id, "processing")}
                                                    disabled={orderStatusUpdatingKey === `${row.id}:processing`}
                                                  >
                                                    {orderStatusUpdatingKey === `${row.id}:processing` ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.statusUpdateBtnText}>Process</Text>}
                                                  </Pressable>
                                                );
                                                if (status === "processing") return (
                                                  <Pressable 
                                                    style={[styles.statusUpdateBtn, { backgroundColor: '#6366f1' }]}
                                                    onPress={() => handleOrderLifecycleUpdate(row.id, "pickup")}
                                                    disabled={orderStatusUpdatingKey === `${row.id}:pickup`}
                                                  >
                                                    {orderStatusUpdatingKey === `${row.id}:pickup` ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.statusUpdateBtnText}>Packed</Text>}
                                                  </Pressable>
                                                );
                                                if (status === "pickup" || status === "packed") return (
                                                  <Pressable 
                                                    style={[styles.statusUpdateBtn, { backgroundColor: '#8b5cf6' }]}
                                                    onPress={() => handleOrderLifecycleUpdate(row.id, "on_the_way")}
                                                    disabled={orderStatusUpdatingKey === `${row.id}:on_the_way`}
                                                  >
                                                    {orderStatusUpdatingKey === `${row.id}:on_the_way` ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.statusUpdateBtnText}>Ship</Text>}
                                                  </Pressable>
                                                );
                                                if (status === "on the way" || status === "shipped") return (
                                                  <Pressable 
                                                    style={[styles.statusUpdateBtn, { backgroundColor: '#10b981' }]}
                                                    onPress={() => handleOrderLifecycleUpdate(row.id, "delivered")}
                                                    disabled={orderStatusUpdatingKey === `${row.id}:delivered`}
                                                  >
                                                    {orderStatusUpdatingKey === `${row.id}:delivered` ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.statusUpdateBtnText}>Deliver</Text>}
                                                  </Pressable>
                                                );
                                                return null;
                                              })()}
    
                                              {["pending", "placed", "confirm", "confirmed", "processing"].includes(String(row.order_status || "").toLowerCase().trim()) && (
                                                <Pressable 
                                                  style={[styles.statusUpdateBtn, { backgroundColor: '#ef4444' }]}
                                                  onPress={() => handleOrderLifecycleUpdate(row.id, "cancelled")}
                                                  disabled={orderStatusUpdatingKey === `${row.id}:cancelled`}
                                                >
                                                  {orderStatusUpdatingKey === `${row.id}:cancelled` ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.statusUpdateBtnText}>Cancel</Text>}
                                                </Pressable>
                                              )}
                                            </View>
    
                                            <Pressable 
                                              style={[styles.actionIconBtn, { backgroundColor: '#f1f5f9' }]}
                                              onPress={() => {
                                                if (Platform.OS === 'web') {
                                                  const printWindow = window.open('', '_blank');
                                                  const invoiceHtml = generateInvoiceHtml(row);
                                                  printWindow.document.write(invoiceHtml);
                                                  printWindow.document.close();
                                                } else {
                                                  Alert.alert("Invoice", "Invoice download started for Order #" + row.id);
                                                }
                                              }}
                                            >
                                              <Ionicons name="download-outline" size={16} color="#475569" />
                                            </Pressable>
                                          </>
                                        )}
    
                                        {selectedTable === "products" && (
                                          <Pressable style={[styles.actionIconBtn, { backgroundColor: '#f5f3ff' }]}>
                                            <Ionicons name="barcode-outline" size={16} color="#7c3aed" />
                                          </Pressable>
                                        )}
    
                                        {selectedTable !== "orders" && (
                                          <View style={{ flexDirection: 'row', gap: 12 }}>
                                            <Pressable 
                                              style={[styles.actionIconBtn, { backgroundColor: '#ebf7f0', borderColor: 'transparent' }]} 
                                              onPress={() => {
                                                setEditingItem(row);
                                                if (selectedTable === "products") setIsProductModalOpen(true);
                                                else if (selectedTable === "categories") setIsCategoryModalOpen(true);
                                                else if (selectedTable === "sub_categories") setIsSubCategoryModalOpen(true);
                                                else if (selectedTable === "brands") setIsBrandModalOpen(true);
                                                else if (selectedTable === "specifications" || selectedTable === "specification") setIsSpecModalOpen(true);
                                                else if (selectedTable === "specificationvalues") setIsSpecValueModalOpen(true);
                                                else if (selectedTable === "colors") setIsColorModalOpen(true);
                                                else if (selectedTable === "sizes") setIsSizeModalOpen(true);
                                                else if (selectedTable === "units") setIsUnitModalOpen(true);
                                                else if (selectedTable === "shops") {
                                                  setGenericFormData(row);
                                                  setIsManageShopsOpen(true);
                                                } else if (selectedTable === "flash_sales") {
                                                  setEditingItem(row);
                                                  setIsFlashSaleModalOpen(true);
                                                } else if (selectedTable === "banners") {
                                                  setGenericFormData(row);
                                                  setEditingItem(row);
                                                  setIsBannerModalOpen(true);
                                                } else if (selectedTable === "ads") {
                                                  setGenericFormData(row);
                                                  setEditingItem(row);
                                                  setIsAdModalOpen(true);
                                                } else {
                                                  setGenericFormData(row);
                                                  setIsGenericModalOpen(true);
                                                }
                                              }}
                                            >
                                              <Ionicons name="create-outline" size={18} color="#0d5731" />
                                            </Pressable>
                                            
                                            <Pressable 
                                              style={[styles.actionIconBtn, { backgroundColor: '#fff1f2', borderColor: 'transparent' }]} 
                                              onPress={() => handleDeleteRecord(row.id)}
                                            >
                                              <Ionicons name="trash-outline" size={18} color="#ef4444" />
                                            </Pressable>
                                          </View>
                                        )}
                                      </>
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
        visible={isProductModalOpen || (editingItem && selectedTable === "products")}
        item={editingItem}
        categories={categories}
        subCategories={subCategories}
        colorOptions={availableColors}
        sizeOptions={availableSizes}
        brands={brands}
        units={units}
        onClose={() => { setIsProductModalOpen(false); setEditingItem(null); }}
        onSave={handleSaveProduct}
      />

      <CategoryModal
        visible={isCategoryModalOpen}
        item={editingItem}
        onClose={() => { setIsCategoryModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("categories", data, setIsCategoryModalOpen)}
      />

      <SubCategoryModal
        visible={isSubCategoryModalOpen}
        item={editingItem}
        categories={categories}
        onClose={() => { setIsSubCategoryModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("sub_categories", data, setIsSubCategoryModalOpen)}
      />

      <BrandModal
        visible={isBrandModalOpen}
        item={editingItem}
        onClose={() => { setIsBrandModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("brands", data, setIsBrandModalOpen)}
      />

      <SpecificationModal
        visible={isSpecModalOpen}
        item={editingItem}
        categories={categories}
        onClose={() => { setIsSpecModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("specifications", data, setIsSpecModalOpen)}
      />

      <SpecificationValueModal
        visible={isSpecValueModalOpen}
        item={editingItem}
        specifications={specifications}
        onClose={() => { setIsSpecValueModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("specificationvalues", data, setIsSpecValueModalOpen)}
      />

      <ColorModal
        visible={isColorModalOpen}
        item={editingItem}
        onClose={() => { setIsColorModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("colors", data, setIsColorModalOpen)}
      />

      <SizeModal
        visible={isSizeModalOpen}
        item={editingItem}
        onClose={() => { setIsSizeModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("sizes", data, setIsSizeModalOpen)}
      />

      <UnitModal
        visible={isUnitModalOpen}
        item={editingItem}
        onClose={() => { setIsUnitModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("units", data, setIsUnitModalOpen)}
      />

      <FlashSaleModal
        visible={isFlashSaleModalOpen}
        item={editingItem}
        onClose={() => { setIsFlashSaleModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("flash_sales", data, setIsFlashSaleModalOpen)}
      />

      <RiderModal
        visible={isRiderModalOpen}
        item={editingItem}
        onClose={() => { setIsRiderModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("riders", data, setIsRiderModalOpen)}
      />

      <UserModal
        visible={isUserModalOpen}
        item={editingItem}
        onClose={() => { setIsUserModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("users", data, setIsUserModalOpen)}
      />

      <EmployeeModal
        visible={isEmployeeModalOpen}
        item={editingItem}
        onClose={() => { setIsEmployeeModalOpen(false); setEditingItem(null); }}
        onSave={(data) => handleSaveRecord("admin_users", data, setIsEmployeeModalOpen)}
      />

      {['users', 'admin_users'].includes(selectedTable) ? (
        <CustomerModal
          visible={isGenericModalOpen}
          item={genericFormData}
          onClose={() => { setIsGenericModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
          onSave={handleSaveGenericEntry}
        />
      ) : selectedTable === 'banners' ? (
        <BannerModal
          visible={isBannerModalOpen}
          item={editingItem}
          onClose={() => { setIsBannerModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
          onSave={(data) => handleSaveRecord("banners", data, setIsBannerModalOpen)}
        />
      ) : selectedTable === 'ads' ? (
        <AdModal
          visible={isAdModalOpen}
          item={editingItem}
          onClose={() => { setIsAdModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
          onSave={(data) => handleSaveRecord("ads", data, setIsAdModalOpen)}
        />
      ) : selectedTable === 'coupons' ? (
        <CouponModal
          visible={isGenericModalOpen}
          editingItem={editingItem}
          onClose={() => { setIsGenericModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
          onSave={(data) => handleSaveRecord("coupons", data, setIsGenericModalOpen)}
        />
      ) : selectedTable === 'notifications' ? (
        <NotificationModal
          visible={isGenericModalOpen}
          item={genericFormData}
          onClose={() => { setIsGenericModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
          onSave={handleSaveGenericEntry}
        />
      ) : (
        <GenericEntryModal
          visible={isGenericModalOpen}
          tableName={selectedTable}
          columns={tableData?.columns}
          formData={genericFormData}
          onClose={() => { setIsGenericModalOpen(false); setEditingItem(null); setGenericFormData({}); }}
          onSave={handleSaveGenericEntry}
          onChange={setGenericFormData}
        />
      )}

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
            
            // Optimization: Only send changed fields to avoid huge payloads (e.g. unchanged base64 images)
            const changes = {};
            Object.keys(updatedShop).forEach(key => {
              if (updatedShop[key] !== editingItem[key]) {
                changes[key] = updatedShop[key];
              }
            });

            if (Object.keys(changes).length === 0 && shopId) {
              setIsManageShopsOpen(false);
              setEditingItem(null);
              return;
            }

            const endpoint = shopId
              ? `/admin/data/tables/shops/${shopId}`
              : `/admin/data/tables/shops`;
            const method = shopId ? "PUT" : "POST";

            const res = await apiRequest(endpoint, {
              method,
              token,
              body: sanitizeTableData(shopId ? changes : updatedShop)
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
        <View style={[modalStyles.header, { padding: 20, borderBottomWidth: 1, borderColor: "#f1f5f9", marginBottom: 0 }]}>
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
            borderColor: "#f1f5f9",
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
                      borderRightWidth: isMobile ? 1 : 0,
                      borderColor: "#f1f5f9",
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

        <View style={[modalStyles.footer, { padding: 20, borderTopWidth: 1, borderColor: "#f1f5f9", backgroundColor: 'white' }]}>
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

function ProductModal({ visible, item, categories, subCategories = [], colorOptions, sizeOptions, brands = [], units = [], onClose, onSave }) {
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
  const [shortDesc, setShortDesc] = useState("");
  const [img, setImg] = useState("");
  const [catId, setCatId] = useState("");
  const [subCatId, setSubCatId] = useState("");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState("");
  const [code, setCode] = useState("");
  const [hsinCode, setHsinCode] = useState("");
  const [buyPrice, setBuyPrice] = useState("0");
  const [specifications, setSpecifications] = useState("");
  const [vatTax, setVatTax] = useState("0");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  
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
  const [isCatDropdownOpen, setIsCatDropdownOpen] = useState(false);
  const [isSubCatDropdownOpen, setIsSubCatDropdownOpen] = useState(false);
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);
  const [catSearchQuery, setCatSearchQuery] = useState("");
  const [subCatSearchQuery, setSubCatSearchQuery] = useState("");
  const [brandSearchQuery, setBrandSearchQuery] = useState("");
  const [unitSearchQuery, setUnitSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      setPrice(String(item?.price || item?.unit_price || ""));
      setDiscountPrice(String(item?.discount_price || "0"));
      setQuantity(String(item?.quantity || item?.stock || "0"));
      setMetal(item?.metal || "");
      setWeight(item?.weight || "");
      setSize(item?.size || "");
      setDesc(item?.description || "");
      setShortDesc(item?.short_description || "");
      setImg(item?.media_src || item?.image || item?.image_url || "");
      setCatId(item?.category_id || "");
      setSubCatId(item?.sub_category_id || "");
      setBrand(item?.brand || item?.brand_id || "");
      setUnit(item?.unit || item?.unit_id || "");
      setCode(item?.code || item?.sku || "");
      setHsinCode(item?.hsin_code || item?.hsn_code || "");
      setBuyPrice(String(item?.buy_price || item?.purchase_price || item?.buying_price || "0"));
      setSpecifications(item?.spcifications || item?.specifications || "");
      setVatTax(String(item?.vat_tax || "0"));
      setMinOrderQty(String(item?.min_order_qty || "1"));
      setMetaTitle(item?.meta_title || "");
      setMetaDesc(item?.meta_description || "");
      setMetaKeywords(item?.meta_keywords || "");

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
      setIsCatDropdownOpen(false);
      setIsSubCatDropdownOpen(false);
      setIsBrandDropdownOpen(false);
      setIsUnitDropdownOpen(false);
      setCatSearchQuery("");
      setSubCatSearchQuery("");
      setBrandSearchQuery("");
      setUnitSearchQuery("");
    }
  }, [visible, item]);

  if (!visible) return null;

  const selectedCategory = categories.find(c => String(c.id) === String(catId));
  const filteredSubCategories = (subCategories || []).filter(sc => String(sc.category_id) === String(catId));
  const selectedSubCategory = filteredSubCategories.find(sc => String(sc.id) === String(subCatId));
  
  const filteredCategoriesForSearch = (categories || []).filter(c => (c.name || "").toLowerCase().includes(catSearchQuery.toLowerCase()));
  const filteredSubCatsForSearch = (filteredSubCategories || []).filter(sc => (sc.name || "").toLowerCase().includes(subCatSearchQuery.toLowerCase()));
  
  const selectedBrand = (brands || []).find(b => String(b.id) === String(brand));
  const filteredBrandsForSearch = (brands || []).filter(b => (b.name || "").toLowerCase().includes(brandSearchQuery.toLowerCase()));
  
  const selectedUnit = (units || []).find(u => String(u.id) === String(unit));
  const filteredUnitsForSearch = (units || []).filter(u => (u.name || "").toLowerCase().includes(unitSearchQuery.toLowerCase()));

  const ModalSection = ({ title, icon, children, style }) => (
    <View style={[{ marginBottom: 32 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 900, height: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(13, 87, 49, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cube" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={modalStyles.title}>{item ? "Update Product" : "Create New Product"}</Text>
              <Text style={{ fontSize: 12, color: colors.subtleText }}>Manage your catalogue information</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: '#f8fafc' }}>
            <Ionicons name="close" size={24} color={colors.subtleText} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          <ModalSection title="Product Information" icon="information-circle-outline" style={{ zIndex: 1000 }}>
            <View style={styles.formRow}>
               <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Product Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput value={name} onChangeText={setName} style={modalStyles.input} placeholder="e.g. Floral Print Yellow Anarkali" />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Short Description</Text>
                <TextInput 
                  value={shortDesc} 
                  onChangeText={setShortDesc} 
                  style={[modalStyles.input, { height: 60 }]} 
                  placeholder="Brief highlight about the product..."
                  multiline
                />
              </View>
            </View>

            <View style={[styles.formRow, { zIndex: 1000 }]}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Category <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <View style={{ zIndex: 3000 }}>
                  <Pressable 
                    onPress={() => setIsCatDropdownOpen(!isCatDropdownOpen)}
                    style={[modalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ color: selectedCategory ? colors.ink : '#94a3b8' }}>
                      {selectedCategory ? selectedCategory.name : "Select Category"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </Pressable>
                  {isCatDropdownOpen && (
                    <View style={{ position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 4000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <TextInput 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', outlineStyle: 'none' }}
                        placeholder="Search categories..."
                        value={catSearchQuery}
                        onChangeText={setCatSearchQuery}
                      />
                      <ScrollView style={{ maxHeight: 200 }}>
                        {filteredCategoriesForSearch.map(cat => (
                          <Pressable 
                            key={cat.id} 
                            onPress={() => { setCatId(cat.id); setSubCatId(""); setIsCatDropdownOpen(false); }} 
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: catId === cat.id ? '#f8fafc' : 'transparent' }}
                          >
                            <Text style={{ fontSize: 14, color: catId === cat.id ? colors.accent : colors.ink, fontWeight: catId === cat.id ? '700' : '500' }}>{cat.name}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Sub Category</Text>
                <View style={{ zIndex: 2000 }}>
                  <Pressable 
                    onPress={() => catId && setIsSubCatDropdownOpen(!isSubCatDropdownOpen)}
                    style={[modalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: catId ? 1 : 0.6 }]}
                  >
                    <Text style={{ color: selectedSubCategory ? colors.ink : '#94a3b8' }}>
                      {selectedSubCategory ? selectedSubCategory.name : (catId ? "Select Sub Category" : "Choose Category First")}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </Pressable>
                  {isSubCatDropdownOpen && catId && (
                    <View style={{ position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 4000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {filteredSubCatsForSearch.map(sc => (
                          <Pressable 
                            key={sc.id} 
                            onPress={() => { setSubCatId(sc.id); setIsSubCatDropdownOpen(false); }} 
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: subCatId === sc.id ? '#f8fafc' : 'transparent' }}
                          >
                            <Text style={{ fontSize: 14, color: subCatId === sc.id ? colors.accent : colors.ink, fontWeight: subCatId === sc.id ? '700' : '500' }}>{sc.name}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Select Brand</Text>
                <View style={{ zIndex: 1500 }}>
                  <Pressable 
                    onPress={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                    style={[modalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ color: selectedBrand ? colors.ink : '#94a3b8' }}>
                      {selectedBrand ? selectedBrand.name : "Select Brand"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </Pressable>
                  {isBrandDropdownOpen && (
                    <View style={{ position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 4000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <TextInput 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', outlineStyle: 'none' }}
                        placeholder="Search brands..."
                        value={brandSearchQuery}
                        onChangeText={setBrandSearchQuery}
                      />
                      <ScrollView style={{ maxHeight: 200 }}>
                        {filteredBrandsForSearch.map(b => (
                          <Pressable 
                            key={b.id} 
                            onPress={() => { setBrand(b.id); setIsBrandDropdownOpen(false); }} 
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: String(brand) === String(b.id) ? '#f8fafc' : 'transparent' }}
                          >
                            <Text style={{ fontSize: 14, color: String(brand) === String(b.id) ? colors.accent : colors.ink, fontWeight: String(brand) === String(b.id) ? '700' : '500' }}>{b.name}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={[styles.formRow, { zIndex: 500 }]}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Select Unit</Text>
                <View style={{ zIndex: 1000 }}>
                  <Pressable 
                    onPress={() => setIsUnitDropdownOpen(!isUnitDropdownOpen)}
                    style={[modalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ color: selectedUnit ? colors.ink : '#94a3b8' }}>
                      {selectedUnit ? selectedUnit.name : "Select Unit"}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color="#64748b" />
                  </Pressable>
                  {isUnitDropdownOpen && (
                    <View style={{ position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 4000, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
                      <TextInput 
                        style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', outlineStyle: 'none' }}
                        placeholder="Search units..."
                        value={unitSearchQuery}
                        onChangeText={setUnitSearchQuery}
                      />
                      <ScrollView style={{ maxHeight: 200 }}>
                        {filteredUnitsForSearch.map(u => (
                          <Pressable 
                            key={u.id} 
                            onPress={() => { setUnit(u.id); setIsUnitDropdownOpen(false); }} 
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: String(unit) === String(u.id) ? '#f8fafc' : 'transparent' }}
                          >
                            <Text style={{ fontSize: 14, color: String(unit) === String(u.id) ? colors.accent : colors.ink, fontWeight: String(unit) === String(u.id) ? '700' : '500' }}>{u.name}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.formCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={modalStyles.label}>Product SKU <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <Ionicons name="information-circle-outline" size={14} color="#64748b" />
                  <Pressable style={{ marginLeft: 'auto' }} onPress={() => setCode(Math.floor(100000 + Math.random() * 900000).toString())}>
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>Generate Code</Text>
                  </Pressable>
                </View>
                <TextInput value={code} onChangeText={setCode} style={modalStyles.input} placeholder="e.g. 780328" />
              </View>
            </View>
          </ModalSection>

          <ModalSection title="Pricing & Inventory" icon="cash-outline" style={{ zIndex: 1 }}>
            <View style={[styles.formRow, { zIndex: 100 }]}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Technical Specifications</Text>
                <TextInput 
                  value={specifications} 
                  onChangeText={setSpecifications} 
                  style={[modalStyles.input, { height: 80 }]} 
                  placeholder="e.g. 24K Gold, Handmade, Dimensions..."
                  multiline
                />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Purchase Price (₹)</Text>
                <TextInput value={buyPrice} onChangeText={setBuyPrice} style={modalStyles.input} keyboardType="numeric" />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Selling Price (₹) <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput value={price} onChangeText={setPrice} style={[modalStyles.input, { borderColor: colors.accent, backgroundColor: '#f0fdf4' }]} keyboardType="numeric" />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Discount Price (₹)</Text>
                <TextInput value={discountPrice} onChangeText={setDiscountPrice} style={modalStyles.input} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Current Stock</Text>
                <TextInput value={quantity} onChangeText={setQuantity} style={modalStyles.input} keyboardType="numeric" />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>VAT / Tax (%)</Text>
                <TextInput value={vatTax} onChangeText={setVatTax} style={modalStyles.input} keyboardType="numeric" />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>Min Order Qty</Text>
                <TextInput value={minOrderQty} onChangeText={setMinOrderQty} style={modalStyles.input} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>SKU / Product Code</Text>
                <TextInput value={code} onChangeText={setCode} style={modalStyles.input} placeholder="Stock Keeping Unit" />
              </View>
              <View style={styles.formCol}>
                <Text style={modalStyles.label}>HSN Code</Text>
                <TextInput value={hsinCode} onChangeText={setHsinCode} style={modalStyles.input} placeholder="Harmonized System Nom." />
              </View>
            </View>
          </ModalSection>

          <ModalSection title="Visibility & Home Section" icon="eye-outline">
            <View style={modalStyles.optionsRow}>
              {[
                { label: "Home Screen", state: isFeatured, setter: setIsFeatured, icon: "home" },
                { label: "Auspicious Beginning", state: isAuspicious, setter: setIsAuspicious, icon: "star" },
                { label: "Main Banner", state: isBannerMain, setter: setIsBannerMain, icon: "image" },
                { label: "Earrings Banner", state: isBannerEarrings, setter: setIsBannerEarrings, icon: "easel" },
                { label: "Necklace Banner", state: isBannerNecklaces, setter: setIsBannerNecklaces, icon: "grid" },
                { label: "Popular Jewellery", state: isPopularJewellery, setter: setIsPopularJewellery, icon: "diamond" },
                { label: "Men's Shirts", state: isMensShirts, setter: setIsMensShirts, icon: "shirt" },
                { label: "Women's Highlights", state: isWomensHighlights, setter: setIsWomensHighlights, icon: "female" },
                { label: "Premium Sarees", state: isPremiumSarees, setter: setIsPremiumSarees, icon: "color-palette" },
                { label: "Flash Sale", state: isFlashSale, setter: setIsFlashSale, icon: "flash" },
                { label: "Advertisement", state: isAd, setter: setIsAd, icon: "megaphone" },
              ].map((opt, i) => (
                <Pressable
                  key={i}
                  onPress={() => opt.setter(!opt.state)}
                  style={[
                    modalStyles.pill, 
                    { marginBottom: 8, paddingHorizontal: 14, height: 40, borderRadius: 20 },
                    opt.state && { backgroundColor: '#0d5731', borderColor: '#0d5731' }
                  ]}
                >
                  <Ionicons name={opt.icon + (opt.state ? "" : "-outline")} size={16} color={opt.state ? "white" : "#64748b"} style={{ marginRight: 8 }} />
                  <Text style={[modalStyles.pillText, { fontSize: 13 }, opt.state && { color: 'white', fontWeight: '700' }]}>
                    {opt.state ? opt.label : "Not in " + opt.label.replace("Banner", "").trim()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ModalSection>

          <ModalSection title="Product Media" icon="images-outline">
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
               <View style={{ width: '100%', height: 200, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                  {img ? (
                    <Image source={{ uri: resolveImageUrl(img) }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="image-outline" size={48} color="#cbd5e1" />
                      <Text style={{ color: '#94a3b8', marginTop: 12 }}>No image selected</Text>
                    </View>
                  )}
               </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Image URL</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput value={img} onChangeText={setImg} style={[modalStyles.input, { flex: 1 }]} placeholder="https://..." />
                  <Pressable 
                    onPress={() => {
                      if (Platform.OS === "web") {
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
                      }
                    }}
                    style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}
                  >
                    <Text style={{ fontWeight: '700', color: colors.ink }}>Pick File</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </ModalSection>

          <ModalSection title="SEO Meta Information" icon="globe-outline">
            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Meta Title</Text>
                <TextInput value={metaTitle} onChangeText={setMetaTitle} style={modalStyles.input} placeholder="Title for search engines" />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Meta Description</Text>
                <TextInput 
                  value={metaDesc} 
                  onChangeText={setMetaDesc} 
                  style={[modalStyles.input, { height: 80 }]} 
                  placeholder="Meta description for SEO..."
                  multiline
                />
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formColFull}>
                <Text style={modalStyles.label}>Meta Keywords</Text>
                <TextInput value={metaKeywords} onChangeText={setMetaKeywords} style={modalStyles.input} placeholder="keyword1, keyword2, jewellery" />
              </View>
            </View>
          </ModalSection>

          <ModalSection title="Variations" icon="color-palette-outline">
             <Text style={[modalStyles.label, { marginTop: 0 }]}>Select Colors</Text>
             <View style={modalStyles.optionsRow}>
                {colorOptions.map(c => (
                  <Pressable 
                    key={c.id} 
                    onPress={() => selColors.includes(c.id) ? setSelColors(selColors.filter(id => id !== c.id)) : setSelColors([...selColors, c.id])}
                    style={[modalStyles.pill, selColors.includes(c.id) && { backgroundColor: '#3b82f6', borderColor: '#3b82f6' }]}
                  >
                    <Text style={[modalStyles.pillText, selColors.includes(c.id) && { color: 'white' }]}>{c.name}</Text>
                  </Pressable>
                ))}
             </View>

             <Text style={modalStyles.label}>Select Sizes</Text>
             <View style={modalStyles.optionsRow}>
                {sizeOptions.map(s => (
                  <Pressable 
                    key={s.id} 
                    onPress={() => selSizes.includes(s.id) ? setSelSizes(selSizes.filter(id => id !== s.id)) : setSelSizes([...selSizes, s.id])}
                    style={[modalStyles.pill, selSizes.includes(s.id) && { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' }]}
                  >
                    <Text style={[modalStyles.pillText, selSizes.includes(s.id) && { color: 'white' }]}>{s.name || s.size}</Text>
                  </Pressable>
                ))}
             </View>
          </ModalSection>

          <ModalSection title="Full Description" icon="document-text-outline">
            <TextInput 
              value={desc} 
              onChangeText={setDesc} 
              style={[modalStyles.input, { height: 200, textAlignVertical: 'top', paddingTop: 12 }]} 
              placeholder="Detailed product description..."
              multiline
            />
          </ModalSection>

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Back</Text></Pressable>
          <Pressable 
            style={[modalStyles.saveBtn, { backgroundColor: '#0d5731', paddingHorizontal: 32, height: 44, justifyContent: 'center' }]} 
            onPress={() => onSave({
              name, price: Number(price), discount_price: Number(discountPrice), quantity: Number(quantity),
              metal, weight, size, description: desc, short_description: shortDesc, image_url: img, 
              category_id: Number(catId), sub_category_id: subCatId ? Number(subCatId) : null,
              brand_id: brand ? Number(brand) : null, 
              unit_id: unit ? Number(unit) : null, 
              code: code, hsin_code: hsinCode, 
              buy_price: Number(buyPrice), spcifications: specifications,
              vat_tax: Number(vatTax), min_order_qty: Number(minOrderQty),
              meta_title: metaTitle, meta_description: metaDesc, meta_keywords: metaKeywords,
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
            })}
          >
            <Text style={[modalStyles.saveBtnText, { fontSize: 15 }]}>{item ? "Update Product" : "Save Product"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}


function CategoryModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (visible) {
      if (item) setFormData({ ...item });
      else setFormData({ name: "", image_url: "", description: "", meta_title: "", meta_description: "", meta_keywords: "", status: 1 });
    }
  }, [visible, item]);

  if (!visible) return null;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const ModalSection = ({ title, icon, children }) => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 700, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="folder-open-outline" size={24} color={colors.accent} />
            <Text style={modalStyles.title}>{item ? "Edit Category" : "New Category"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          <ModalSection title="General Information" icon="information-circle-outline">
            <View style={{ marginBottom: 20 }}>
              <Text style={modalStyles.label}>Category Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={modalStyles.input}
                value={formData.name}
                onChangeText={(v) => updateField("name", v)}
                placeholder="e.g. Sarees"
              />
            </View>

            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <View style={{ width: 140, height: 140, borderRadius: 20, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }}>
                <Image source={{ uri: resolveImageUrl(formData.image_url) }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
              </View>
              <Pressable 
                onPress={() => {
                  if (Platform.OS === "web") {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => updateField("image_url", event.target.result);
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }
                }}
                style={{ marginTop: 12, backgroundColor: '#0d5731', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 }}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>Upload Image</Text>
              </Pressable>
            </View>

            <Text style={modalStyles.label}>Description</Text>
            <TextInput
              style={[modalStyles.input, { height: 100, textAlignVertical: 'top' }]}
              value={formData.description}
              onChangeText={(v) => updateField("description", v)}
              placeholder="Describe this category..."
              multiline
            />
          </ModalSection>

          <ModalSection title="SEO Information" icon="globe-outline">
            <View style={{ gap: 16 }}>
              <View>
                <Text style={modalStyles.label}>Meta Title</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.meta_title}
                  onChangeText={(v) => updateField("meta_title", v)}
                  placeholder="Meta title for SEO"
                />
              </View>
              <View>
                <Text style={modalStyles.label}>Meta Description</Text>
                <TextInput
                  style={[modalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formData.meta_description}
                  onChangeText={(v) => updateField("meta_description", v)}
                  placeholder="Meta description for search engines..."
                  multiline
                />
              </View>
              <View>
                <Text style={modalStyles.label}>Meta Keywords</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.meta_keywords}
                  onChangeText={(v) => updateField("meta_keywords", v)}
                  placeholder="keyword1, keyword2, jewellery"
                />
              </View>
            </View>
          </ModalSection>
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Discard</Text></Pressable>
          <Pressable 
            style={[modalStyles.saveBtn, { backgroundColor: '#0d5731', paddingHorizontal: 32 }]} 
            onPress={() => {
              if (!formData.name) {
                alert("Category name is required.");
                return;
              }
              onSave(formData);
            }}
          >
            <Text style={modalStyles.saveBtnText}>{item ? "Update Category" : "Save Category"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ColorModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [name, setName] = useState("");
  const [code, setCode] = useState("#000000");

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      
      let initialCode = item?.color_code || item?.code || "#000000";
      // Ensure hex is 7 chars and lowercase for HTML5 color input
      if (initialCode && initialCode.startsWith("#") && initialCode.length === 7) {
        initialCode = initialCode.toLowerCase();
      }
      setCode(initialCode);
    }
  }, [visible, item]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 500, borderRadius: 12 }]}>
        <View style={modalStyles.header}>
          <Text style={[modalStyles.title, { fontSize: 16, fontWeight: '700' }]}>{item?.id ? "Update Color" : "Add Color"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>
        <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Name <Text style={{color: 'red'}}>*</Text></Text>
           <TextInput
             style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 20 }]}
             value={name}
             onChangeText={setName}
             placeholder="e.g. Aquamarine"
             placeholderTextColor="#94a3b8"
           />

           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Select Color <Text style={{color: 'red'}}>*</Text></Text>
           <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
             {Platform.OS === 'web' ? (
               <input 
                 type="color" 
                 value={code} 
                 onChange={(e) => setCode(e.target.value)} 
                 style={{ width: 100, height: 44, cursor: 'pointer', padding: 0, border: '1px solid #e2e8f0', borderRadius: 4, backgroundColor: 'white' }}
               />
             ) : (
               <View style={{ width: 100, height: 44, backgroundColor: code, borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' }} />
             )}
             <TextInput
               style={[modalStyles.input, { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff' }]}
               value={code}
               onChangeText={setCode}
               placeholder="#000000"
               placeholderTextColor="#94a3b8"
             />
           </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, gap: 10 }}>
          <Pressable 
            style={{ backgroundColor: '#6c757d', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Close</Text>
          </Pressable>
          <Pressable 
            style={{ backgroundColor: '#00441b', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={() => {
              if (!name.trim() || !code.trim()) {
                alert("Name and Color Code are required");
                return;
              }
              onSave({ ...item, name: name.trim(), color_code: code.trim() });
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{item?.id ? "Update" : "Submit"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SizeModal({ visible, item, onClose, onSave }) {
  // ... (existing code for SizeModal)
}

function FlashSaleModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({
    name: "",
    min_discount: "",
    start_date: "",
    start_time: "12:00 AM",
    end_date: "",
    end_time: "12:00 AM",
    description: "",
    thumbnail: ""
  });

  useEffect(() => {
    if (visible) {
      if (item) {
        let start = new Date();
        let end = new Date();
        
        const parseSafely = (dateVal) => {
          if (!dateVal) return new Date();
          const d = new Date(String(dateVal).replace(' ', 'T'));
          return isNaN(d.getTime()) ? new Date() : d;
        };

        start = parseSafely(item.start_date);
        end = parseSafely(item.end_date);
        
        setFormData({
          name: item.name || "",
          min_discount: String(item.min_discount || ""),
          start_date: start.toISOString().split('T')[0],
          start_time: start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          end_date: end.toISOString().split('T')[0],
          end_time: end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
          description: item.description || "",
          thumbnail: item.thumbnail || ""
        });
      } else {
        setFormData({
          name: "",
          min_discount: "",
          start_date: new Date().toISOString().split('T')[0],
          start_time: "12:00 AM",
          end_date: new Date().toISOString().split('T')[0],
          end_time: "12:00 AM",
          description: "",
          thumbnail: ""
        });
      }
    }
  }, [visible, item]);

  const handleLocalSave = async () => {
    if (!formData.name) {
      alert("Please fill the Campaign Name");
      return;
    }
    if (!formData.min_discount) {
      alert("Please fill the Minimum Discount");
      return;
    }
    if (!formData.start_date || !formData.end_date) {
      alert("Please select both Start and End Dates");
      return;
    }

    const compressImage = async (dataUrl) => {
      if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
      return new Promise((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let width = img.width;
          let height = img.height;
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6)); // 60% quality
        };
        img.src = dataUrl;
      });
    };

    const finalThumbnail = await compressImage(formData.thumbnail);

    // Safety check: If thumbnail is still > 1MB, alert the user instead of failing on server
    if (finalThumbnail && finalThumbnail.length > 1000000) {
      alert("Image is still too large (over 1MB). Please re-pick the image or refresh your browser (Ctrl+F5).");
      return;
    }

    const parseDateTime = (d, t) => {
      try {
        const normalizedT = String(t || "").trim().toUpperCase();
        const periodMatch = normalizedT.match(/(AM|PM)/);
        const period = periodMatch ? periodMatch[0] : 'AM';
        const timePart = normalizedT.replace(/(AM|PM)/, '').trim();
        let [hours, minutes] = timePart.split(':');
        
        hours = parseInt(hours);
        minutes = parseInt(minutes) || 0;
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const dateObj = new Date(d);
        dateObj.setHours(hours, minutes, 0);
        
        const pad = (n) => n.toString().padStart(2, '0');
        return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
      } catch (e) {
        return d + " 00:00:00";
      }
    };

    const formatTimeToMySQL = (timeStr) => {
      if (!timeStr) return "00:00:00";
      const normalized = timeStr.trim().toUpperCase();
      const match = normalized.match(/(\d+):(\d+)\s*(AM|PM)?/);
      if (!match) return "00:00:00";
      let [_, hours, minutes, period] = match;
      hours = parseInt(hours);
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    };

    const finalData = {
      ...item,
      ...formData,
      thumbnail: finalThumbnail,
      min_discount: parseInt(formData.min_discount) || 0,
      start_date: parseDateTime(formData.start_date, formData.start_time),
      end_date: parseDateTime(formData.end_date, formData.end_time)
    };

    // Remove redundant time fields that cause MySQL schema errors
    delete finalData.start_time;
    delete finalData.end_time;
    delete finalData.start_time_display; // Just in case
    delete finalData.end_time_display;   // Just in case

    onSave(finalData);
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new window.Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_WIDTH = 800;
              let width = img.width;
              let height = img.height;

              if (width > MAX_WIDTH) {
                height *= MAX_WIDTH / width;
                width = MAX_WIDTH;
              }
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
              setFormData(p => ({ ...p, thumbnail: dataUrl }));
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 800, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{item ? "Edit FlashSale v2" : "Create FlashSale v2"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={{ padding: 24 }}>
          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 24 }}>
            <View style={{ flex: 1.5, gap: 16 }}>
              <View>
                <Text style={modalStyles.label}>Name <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.name}
                  onChangeText={(v) => setFormData(p => ({ ...p, name: v }))}
                  placeholder="Republic Day Sale"
                />
              </View>

              <View>
                <Text style={modalStyles.label}>Minimum Discount <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.min_discount}
                  onChangeText={(v) => setFormData(p => ({ ...p, min_discount: v }))}
                  placeholder="49"
                  keyboardType="numeric"
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Start Date <Text style={{color: 'red'}}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.start_date}
                    onChangeText={(v) => setFormData(p => ({ ...p, start_date: v }))}
                    placeholder="2026-01-10"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Start Time <Text style={{color: 'red'}}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.start_time}
                    onChangeText={(v) => setFormData(p => ({ ...p, start_time: v }))}
                    placeholder="12:00 AM"
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>End Date <Text style={{color: 'red'}}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.end_date}
                    onChangeText={(v) => setFormData(p => ({ ...p, end_date: v }))}
                    placeholder="2026-01-31"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>End Time <Text style={{color: 'red'}}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.end_time}
                    onChangeText={(v) => setFormData(p => ({ ...p, end_time: v }))}
                    placeholder="12:00 AM"
                  />
                </View>
              </View>

              <View>
                <Text style={modalStyles.label}>Description <Text style={{color: 'red'}}>*</Text></Text>
                <TextInput
                  style={[modalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                  value={formData.description}
                  onChangeText={(v) => setFormData(p => ({ ...p, description: v }))}
                  placeholder="Awesome Discounts on Republic day"
                  multiline
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Thumbnail Ratio 3:2 (600 × 400 px) <Text style={{color: 'red'}}>*</Text></Text>
              <Pressable 
                onPress={pickImage}
                style={{ 
                  height: 200, 
                  backgroundColor: '#f8fafc', 
                  borderRadius: 12, 
                  borderWidth: 2, 
                  borderColor: '#e2e8f0', 
                  borderStyle: 'dashed',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}
              >
                {formData.thumbnail ? (
                  <Image source={{ uri: resolveImageUrl(formData.thumbnail) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View style={{ alignItems: 'center' }}>
                    <Ionicons name="image-outline" size={48} color="#94a3b8" />
                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Click to upload</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Cancel</Text></Pressable>
          <Pressable 
            style={[modalStyles.saveBtn, { backgroundColor: '#0d5731' }]} 
            onPress={handleLocalSave}
          >
            <Text style={modalStyles.saveBtnText}>{item ? "Update" : "Save"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RiderModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    gender: "Male",
    driving_license: "",
    password: "",
    confirm_password: "",
    profile_image: "",
    dob: "",
    vehicle_type: ""
  });

  useEffect(() => {
    if (visible) {
      if (item) {
        setFormData({
          id: item.id,
          first_name: item.first_name || "",
          last_name: item.last_name || "",
          phone: item.phone || "",
          email: item.email || "",
          gender: item.gender || "Male",
          driving_license: item.driving_license || "",
          password: item.password || "",
          confirm_password: item.password || "",
          profile_image: item.profile_image || "",
          dob: item.dob ? String(item.dob).split('T')[0] : "",
          vehicle_type: item.vehicle_type || ""
        });
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          gender: "Male",
          driving_license: "",
          password: "",
          confirm_password: "",
          profile_image: "",
          dob: "",
          vehicle_type: ""
        });
      }
    }
  }, [visible, item]);

  const pickImage = async () => {
    if (typeof window !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const img = new window.Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const MAX_SIZE = 400;
              let w = img.width;
              let h = img.height;
              if (w > h) {
                if (w > MAX_SIZE) { h *= MAX_SIZE / w; w = MAX_SIZE; }
              } else {
                if (h > MAX_SIZE) { w *= MAX_SIZE / h; h = MAX_SIZE; }
              }
              canvas.width = w;
              canvas.height = h;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0, w, h);
              setFormData(p => ({ ...p, profile_image: canvas.toDataURL('image/jpeg', 0.7) }));
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleLocalSave = () => {
    if (!formData.first_name || !formData.phone || !formData.password || !formData.vehicle_type) {
      alert("Please fill all required fields");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      alert("Passwords do not match");
      return;
    }
    const payload = { ...formData };
    delete payload.confirm_password;
    onSave(payload);
  };

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 1000, maxHeight: '95%' }]}>
        <View style={[modalStyles.header, { borderBottomWidth: 0 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ backgroundColor: '#eef2ff', padding: 8, borderRadius: 8 }}>
               <Ionicons name="person-add" size={20} color="#0d5731" />
            </View>
            <Text style={[modalStyles.title, { fontSize: 20 }]}>{item ? "Edit Rider" : "Create New Rider"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
           <View style={{ marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="person" size={18} color="#64748b" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1e293b' }}>User Information</Text>
           </View>

           <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 32 }}>
              {/* Left Column */}
              <View style={{ flex: 1.6, gap: 20 }}>
                 <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                       <Text style={modalStyles.label}>First Name <Text style={{color: '#ef4444'}}>*</Text></Text>
                       <TextInput 
                          style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                          value={formData.first_name} 
                          onChangeText={v => setFormData(p=>({...p, first_name: v}))} 
                          placeholder="Enter first name" 
                       />
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={modalStyles.label}>Last Name</Text>
                       <TextInput 
                          style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                          value={formData.last_name} 
                          onChangeText={v => setFormData(p=>({...p, last_name: v}))} 
                          placeholder="Enter last name" 
                       />
                    </View>
                 </View>

                 <View>
                    <Text style={modalStyles.label}>Phone Number <Text style={{color: '#ef4444'}}>*</Text></Text>
                    <TextInput 
                       style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                       value={formData.phone} 
                       onChangeText={v => setFormData(p=>({...p, phone: v}))} 
                       placeholder="Enter phone number" 
                       keyboardType="phone-pad" 
                    />
                 </View>

                 <View>
                    <Text style={modalStyles.label}>Email</Text>
                    <TextInput 
                       style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                       value={formData.email} 
                       onChangeText={v => setFormData(p=>({...p, email: v}))} 
                       placeholder="Enter Email Address" 
                       keyboardType="email-address" 
                    />
                 </View>

                 <View>
                    <Text style={modalStyles.label}>Gender</Text>
                    <View style={[modalStyles.input, { backgroundColor: '#fff', paddingHorizontal: 0, overflow: 'hidden' }]}>
                       <select 
                         value={formData.gender} 
                         onChange={(e) => setFormData(p => ({ ...p, gender: e.target.value }))}
                         style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, padding: '0 12px', color: '#334155' }}
                       >
                         <option value="Male">Male</option>
                         <option value="Female">Female</option>
                         <option value="Other">Other</option>
                       </select>
                    </View>
                 </View>

                 <View>
                    <Text style={modalStyles.label}>Driving License</Text>
                    <TextInput 
                       style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                       value={formData.driving_license} 
                       onChangeText={v => setFormData(p=>({...p, driving_license: v}))} 
                       placeholder="Enter License" 
                    />
                 </View>

                 <View style={{ flexDirection: 'row', gap: 16 }}>
                    <View style={{ flex: 1 }}>
                       <Text style={modalStyles.label}>Password <Text style={{color: '#ef4444'}}>*</Text></Text>
                       <TextInput 
                          style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                          value={formData.password} 
                          onChangeText={v => setFormData(p=>({...p, password: v}))} 
                          placeholder="Enter Password" 
                          secureTextEntry 
                       />
                    </View>
                    <View style={{ flex: 1 }}>
                       <Text style={modalStyles.label}>Confirm Password <Text style={{color: '#ef4444'}}>*</Text></Text>
                       <TextInput 
                          style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                          value={formData.confirm_password} 
                          onChangeText={v => setFormData(p=>({...p, confirm_password: v}))} 
                          placeholder="Enter Confirm Password" 
                          secureTextEntry 
                       />
                    </View>
                 </View>
              </View>

              {/* Right Column */}
              <View style={{ flex: 1, gap: 20 }}>
                 <View style={{ alignItems: 'center' }}>
                    <View style={{ width: 220, height: 220, backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative' }}>
                       {formData.profile_image ? (
                          <Image source={{ uri: resolveImageUrl(formData.profile_image) }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                       ) : (
                          <Ionicons name="image-outline" size={80} color="#cbd5e1" />
                       )}
                    </View>
                    
                    <View style={{ width: '100%', marginTop: 12 }}>
                        <Text style={[modalStyles.label, { marginBottom: 8 }]}>User profile (Ratio 1:1)</Text>
                        <Pressable onPress={pickImage} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 0, borderWidth: 1, borderColor: '#e2e8f0', height: 44 }}>
                           <View style={{ backgroundColor: '#f1f5f9', height: '100%', paddingHorizontal: 16, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#e2e8f0' }}>
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>Choose File</Text>
                           </View>
                           <View style={{ flex: 1, paddingHorizontal: 12 }}>
                              <Text style={{ fontSize: 13, color: '#64748b' }} numberOfLines={1}>{formData.profile_image ? "Image selected" : "No file chosen"}</Text>
                           </View>
                        </Pressable>
                     </View>
                 </View>

                 <View>
                    <Text style={modalStyles.label}>Date of Birth</Text>
                    <View style={{ position: 'relative' }}>
                       <TextInput 
                          style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                          value={formData.dob} 
                          onChangeText={v => setFormData(p=>({...p, dob: v}))} 
                          placeholder="mm/dd/yyyy" 
                       />
                       <Ionicons name="calendar-outline" size={20} color="#64748b" style={{ position: 'absolute', right: 12, top: 14 }} />
                    </View>
                 </View>

                 <View>
                    <Text style={modalStyles.label}>Vehicle Type <Text style={{color: '#ef4444'}}>*</Text></Text>
                    <TextInput 
                       style={[modalStyles.input, { backgroundColor: '#fff' }]} 
                       value={formData.vehicle_type} 
                       onChangeText={v => setFormData(p=>({...p, vehicle_type: v}))} 
                       placeholder="Enter Vehicle Type" 
                    />
                 </View>
              </View>
           </View>
        </ScrollView>

        <View style={[modalStyles.footer, { borderTopWidth: 0, paddingBottom: 24 }]}>
           <View style={{ flex: 1 }} />
           <Pressable 
              style={[modalStyles.saveBtn, { backgroundColor: '#0d5731', width: 140, height: 48, borderRadius: 8 }]} 
              onPress={handleLocalSave}
           >
              <Text style={[modalStyles.saveBtnText, { fontSize: 16 }]}>Submit</Text>
           </Pressable>
        </View>
      </View>
    </View>
  );
}

function UnitModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
    }
  }, [visible, item]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 500, borderRadius: 12 }]}>
        <View style={modalStyles.header}>
          <Text style={[modalStyles.title, { fontSize: 16, fontWeight: '700' }]}>{item?.id ? "Update Unit" : "Add Unit"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>
        <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Name <Text style={{color: 'red'}}>*</Text></Text>
           <TextInput
             style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff', marginBottom: 20 }]}
             value={name}
             onChangeText={setName}
             placeholder="e.g. 1 Item"
             placeholderTextColor="#94a3b8"
           />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, gap: 10 }}>
          <Pressable 
            style={{ backgroundColor: '#6c757d', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Close</Text>
          </Pressable>
          <Pressable 
            style={{ backgroundColor: '#00441b', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={() => {
              if (!name.trim()) {
                alert("Name is required");
                return;
              }
              onSave({ ...item, name: name.trim() });
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{item?.id ? "Update" : "Submit"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BrandModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [name, setName] = useState("");

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
    }
  }, [visible, item]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 500, borderRadius: 12 }]}>
        <View style={modalStyles.header}>
          <Text style={[modalStyles.title, { fontSize: 16, fontWeight: '700' }]}>{item?.id ? "Edit Brand" : "Add Brand"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>
        <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Name *</Text>
           <TextInput
             style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff' }]}
             value={name}
             onChangeText={setName}
             placeholder="Enter Name"
             placeholderTextColor="#94a3b8"
           />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, gap: 10 }}>
          <Pressable 
            style={{ backgroundColor: '#6b7280', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Close</Text>
          </Pressable>
          <Pressable 
            style={{ backgroundColor: '#0d5731', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={() => {
              if (!name.trim()) {
                alert("Brand name is required");
                return;
              }
              onSave({ ...item, name: name.trim() });
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{item?.id ? "Submit" : "Submit"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SpecificationModal({ visible, item, categories, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      setCategoryId(item?.category_id || "");
    }
  }, [visible, item]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 500, borderRadius: 12 }]}>
        <View style={modalStyles.header}>
          <Text style={[modalStyles.title, { fontSize: 16, fontWeight: '700' }]}>{item?.id ? "Edit Specifications" : "Add Specification"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>
        <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Category Id *</Text>
           <View style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', backgroundColor: '#fff', marginBottom: 20, paddingHorizontal: 0 }]}>
             <select 
               value={categoryId} 
               onChange={(e) => setCategoryId(e.target.value)}
               style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, padding: '0 10px', color: '#334155' }}
             >
               <option value="">Select Category</option>
               {(categories || []).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
             </select>
           </View>

           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Name *</Text>
           <TextInput
             style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff' }]}
             value={name}
             onChangeText={setName}
             placeholder="Enter Name"
             placeholderTextColor="#94a3b8"
           />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, gap: 10 }}>
          <Pressable 
            style={{ backgroundColor: '#6b7280', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Close</Text>
          </Pressable>
          <Pressable 
            style={{ backgroundColor: '#0d5731', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={() => {
              if (!name.trim() || !categoryId) {
                alert("Category and Name are required");
                return;
              }
              onSave({ ...item, name: name.trim(), category_id: categoryId });
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{item?.id ? "Update" : "Submit"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SpecificationValueModal({ visible, item, specifications, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [name, setName] = useState("");
  const [specificationId, setSpecificationId] = useState("");

  useEffect(() => {
    if (visible) {
      setName(item?.name || "");
      setSpecificationId(item?.specification_id ? String(item.specification_id) : "");
    }
  }, [visible, item]);

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 500, borderRadius: 12 }]}>
        <View style={modalStyles.header}>
          <Text style={[modalStyles.title, { fontSize: 16, fontWeight: '700' }]}>{item?.id ? "Edit Specification" : "Create Specification"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>
        <View style={{ paddingHorizontal: 24, paddingVertical: 20 }}>
           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Name *</Text>
           <View style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', justifyContent: 'center', backgroundColor: '#fff', marginBottom: 20, paddingHorizontal: 0 }]}>
             <select 
               value={specificationId} 
               onChange={(e) => setSpecificationId(e.target.value)}
               style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: 14, padding: '0 10px', color: '#334155' }}
             >
               <option value="">Select Specification</option>
               {(specifications || []).map(spec => <option key={spec.id} value={spec.id}>{spec.name}</option>)}
             </select>
           </View>

           <Text style={[modalStyles.label, { marginBottom: 10, fontSize: 14, fontWeight: '600', color: '#334155' }]}>Name *</Text>
           <TextInput
             style={[modalStyles.input, { height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, fontSize: 14, backgroundColor: '#fff' }]}
             value={name}
             onChangeText={setName}
             placeholder="Enter Name"
             placeholderTextColor="#94a3b8"
           />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 20, gap: 10 }}>
          <Pressable 
            style={{ backgroundColor: '#6c757d', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>Close</Text>
          </Pressable>
          <Pressable 
            style={{ backgroundColor: '#00441b', borderRadius: 6, height: 36, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center' }} 
            onPress={() => {
              if (!name.trim() || !specificationId) {
                alert("Specification and Name are required");
                return;
              }
              onSave({ ...item, name: name.trim(), specification_id: specificationId });
            }}
          >
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>{item?.id ? "Update" : "Submit"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function SubCategoryModal({ visible, item, categories, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (visible) {
      setFormData(item?.id ? { ...item } : { 
        name: "", 
        category_id: "", 
        image_url: "", 
        meta_title: "", 
        meta_description: "", 
        meta_keywords: "",
        status: 1
      });
    }
  }, [visible, item?.id]);

  if (!visible) return null;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const selectedCategory = (categories || []).find(c => String(c.id) === String(formData.category_id));

  const ModalSection = ({ title, icon, children }) => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 6 }}>
        <Ionicons name={icon} size={18} color={colors.accent} />
        <Text style={{ fontSize: 15, fontWeight: '800', color: colors.ink }}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 700, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="git-network-outline" size={24} color={colors.accent} />
            <Text style={modalStyles.title}>{item?.id ? "Update Sub Category" : "Add Sub Category"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} nestedScrollEnabled>
          <ModalSection title="Classification" icon="layers-outline">
            <Text style={[modalStyles.label, { marginBottom: 12 }]}>Select Parent Category <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {(categories || []).map(cat => {
                const isSelected = String(formData.category_id) === String(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => updateField('category_id', cat.id)}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderRadius: 20,
                      backgroundColor: isSelected ? '#0d5731' : '#ffffff',
                      borderWidth: 1,
                      borderColor: isSelected ? '#0d5731' : '#e2e8f0',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    {isSelected && <Ionicons name="checkmark-circle" size={14} color="white" />}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isSelected ? 'white' : colors.ink }}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!formData.category_id && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff7ed', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#ffedd5' }}>
                <Ionicons name="warning-outline" size={16} color="#f97316" />
                <Text style={{ fontSize: 12, color: '#9a3412', fontWeight: '600' }}>Please link to a parent category</Text>
              </View>
            )}
          </ModalSection>

          <ModalSection title="Sub Category Details" icon="document-text-outline">
            <View style={{ marginBottom: 20 }}>
              <Text style={modalStyles.label}>Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={modalStyles.input}
                value={formData.name}
                onChangeText={(v) => updateField("name", v)}
                placeholder="Ex: Silk Sarees"
              />
            </View>

            <View>
              <Text style={modalStyles.label}>Thumbnail Image</Text>
              <View style={{ flexDirection: 'row', gap: 20, alignItems: 'center', marginTop: 10 }}>
                <View style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }}>
                  {formData.image_url ? (
                    <Image source={{ uri: resolveImageUrl(formData.image_url) }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
                  ) : (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="image-outline" size={32} color="#cbd5e1" />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                   <Pressable 
                    onPress={() => {
                      if (Platform.OS === 'web') {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => updateField('image_url', event.target.result);
                            reader.readAsDataURL(file);
                          }
                        };
                        input.click();
                      }
                    }}
                    style={{ backgroundColor: '#0d5731', padding: 12, borderRadius: 8, alignItems: 'center' }}
                  >
                    <Text style={{ color: 'white', fontWeight: '700' }}>Upload Image</Text>
                  </Pressable>
                  <TextInput 
                    value={formData.image_url} 
                    onChangeText={v => updateField('image_url', v)} 
                    placeholder="Or paste image URL" 
                    style={[modalStyles.input, { fontSize: 11, height: 40 }]} 
                  />
                </View>
              </View>
            </View>
          </ModalSection>

          <ModalSection title="SEO & Meta Information" icon="globe-outline">
            <View style={{ gap: 16 }}>
              <View>
                <Text style={modalStyles.label}>Meta Title</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.meta_title}
                  onChangeText={(v) => updateField("meta_title", v)}
                  placeholder="SEO Search Title"
                />
              </View>
              <View>
                <Text style={modalStyles.label}>Meta Description</Text>
                <TextInput
                  style={[modalStyles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  value={formData.meta_description}
                  onChangeText={(v) => updateField("meta_description", v)}
                  placeholder="Search engine description..."
                  multiline
                />
              </View>
            </View>
          </ModalSection>
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Discard</Text></Pressable>
          <Pressable 
            style={[modalStyles.saveBtn, { backgroundColor: '#0d5731', minWidth: 120 }]} 
            onPress={() => {
              if (!formData.name || !formData.category_id) {
                alert("Name and Parent Category are required.");
                return;
              }
              onSave(formData);
            }}
          >
            <Text style={modalStyles.saveBtnText}>{item?.id ? "Update Sub Category" : "Save Sub Category"}</Text>
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
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isStateOpen, setIsStateOpen] = useState(false);

  useEffect(() => {
    if (visible) {
      setFormData(item?.id ? { ...item } : {
        first_name: "",
        last_name: "",
        phone: "",
        gender: "Female",
        email: "",
        user_profile_url: "",
        name: "",
        state: "Telangana",
        address: "",
        gst_id: "",
        logo_url: "",
        banner_url: "",
        description: "",
        is_active: 1
      });
      setIsGenderOpen(false);
      setIsStateOpen(false);
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

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 900, maxHeight: '95%', borderRadius: 20 }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(13, 87, 49, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="storefront" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={modalStyles.title}>{formData.id ? "Edit Shop" : "Create New Shop"}</Text>
              <Text style={{ fontSize: 12, color: colors.subtleText }}>Configure shop identity and vendor details</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: '#f8fafc' }}>
            <Ionicons name="close" size={24} color={colors.muted} />
          </Pressable>
        </View>

        <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ paddingBottom: 10 }}>
            <SectionTitle title="User Information" icon="person-outline" />
            
            <View style={styles.formRow}>
              <View style={{ flex: 1, gap: 16 }}>
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={modalStyles.label}>First Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                    <TextInput
                      style={modalStyles.input}
                      value={formData.first_name}
                      onChangeText={(v) => updateField("first_name", v)}
                      placeholder="Enter First Name"
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={modalStyles.label}>Last Name</Text>
                    <TextInput
                      style={modalStyles.input}
                      value={formData.last_name}
                      onChangeText={(v) => updateField("last_name", v)}
                      placeholder="Enter Last Name"
                    />
                  </View>
                </View>

                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={modalStyles.label}>Phone Number <Text style={{ color: '#ef4444' }}>*</Text></Text>
                    <TextInput
                      style={modalStyles.input}
                      value={formData.phone}
                      onChangeText={(v) => updateField("phone", v)}
                      placeholder="e.g. +91 0000000000"
                      keyboardType="phone-pad"
                    />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={modalStyles.label}>Gender</Text>
                    <View style={{ zIndex: 3000 }}>
                      <Pressable 
                        onPress={() => { setIsGenderOpen(!isGenderOpen); setIsStateOpen(false); }}
                        style={[modalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                      >
                        <Text style={{ color: formData.gender ? colors.ink : colors.muted }}>{formData.gender || "Select Gender"}</Text>
                        <Ionicons name="chevron-down" size={16} color={colors.muted} />
                      </Pressable>
                      {isGenderOpen && (
                        <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 4000, elevation: 5 }}>
                          {GENDER_OPTIONS.map(opt => (
                            <Pressable 
                              key={opt} 
                              onPress={() => { updateField("gender", opt); setIsGenderOpen(false); }}
                              style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                            >
                              <Text style={{ fontSize: 14, color: formData.gender === opt ? colors.accent : colors.ink }}>{opt}</Text>
                            </Pressable>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <View style={{ width: 140, marginLeft: 20, alignItems: 'center' }}>
                <Text style={[modalStyles.label, { marginBottom: 8 }]}>User Profile</Text>
                <View style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 10 }}>
                  <Image source={{ uri: formData.user_profile_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=vendor" }} style={{ width: '100%', height: '100%' }} />
                </View>
                <Pressable 
                  onPress={() => handlePickImage("user_profile_url")}
                  style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#e2e8f0' }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.ink }}>Change Photo</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>User profile URL</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.user_profile_url}
                  onChangeText={(v) => updateField("user_profile_url", v)}
                  placeholder="Paste profile image URL here..."
                />
              </View>
              <View style={{ flex: 1, marginLeft: 20 }}>
                <Text style={modalStyles.label}>Email <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.email}
                  onChangeText={(v) => updateField("email", v)}
                  placeholder="vendor@example.com"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={{ height: 32 }} />

            <SectionTitle title="Shop Information" icon="business-outline" />
            
            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Shop Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.name}
                  onChangeText={(v) => updateField("name", v)}
                  placeholder="e.g. Elegant Jewellers"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 20 }}>
                <Text style={modalStyles.label}>State</Text>
                <View style={{ zIndex: 2000 }}>
                  <Pressable 
                    onPress={() => { setIsStateOpen(!isStateOpen); setIsGenderOpen(false); }}
                    style={[modalStyles.input, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                  >
                    <Text style={{ color: formData.state ? colors.ink : colors.muted }}>{formData.state || "Select State"}</Text>
                    <Ionicons name="chevron-down" size={16} color={colors.muted} />
                  </Pressable>
                  {isStateOpen && (
                    <View style={{ position: 'absolute', top: 50, left: 0, right: 0, backgroundColor: 'white', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', zIndex: 4000, elevation: 5 }}>
                      <ScrollView style={{ maxHeight: 200 }}>
                        {INDIAN_STATES.map(st => (
                          <Pressable 
                            key={st} 
                            onPress={() => { updateField("state", st); setIsStateOpen(false); }}
                            style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                          >
                            <Text style={{ fontSize: 14, color: formData.state === st ? colors.accent : colors.ink }}>{st}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Address</Text>
                <TextInput
                  style={[modalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formData.address}
                  onChangeText={(v) => updateField("address", v)}
                  placeholder="Complete physical address..."
                  multiline
                />
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>GST Number</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.gst_id}
                  onChangeText={(v) => updateField("gst_id", v)}
                  placeholder="GSTIN Number"
                />
              </View>
              <View style={{ width: 140, marginLeft: 20, alignItems: 'center' }}>
                 <View style={{ width: 120, height: 120, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }}>
                    <Image source={{ uri: formData.logo_url || "https://api.dicebear.com/7.x/initials/svg?seed=Shop" }} style={{ width: '100%', height: '100%' }} />
                 </View>
              </View>
            </View>

            <View style={[styles.formRow, { marginTop: 16 }]}>
               <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Shop Logo URL</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[modalStyles.input, { flex: 1 }]}
                      value={formData.logo_url}
                      onChangeText={(v) => updateField("logo_url", v)}
                      placeholder="https://..."
                    />
                    <Pressable 
                      onPress={() => handlePickImage("logo_url")}
                      style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}
                    >
                      <Text style={{ fontWeight: '700', fontSize: 12 }}>Pick</Text>
                    </Pressable>
                  </View>
               </View>
            </View>

            <View style={{ height: 32 }} />

            <SectionTitle title="Shop Branding" icon="image-outline" />
            <View style={{ marginBottom: 16 }}>
              <View style={{ width: '100%', height: 180, borderRadius: 16, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
                {formData.banner_url ? (
                  <Image source={{ uri: formData.banner_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="image-outline" size={48} color="#cbd5e1" />
                    <Text style={{ color: '#94a3b8', marginTop: 12 }}>No banner selected (Ratio 4:1)</Text>
                  </View>
                )}
              </View>
              
              <Text style={modalStyles.label}>Shop Banner URL</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={[modalStyles.input, { flex: 1 }]}
                  value={formData.banner_url}
                  onChangeText={(v) => updateField("banner_url", v)}
                  placeholder="Paste banner image URL..."
                />
                <Pressable 
                  onPress={() => handlePickImage("banner_url")}
                  style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}
                >
                  <Text style={{ fontWeight: '700' }}>Pick File</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 16 }}>
              <Text style={modalStyles.label}>Description</Text>
              <TextInput
                style={[modalStyles.input, { height: 120, textAlignVertical: 'top', paddingTop: 12 }]}
                value={formData.description}
                onChangeText={(v) => updateField("description", v)}
                placeholder="About the shop, specialization, history..."
                multiline
              />
            </View>
          </View>
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelBtnText}>Cancel</Text>
          </Pressable>
          <Pressable 
            style={[modalStyles.saveBtn, { backgroundColor: '#0d5731', paddingHorizontal: 40 }]} 
            onPress={() => {
              if (!formData.name || !formData.first_name || !formData.email || !formData.phone) {
                Alert.alert("Missing Fields", "Please fill in all required fields marked with *");
                return;
              }
              onSave(formData);
            }}
          >
            <Text style={modalStyles.saveBtnText}>{formData.id ? "Update Shop" : "Create Shop"}</Text>
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
    overflow: "visible",
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

function UserModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    gender: "Male",
    password: "",
    confirm_password: "",
    image: "",
    dob: ""
  });

  useEffect(() => {
    if (visible) {
      if (item) {
        setFormData({
          id: item.id,
          name: item.name || "",
          phone: item.phone || "",
          email: item.email || "",
          gender: item.gender || "Male",
          password: "",
          confirm_password: "",
          image: item.image || "",
          dob: item.dob ? String(item.dob).split('T')[0] : ""
        });
      } else {
        setFormData({
          name: "",
          phone: "",
          email: "",
          gender: "Male",
          password: "",
          confirm_password: "",
          image: "",
          dob: ""
        });
      }
    }
  }, [visible, item]);

  const pickImage = async () => {
    if (typeof window !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            setFormData(p => ({ ...p, image: reader.result }));
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const handleLocalSave = () => {
    if (!formData.name || !formData.email || (!item && !formData.password)) {
      alert("Please fill all required fields");
      return;
    }
    if (formData.password && formData.password !== formData.confirm_password) {
      alert("Passwords do not match");
      return;
    }
    const payload = { ...formData };
    delete payload.confirm_password;
    if (!payload.password) delete payload.password;
    onSave(payload);
  };

  if (!visible) return null;

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 800, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <Text style={modalStyles.title}>{item ? "Edit Customer" : "Create New Customer"}</Text>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView style={{ padding: 24 }}>
           <View style={{ gap: 20 }}>
              <View>
                <Text style={modalStyles.label}>Full Name <Text style={{color: '#ef4444'}}>*</Text></Text>
                <TextInput style={modalStyles.input} value={formData.name} onChangeText={t => setFormData(p => ({ ...p, name: t }))} placeholder="Enter full name" />
              </View>

              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                 <View style={{ flex: 1 }}>
                    <Text style={modalStyles.label}>Phone Number</Text>
                    <TextInput style={modalStyles.input} value={formData.phone} onChangeText={t => setFormData(p => ({ ...p, phone: t }))} placeholder="Enter phone number" />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={modalStyles.label}>Email Address <Text style={{color: '#ef4444'}}>*</Text></Text>
                    <TextInput style={modalStyles.input} value={formData.email} onChangeText={t => setFormData(p => ({ ...p, email: t }))} placeholder="Enter email address" />
                 </View>
              </View>

              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                 <View style={{ flex: 1 }}>
                    <Text style={modalStyles.label}>Gender</Text>
                    <View style={modalStyles.optionsRow}>
                      {["Male", "Female", "Other"].map((g) => (
                        <Pressable
                          key={g}
                          style={[modalStyles.pill, formData.gender === g && modalStyles.pillActive]}
                          onPress={() => setFormData(p => ({ ...p, gender: g }))}
                        >
                          <Text style={[modalStyles.pillText, formData.gender === g && modalStyles.pillTextActive]}>{g}</Text>
                        </Pressable>
                      ))}
                    </View>
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={modalStyles.label}>Date of Birth</Text>
                    <TextInput style={modalStyles.input} value={formData.dob} onChangeText={t => setFormData(p => ({ ...p, dob: t }))} placeholder="mm/dd/yyyy" />
                 </View>
              </View>

              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                 <View style={{ flex: 1 }}>
                    <Text style={modalStyles.label}>{item ? "New Password (Optional)" : "Password *"}</Text>
                    <TextInput style={modalStyles.input} secureTextEntry value={formData.password} onChangeText={t => setFormData(p => ({ ...p, password: t }))} placeholder="Enter password" />
                 </View>
                 <View style={{ flex: 1 }}>
                    <Text style={modalStyles.label}>Confirm Password</Text>
                    <TextInput style={modalStyles.input} secureTextEntry value={formData.confirm_password} onChangeText={t => setFormData(p => ({ ...p, confirm_password: t }))} placeholder="Confirm password" />
                 </View>
              </View>

              <View>
                 <Text style={modalStyles.label}>Profile Image</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#f1f5f9', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                       {formData.image ? <Image source={{ uri: formData.image }} style={{ width: '100%', height: '100%' }} /> : <Ionicons name="person" size={30} color="#cbd5e1" />}
                    </View>
                    <Pressable onPress={pickImage} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.accent }}>
                       <Text style={{ color: 'white', fontWeight: '700' }}>Choose File</Text>
                    </Pressable>
                 </View>
              </View>
           </View>
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}><Text style={modalStyles.cancelBtnText}>Cancel</Text></Pressable>
          <Pressable style={modalStyles.saveBtn} onPress={handleLocalSave}><Text style={modalStyles.saveBtnText}>{item ? "Update Customer" : "Create Customer"}</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

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
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
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
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
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
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
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
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
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
    boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
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
    boxShadow: "0 10px 40px -8px rgba(0,0,0,0.06)",
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
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
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
    boxShadow: "0 8px 20px rgba(13, 87, 49, 0.08)",
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
    zIndex: 100, // Ensure dropdowns float over rows
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
    fontSize: 11,
    fontWeight: "700",
    color: "#334155",
    textTransform: "uppercase",
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
    fontSize: 14,
    color: "#334155",
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
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  notifClear: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "600",
  },
  notifItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  notifItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },
  notifItemTime: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
  notifFooter: {
    paddingTop: 12,
    alignItems: "center",
  },
  notifFooterText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800",
  },
  notificationBadgeContainer: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1.5,
    borderColor: "white",
  },
  headerActionBtn: {
    padding: 8,
    borderRadius: 8,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  languageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  avatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  saleBadge: {
    position: 'absolute',
    bottom: -4,
    right: -10,
    backgroundColor: '#0d5731',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    transform: [{ rotate: '5deg' }],
    borderWidth: 1.5,
    borderColor: 'white',
  },
  saleBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
    marginLeft: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    flex: 1,
    maxWidth: 500,
    height: 46,
    overflow: 'hidden',
  },
  searchBarInput: {
    flex: 1,
    paddingHorizontal: 8,
    fontSize: 14,
    color: '#334155',
  },
  searchBarBtn: {
    backgroundColor: '#0d5731',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  searchBarBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  createNewBtn: {
    backgroundColor: '#0d5731',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  createNewBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  approvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  approvedBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  modernToggle: {
    width: 44,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#334155',
    padding: 2,
    justifyContent: 'center',
  },
  modernToggleActive: {
    backgroundColor: '#0d5731',
    alignItems: 'flex-end',
  },
  modernToggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
  },
  modernToggleThumbActive: {
    backgroundColor: 'white',
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  orderStatusTabs: {
    flexDirection: 'row',
    paddingBottom: 16,
    gap: 12,
  },
  orderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    gap: 8,
  },
  orderTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  orderTabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  orderTabBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  paidBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  statusUpdateBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusUpdateBtnText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  keywordTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  keywordTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
});

const SectionTitle = ({ title, icon }) => (
  <View style={modalStyles.sectionHeader}>
    <Ionicons name={icon} size={18} color={colors.accent} />
    <Text style={modalStyles.sectionTitleText}>{title}</Text>
  </View>
);

function EmployeeModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    gender: "Male",
    role: "admin",
    password: "",
    confirm_password: "",
    image: ""
  });

  useEffect(() => {
    if (visible) {
      if (item) {
        setFormData({
          ...item,
          password: "",
          confirm_password: ""
        });
      } else {
        setFormData({
          first_name: "",
          last_name: "",
          phone: "",
          email: "",
          gender: "Male",
          role: "admin",
          password: "",
          confirm_password: "",
          image: ""
        });
      }
    }
  }, [visible, item]);

  if (!visible) return null;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 900, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="person-outline" size={24} color="#0d5731" />
            <Text style={modalStyles.title}>{item ? "Edit Employee" : "Create New Employee"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color="#64748b" /></Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
             <Ionicons name="person-outline" size={20} color="#0d5731" />
             <Text style={{ fontSize: 18, fontWeight: '700', color: "#1e293b" }}>User Information</Text>
          </View>

          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 30 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', gap: 20, marginBottom: 20 }}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>First Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.first_name}
                    onChangeText={(v) => updateField("first_name", v)}
                    placeholder="First Name"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Last Name</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.last_name}
                    onChangeText={(v) => updateField("last_name", v)}
                    placeholder="Last Name"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={modalStyles.label}>Phone Number <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.phone}
                  onChangeText={(v) => updateField("phone", v)}
                  placeholder="Ex: +8801700000000"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={modalStyles.label}>Gender</Text>
                <View style={modalStyles.optionsRow}>
                  {["Male", "Female", "Other"].map((g) => (
                    <Pressable
                      key={g}
                      style={[modalStyles.pill, formData.gender === g && modalStyles.pillActive]}
                      onPress={() => updateField("gender", g)}
                    >
                      <Text style={[modalStyles.pillText, formData.gender === g && modalStyles.pillTextActive]}>{g}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ width: isMobile ? '100%' : 250, alignItems: 'center' }}>
               <View style={{ width: 200, height: 200, backgroundColor: '#f1f5f9', borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden' }}>
                  {formData.image ? (
                    <Image source={{ uri: resolveImageUrl(formData.image) }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <Text style={{ color: '#94a3b8', fontWeight: '700' }}>500 × 500</Text>
                  )}
               </View>
               <Text style={{ fontSize: 12, color: '#64748b', marginTop: 10, marginBottom: 10 }}>User profile (Ratio 1:1)</Text>
               <Pressable 
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => updateField("image", event.target.result);
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}
               >
                  <Text style={{ fontWeight: '700', color: "#1e293b" }}>Choose File</Text>
                  <Text style={{ color: '#64748b', fontSize: 12 }}>{formData.image ? "File selected" : "No file chosen"}</Text>
               </Pressable>
            </View>
          </View>

          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 20, marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Email <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={modalStyles.input}
                value={formData.email}
                onChangeText={(v) => updateField("email", v)}
                placeholder="Ex: ex@example.com"
                keyboardType="email-address"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Role <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <View style={modalStyles.optionsRow}>
                {["admin", "staff", "support"].map((r) => (
                  <Pressable
                    key={r}
                    style={[modalStyles.pill, formData.role === r && modalStyles.pillActive]}
                    onPress={() => updateField("role", r)}
                  >
                    <Text style={[modalStyles.pillText, formData.role === r && modalStyles.pillTextActive]}>
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 20, marginBottom: 30 }}>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Password <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={modalStyles.input}
                value={formData.password}
                onChangeText={(v) => updateField("password", v)}
                placeholder="Password"
                secureTextEntry
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={modalStyles.label}>Confirm Password <Text style={{ color: '#ef4444' }}>*</Text></Text>
              <TextInput
                style={modalStyles.input}
                value={formData.confirm_password}
                onChangeText={(v) => updateField("confirm_password", v)}
                placeholder="Confirm Password"
                secureTextEntry
              />
            </View>
          </View>

          <Pressable 
            style={{ backgroundColor: '#0d5731', height: 48, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginTop: 10, width: 120 }}
            onPress={() => {
              if (!formData.first_name || !formData.phone || !formData.email || (!item && !formData.password)) {
                if (Platform.OS === 'web') alert("Please fill in all required fields (First Name, Phone, Email, and Password for new employees).");
                else alert("Please fill in all required fields.");
                return;
              }
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(formData.email)) {
                if (Platform.OS === 'web') alert("Please enter a valid email address.");
                else alert("Invalid email.");
                return;
              }
              if (formData.password && formData.password.length < 6) {
                if (Platform.OS === 'web') alert("Password must be at least 6 characters long.");
                else alert("Password too short.");
                return;
              }
              if (formData.password !== formData.confirm_password) {
                if (Platform.OS === 'web') alert("Passwords do not match.");
                else alert("Passwords do not match.");
                return;
              }
              const submitData = { ...formData };
              submitData.name = `${formData.first_name} ${formData.last_name}`.trim();
              delete submitData.confirm_password;
              
              onSave(submitData);
            }}
          >
            <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>Submit</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}

export default AdminPanelScreen;
