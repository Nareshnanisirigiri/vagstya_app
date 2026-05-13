import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/theme";
import { Image } from "expo-image";

const modalStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "92%",
    ...(Platform.OS === "web" ? { boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" } : { elevation: 20 }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: -0.5,
  },
  body: {
    padding: 0,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14,
    color: colors.ink,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  cancelBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  cancelBtnText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "700",
  },
  saveBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#0d5731",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
  bannerPreviewContainer: {
    width: "100%",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 24,
    alignItems: "center",
  },
  bannerPreviewFrame: {
    width: "100%",
    aspectRatio: 4 / 1,
    borderRadius: 16,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  uploadOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    zIndex: 10,
  },
  typePill: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  typePillActive: {
    borderColor: "#0d5731",
    backgroundColor: "rgba(13, 87, 49, 0.05)",
  },
  typePillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  typePillTextActive: {
    color: "#0d5731",
    fontWeight: "800",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: "#0d5731",
    borderColor: "#0d5731",
  }
});

export default function BannerModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (item) {
        setFormData({ 
          ...item, 
          image_url: item.image_url || item.media_src || "" 
        });
      } else {
        setFormData({ title: "", url: "", image_url: "", type: "main", is_active: 1, is_for_own_shop: 0 });
      }
    }
  }, [visible, item]);

  if (!visible) return null;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const handlePickImage = () => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            updateField("image_url", event.target.result);
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("data:") || path.startsWith("http")) return path;
    
    // Fallback for relative paths from the server
    const serverRoot = "http://localhost:5000"; 
    const cleaned = path.replace(/^\/+/, "");
    if (cleaned.startsWith("uploads/")) return `${serverRoot}/${cleaned}`;
    return `${serverRoot}/uploads/${cleaned}`;
  };

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 750 }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(13, 87, 49, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="images" size={22} color="#0d5731" />
            </View>
            <View>
              <Text style={modalStyles.title}>{item?.id ? "Update Banner" : "Publish New Banner"}</Text>
              <Text style={{ fontSize: 13, color: "#64748b" }}>Ratio 4:1 (Recommended 2000 × 500 px)</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 12, backgroundColor: '#f8fafc' }}>
            <Ionicons name="close" size={24} color="#64748b" />
          </Pressable>
        </View>

        <ScrollView style={modalStyles.body} showsVerticalScrollIndicator={false}>
          {/* Banner Preview Area */}
          <View style={modalStyles.bannerPreviewContainer}>
            <View style={modalStyles.bannerPreviewFrame}>
              {formData.image_url ? (
                <Image 
                  source={{ uri: resolveImageUrl(formData.image_url) }} 
                  style={{ width: '100%', height: '100%' }} 
                  contentFit="cover" 
                />
              ) : (
                <View style={{ alignItems: 'center', padding: 20 }}>
                  <Ionicons name="cloud-upload-outline" size={48} color="#cbd5e1" />
                  <Text style={{ color: '#94a3b8', fontWeight: '700', marginTop: 12 }}>No Banner Selected</Text>
                  <Text style={{ fontSize: 12, color: '#cbd5e1', marginTop: 4 }}>Click Upload to choose a 4:1 graphic</Text>
                </View>
              )}
              
              <Pressable onPress={handlePickImage} style={modalStyles.uploadOverlay}>
                <Ionicons name="camera" size={16} color="#0d5731" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: "#0d5731" }}>{formData.image_url ? "Change Banner" : "Upload Banner"}</Text>
              </Pressable>
            </View>
          </View>

          {/* Configuration Form */}
          <View style={modalStyles.section}>
            <View style={{ gap: 20 }}>
              <View>
                <Text style={modalStyles.label}>Banner Title</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.title || formData.name || ''}
                  onChangeText={(v) => { updateField("title", v); updateField("name", v); }}
                  placeholder="e.g. Festive Gold Collection 2024"
                  placeholderTextColor="#94a3b8"
                />
              </View>

              <View>
                <Text style={modalStyles.label}>Redirect URL (Optional)</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[modalStyles.input, { paddingLeft: 44 }]}
                    value={formData.url || formData.link || ''}
                    onChangeText={(v) => { updateField("url", v); updateField("link", v); }}
                    placeholder="https://vogstya.com/category/jewellery"
                    placeholderTextColor="#94a3b8"
                  />
                  <Ionicons name="link" size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 15 }} />
                </View>
              </View>

              <Pressable 
                onPress={() => updateField("is_for_own_shop", formData.is_for_own_shop === 1 ? 0 : 1)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}
              >
                <View style={[modalStyles.checkbox, formData.is_for_own_shop === 1 && modalStyles.checkboxActive]}>
                  {formData.is_for_own_shop === 1 && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink }}>This Banner For Own Shop</Text>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>Check this if the promotion is specifically for Satya Bhama store</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={modalStyles.section}>
            <Text style={modalStyles.label}>Placement Type</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {["main", "popup", "sidebar"].map(type => (
                <Pressable
                  key={type}
                  style={[modalStyles.typePill, (formData.type === type || (!formData.type && type === 'main')) && modalStyles.typePillActive]}
                  onPress={() => updateField("type", type)}
                >
                  <Text style={[modalStyles.typePillText, (formData.type === type || (!formData.type && type === 'main')) && modalStyles.typePillTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[modalStyles.label, { marginTop: 24 }]}>Publication Status</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                style={[modalStyles.typePill, (formData.is_active === 1 || formData.is_active === undefined) && modalStyles.typePillActive, { flex: 1 }]}
                onPress={() => updateField("is_active", 1)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: (formData.is_active === 1 || formData.is_active === undefined) ? '#10b981' : '#cbd5e1' }} />
                  <Text style={[modalStyles.typePillText, (formData.is_active === 1 || formData.is_active === undefined) && modalStyles.typePillTextActive]}>Active & Visible</Text>
                </View>
              </Pressable>
              <Pressable
                style={[modalStyles.typePill, formData.is_active === 0 && modalStyles.typePillActive, { flex: 1 }]}
                onPress={() => updateField("is_active", 0)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: formData.is_active === 0 ? '#ef4444' : '#cbd5e1' }} />
                  <Text style={[modalStyles.typePillText, formData.is_active === 0 && modalStyles.typePillTextActive]}>Draft / Hidden</Text>
                </View>
              </Pressable>
            </View>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelBtnText}>Discard Changes</Text>
          </Pressable>
          <Pressable 
            style={modalStyles.saveBtn} 
            onPress={() => {
              if (!formData.image_url && !formData.image) {
                alert("Please select or upload a banner image before publishing.");
                return;
              }
              onSave(formData);
            }}
          >
            <Ionicons name="cloud-done-outline" size={18} color="white" />
            <Text style={modalStyles.saveBtnText}>{item?.id ? "Update & Sync" : "Publish Banner"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
