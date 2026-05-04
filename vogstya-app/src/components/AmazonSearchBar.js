import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors } from "../theme/theme";
import { useProducts } from "../context/ProductsContext";

const CATEGORIES = [
  "All Categories",
  "Jewellery",
  "Sarees",
  "Men",
  "Fashion Accessories",
  "Festive Vibes",
  "Women",
];

export default function AmazonSearchBar({ onSearch }) {
  const navigation = useNavigation();
  const { products } = useProducts();
  const [query, setQuery] = useState("");
  const [selectedCat, setSelectedCat] = useState("All");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [history, setHistory] = useState([]);

  // Load history
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("@vogstya_search_history");
        if (saved) setHistory(JSON.parse(saved));
      } catch (e) {}
    })();
  }, []);

  const saveHistory = async (q) => {
    const normalized = q.trim();
    if (!normalized) return;
    const next = [normalized, ...history.filter(h => h !== normalized)].slice(0, 10);
    setHistory(next);
    await AsyncStorage.setItem("@vogstya_search_history", JSON.stringify(next));
  };

  const clearHistory = async () => {
    setHistory([]);
    await AsyncStorage.removeItem("@vogstya_search_history");
  };

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.category.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [query, products]);

  const handleSearch = (q = query, cat = selectedCat) => {
    const finalQ = q.trim();
    if (finalQ) {
      saveHistory(finalQ);
      if (onSearch) onSearch(finalQ, cat === "All" ? "" : cat);
      setIsHistoryOpen(false);
      setIsCatOpen(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Backdrop for click-outside to close */}
      {(isCatOpen || isHistoryOpen) && (
        <Pressable 
          style={styles.backdrop} 
          onPress={() => {
            setIsCatOpen(false);
            setIsHistoryOpen(false);
          }}
        />
      )}

      <View style={styles.searchBar}>
        {/* Category Dropdown */}
        <Pressable 
          style={styles.catSelector} 
          onPress={() => {
            setIsCatOpen(!isCatOpen);
            setIsHistoryOpen(false);
          }}
        >
          <Text style={styles.catText} numberOfLines={1}>
            {selectedCat}
          </Text>
          <Ionicons name="caret-down" size={12} color="#555" />
        </Pressable>

        {/* Input Field */}
        <TextInput
          style={styles.input}
          placeholder="Search Vogstya"
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setIsHistoryOpen(true);
            setIsCatOpen(false);
          }}
          onFocus={() => setIsHistoryOpen(true)}
          onSubmitEditing={() => handleSearch()}
        />

        {/* Search Icon Button */}
        <Pressable style={styles.searchBtn} onPress={() => handleSearch()}>
          <Ionicons name="search" size={20} color="#333" />
        </Pressable>
      </View>

      {/* Categories Dropdown */}
      {isCatOpen && (
        <View style={styles.catDropdown}>
          <ScrollView style={styles.dropdownScroll}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCat(cat === "All Categories" ? "All" : cat);
                  setIsCatOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{cat}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* History & Suggestions Dropdown */}
      {isHistoryOpen && (query.trim() || history.length > 0) && (
        <View style={styles.historyDropdown}>
          <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
            {/* Quick Explore Section (Always visible when dropdown open) */}
            <View style={styles.quickExploreSection}>
              <Text style={styles.sectionTitle}>Quick Explore</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.quickLinksRow}
              >
                {[
                  { label: "Collections", cat: "Collections", icon: "grid-outline" },
                  { label: "Fashion Accessories", cat: "Fashion Accessories", icon: "watch-outline" },
                  { label: "Festive Vibes", cat: "Festive Vibes", icon: "sparkles-outline" },
                  { label: "Jewellery", cat: "Jewellery", icon: "diamond-outline" },
                  { label: "Men", cat: "Men", icon: "shirt-outline" },
                  { label: "Sarees", cat: "Sarees", icon: "color-palette-outline" },
                  { label: "Women", cat: "Women", icon: "female-outline" },
                ].map((link) => (
                  <Pressable
                    key={link.label}
                    style={styles.quickLinkChip}
                    onPress={() => {
                      navigation.navigate("Shop", { selectedCategory: link.cat, collectionTitle: link.label });
                      setIsHistoryOpen(false);
                    }}
                  >
                    <Ionicons name={link.icon} size={14} color="#f6b51e" />
                    <Text style={styles.quickLinkLabel}>{link.label}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {query.trim() ? (
              <>
                <Text style={styles.sectionTitle}>Suggestions</Text>
                {suggestions.map((p) => (
                  <Pressable
                    key={p.id}
                    style={styles.suggestionItem}
                    onPress={() => {
                      saveHistory(p.name);
                      navigation.navigate("ProductDetails", { productId: p.id });
                      setIsHistoryOpen(false);
                    }}
                  >
                    <Ionicons name="search-outline" size={16} color="#999" />
                    <Text style={styles.suggestionText}>{p.name}</Text>
                  </Pressable>
                ))}
                {suggestions.length === 0 && (
                  <Text style={styles.emptyText}>No matches found</Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Recent Searches</Text>
                  <Pressable onPress={clearHistory}>
                    <Text style={styles.clearBtnText}>Clear All</Text>
                  </Pressable>
                </View>
                {history.map((h, i) => (
                  <Pressable
                    key={i}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setQuery(h);
                      handleSearch(h);
                    }}
                  >
                    <Ionicons name="time-outline" size={16} color="#999" />
                    <Text style={styles.suggestionText}>{h}</Text>
                  </Pressable>
                ))}
              </>
            )}
          </ScrollView>
          <Pressable style={styles.closeBtn} onPress={() => setIsHistoryOpen(false)}>
             <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    zIndex: 1001,
  },
  backdrop: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: -1000,
    left: -2000,
    right: -2000,
    bottom: -5000,
    backgroundColor: "transparent",
    zIndex: 1000,
  },
  searchBar: {
    flexDirection: "row",
    height: 38,
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
    ...Platform.select({
      web: { boxShadow: "0 2px 4px rgba(0,0,0,0.1)" },
      default: { elevation: 2 },
    }),
  },
  catSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f3f3",
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: "#ccc",
    gap: 4,
    minWidth: 60,
  },
  catText: {
    fontSize: 13,
    color: "#555",
    fontWeight: "600",
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#111",
  },
  searchBtn: {
    width: 50,
    backgroundColor: "#febd69", // Amazon Orange
    alignItems: "center",
    justifyContent: "center",
  },
  catDropdown: {
    position: "absolute",
    top: 44,
    left: 0,
    width: 220,
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    maxHeight: 400,
    zIndex: 9999,
    ...Platform.select({
      web: { boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
      default: { elevation: 10 },
    }),
  },
  historyDropdown: {
    position: "absolute",
    top: 44,
    left: -100, // Extend left to cover more area
    right: -100, // Extend right to cover more area
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    maxHeight: 500,
    zIndex: 99999,
    paddingTop: 8,
    ...Platform.select({
      web: { 
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        width: "120%",
        alignSelf: 'center'
      },
      default: { elevation: 20 },
    }),
  },
  dropdownScroll: {
    paddingVertical: 4,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eee",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  clearBtnText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: "700",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: "#111",
    fontWeight: "600",
  },
  emptyText: {
    padding: 20,
    textAlign: "center",
    color: "#999",
    fontStyle: "italic",
  },
  closeBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  closeText: {
    color: "#666",
    fontSize: 13,
    fontWeight: "700",
  },
  quickExploreSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fafbfc",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  quickLinksRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginTop: 8,
    paddingBottom: 4,
  },
  quickLinkChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
    ...Platform.select({
      web: { 
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        transition: 'all 0.2s ease'
      },
      default: { elevation: 2 },
    }),
  },
  quickLinkLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0d5731", // Forest Green
  },
});
