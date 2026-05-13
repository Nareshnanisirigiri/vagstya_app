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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/theme";

const modalStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 24,
    overflow: "hidden",
    maxHeight: "90%",
    ...(Platform.OS === "web" ? { boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" } : { elevation: 10 }),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
  },
  body: {
    padding: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.ink,
    ...(Platform.OS === "web" ? { outlineStyle: "none" } : {}),
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelBtnText: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "700",
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accent,
  },
  saveBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default function NotificationModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (visible) {
      if (item) setFormData({ ...item });
      else setFormData({ title: "", description: "", is_active: 1 });
    }
  }, [visible, item]);

  if (!visible) return null;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const ModalSection = ({ title, icon, children }) => (
    <View style={{ marginBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 }}>
        <Ionicons name={icon} size={20} color={colors.accent} />
        <Text style={{ fontSize: 16, fontWeight: '800', color: colors.ink }}>{title}</Text>
      </View>
      {children}
    </View>
  );

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 600, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(13, 87, 49, 0.1)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="notifications" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={modalStyles.title}>{item?.id ? "Edit Notification" : "Send Push Notification"}</Text>
              <Text style={{ fontSize: 12, color: "#64748b" }}>Broadcast messages to customer devices</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Ionicons name="close" size={20} color={colors.subtleText} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={modalStyles.body} showsVerticalScrollIndicator={false}>
          <ModalSection title="Message Content" icon="chatbubble-ellipses-outline">
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 0 }}>
              <View style={{ flex: 1 }}>
                <Text style={[modalStyles.label, { marginTop: 0 }]}>Notification Title <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.title || ''}
                  onChangeText={(v) => updateField("title", v)}
                  placeholder="e.g. Flash Sale Alert!"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Message Body <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={[modalStyles.input, { height: 100, textAlignVertical: 'top' }]}
                  value={formData.description || formData.message || ''}
                  onChangeText={(v) => { updateField("description", v); updateField("message", v); }}
                  placeholder="Type your message here..."
                  multiline
                />
              </View>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Image URL (Optional)</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.image || formData.image_url || ''}
                  onChangeText={(v) => { updateField("image", v); updateField("image_url", v); }}
                  placeholder="https://..."
                />
              </View>
            </View>
          </ModalSection>

          <View style={{ height: 20 }} />
        </ScrollView>

        <View style={modalStyles.footer}>
          <Pressable style={modalStyles.cancelBtn} onPress={onClose}>
            <Text style={modalStyles.cancelBtnText}>Discard</Text>
          </Pressable>
          <Pressable 
            style={modalStyles.saveBtn} 
            onPress={() => {
              if (!formData.title || (!formData.description && !formData.message)) {
                alert("Title and Message are required.");
                return;
              }
              onSave(formData);
            }}
          >
            <Text style={modalStyles.saveBtnText}>{item?.id ? "Update Notification" : "Send Notification"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
