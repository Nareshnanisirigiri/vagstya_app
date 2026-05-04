import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AdminSidebar({
  sidebarCollapsed,
  setSidebarCollapsed,
  isMobile,
  isSidebarOpen,
  setIsSidebarOpen,
  expandedMenus,
  toggleMenu,
  selectedTable,
  activeView,
  pickTable,
  setActiveView,
  setSelectedTable,
  setSearchQuery,
  logout,
  dashboardData,
  colors,
  activeOrderStatusFilter,
  setActiveOrderStatusFilter,
}) {
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
             { name: "accepted_item", label: "Accepted Item", table: "products" },
             { name: "rejected_item", label: "Rejected Item", table: "products" }
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
          ]
        },
        { 
          name: "3rd_party_config", 
          label: "3rd Party Configuration", 
          icon: "chatbubbles-outline", 
          subItems: [
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

  if (isMobile && !isSidebarOpen) return null;

  return (
    <View style={[
      styles.sidebar, 
      sidebarCollapsed && styles.sidebarCollapsed,
      isMobile && styles.sidebarMobile
    ]}>
      <View style={styles.sidebarHeader}>
        {!sidebarCollapsed && <Text style={styles.logoText}>VOGSTYA</Text>}
        {isMobile ? (
           <Pressable onPress={() => setIsSidebarOpen(false)} style={styles.collapseBtn}>
             <Ionicons name="close" size={24} color={colors.subtleText} />
           </Pressable>
        ) : (
          <Pressable onPress={() => setSidebarCollapsed(!sidebarCollapsed)} style={styles.collapseBtn}>
            <Ionicons name={sidebarCollapsed ? "chevron-forward" : "chevron-back"} size={22} color={colors.subtleText} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
        {SIDEBAR_STRUCTURE.map((section) => (
          <View key={section.header} style={styles.sidebarSection}>
            {!sidebarCollapsed && <Text style={styles.navHeader}>{section.header}</Text>}
            {section.items.map((item) => {
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const isExpanded = expandedMenus[item.label];
              const isActive = 
                (item.table && selectedTable === item.table) || 
                (!item.table && !item.subItems && activeView === item.name) || 
                (hasSubItems && isExpanded);

              return (
                <View key={item.name}>
                  <Pressable
                    style={[
                      styles.navItem, 
                      isActive && styles.navItemActive,
                      hasSubItems && isExpanded && { backgroundColor: "rgba(13, 87, 49, 0.04)" }
                    ]}
                    onPress={() => {
                      if (hasSubItems) {
                        toggleMenu(item.label);
                      } else {
                        if (item.table) {
                          pickTable(item.table);
                          setActiveView("table");
                        } else {
                          setSelectedTable(null);
                          setActiveView(item.name);
                        }
                        if(isMobile) setIsSidebarOpen(false);
                      }
                    }}
                  >
                    <Ionicons 
                      name={item.icon} 
                      size={20} 
                      color={(isActive || (hasSubItems && isExpanded)) ? colors.accent : colors.subtleText} 
                    />
                    {!sidebarCollapsed && (
                      <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <Text style={[
                          styles.navItemText, 
                          (isActive || (hasSubItems && isExpanded)) && styles.navItemTextActive,
                          hasSubItems && isExpanded && { color: "#0d5731", fontWeight: "700" }
                        ]}>
                          {item.label}
                        </Text>
                        {hasSubItems && (
                          <Ionicons 
                            name={isExpanded ? "chevron-up" : "chevron-down"} 
                            size={14} 
                            color={(isActive || (hasSubItems && isExpanded)) ? colors.accent : colors.subtleText} 
                          />
                        )}
                      </View>
                    )}
                  </Pressable>
                  
                  {hasSubItems && isExpanded && !sidebarCollapsed && (
                    <View style={styles.subItemsContainer}>
                      <View style={styles.subItemsLine} />
                      {item.subItems.map(sub => (
                        <Pressable 
                          key={sub.name}
                          style={styles.subItem}
                          onPress={() => {
                            if (sub.table) {
                              pickTable(sub.table);
                              setActiveView("table");
                              if (sub.table === "orders" && setActiveOrderStatusFilter) {
                                setActiveOrderStatusFilter(sub.name);
                              } else {
                                setSearchQuery("");
                              }
                            } else {
                              setSelectedTable(null);
                              setActiveView(sub.name);
                            }
                            if(isMobile) setIsSidebarOpen(false);
                          }}
                        >
                          <Text style={styles.subItemText}>{sub.label}</Text>
                          {sub.count !== undefined && (
                            <View style={[styles.subItemBadge, { backgroundColor: sub.countColor }]}>
                              <Text style={styles.subItemBadgeText}>{sub.count}</Text>
                            </View>
                          )}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Pressable style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          {!sidebarCollapsed && <Text style={styles.logoutText}>Logout</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: "#f8f9fa",
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
    height: Platform.OS === "web" ? "100vh" : "100%",
  },
  sidebarCollapsed: {
    width: 70,
  },
  sidebarMobile: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 1000,
    width: 280,
  },
  sidebarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    height: 70,
  },
  logoText: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0d5731",
    letterSpacing: 1.5,
  },
  collapseBtn: {
    padding: 4,
  },
  sidebarScroll: {
    flex: 1,
    paddingVertical: 10,
  },
  sidebarSection: {
    marginBottom: 15,
  },
  navHeader: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    paddingHorizontal: 20,
    paddingVertical: 10,
    letterSpacing: 1,
    marginTop: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  navItemActive: {
    backgroundColor: "rgba(13, 87, 49, 0.08)",
    borderLeftWidth: 4,
    borderLeftColor: "#0d5731",
    paddingLeft: 16,
  },
  navItemText: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  navItemTextActive: {
    color: "#0d5731",
    fontWeight: "600",
  },
  subItemsContainer: {
    paddingLeft: 44,
    position: "relative",
    marginTop: 4,
    marginBottom: 4,
  },
  subItemsLine: {
    position: "absolute",
    left: 28,
    top: 4,
    bottom: 4,
    width: 2,
    backgroundColor: "#d1d5db",
  },
  subItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingRight: 20,
  },
  subItemText: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  subItemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  subItemBadgeText: {
    fontSize: 10,
    color: "white",
    fontWeight: "700",
  },
  sidebarFooter: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    padding: 16,
    marginTop: "auto",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff1f2",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fee2e2",
  },
  logoutText: {
    fontSize: 13,
    color: "#ef4444",
    fontWeight: "700",
  },
});
