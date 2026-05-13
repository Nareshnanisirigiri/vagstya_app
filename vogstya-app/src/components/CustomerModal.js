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
import { Image } from "expo-image";

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
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pillActive: {
    backgroundColor: colors.accent + "1A",
    borderColor: colors.accent,
  },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b",
  },
  pillTextActive: {
    color: colors.accent,
    fontWeight: "700",
  },
});

export default function CustomerModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (visible) {
      if (item) setFormData({ ...item });
      else setFormData({ name: "", email: "", phone: "", is_active: 1, password: "" });
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
              <Ionicons name="people" size={20} color={colors.accent} />
            </View>
            <View>
              <Text style={modalStyles.title}>{item?.id ? "Edit User Profile" : "Create New User"}</Text>
              <Text style={{ fontSize: 12, color: "#64748b" }}>Manage user account details and permissions</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={{ padding: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#e2e8f0' }}>
            <Ionicons name="close" size={20} color={colors.subtleText} />
          </Pressable>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={modalStyles.body} showsVerticalScrollIndicator={false}>
          <ModalSection title="Personal Information" icon="person-outline">
            <View style={{ flexDirection: 'row', gap: 16, marginBottom: 0 }}>
              <View style={{ flex: 1 }}>
                <Text style={[modalStyles.label, { marginTop: 0 }]}>Full Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.name || ''}
                  onChangeText={(v) => updateField("name", v)}
                  placeholder="e.g. John Doe"
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Email Address <Text style={{ color: '#ef4444' }}>*</Text></Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.email || ''}
                  onChangeText={(v) => updateField("email", v)}
                  placeholder="john.doe@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={modalStyles.label}>Phone Number</Text>
                <TextInput
                  style={modalStyles.input}
                  value={formData.phone || ''}
                  onChangeText={(v) => updateField("phone", v)}
                  placeholder="+91 9876543210"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </ModalSection>

          <ModalSection title="Account Security" icon="lock-closed-outline">
            <Text style={[modalStyles.label, { marginTop: 0 }]}>
              {item?.id ? "Change Password (Leave blank to keep current)" : "Password *"}
            </Text>
            <TextInput
              style={modalStyles.input}
              value={formData.password || ''}
              onChangeText={(v) => updateField("password", v)}
              placeholder="••••••••"
              secureTextEntry
            />
          </ModalSection>

          <ModalSection title="Account Status" icon="shield-checkmark-outline">
            <Text style={[modalStyles.label, { marginTop: 0 }]}>Is Active</Text>
            <View style={modalStyles.optionsRow}>
              <Pressable
                style={[modalStyles.pill, (formData.is_active === 1 || formData.is_active === undefined) && modalStyles.pillActive]}
                onPress={() => updateField("is_active", 1)}
              >
                <Text style={[modalStyles.pillText, (formData.is_active === 1 || formData.is_active === undefined) && modalStyles.pillTextActive]}>Active User</Text>
              </Pressable>
              <Pressable
                style={[modalStyles.pill, formData.is_active === 0 && modalStyles.pillActive]}
                onPress={() => updateField("is_active", 0)}
              >
                <Text style={[modalStyles.pillText, formData.is_active === 0 && modalStyles.pillTextActive]}>Suspended / Inactive</Text>
              </Pressable>
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
              if (!formData.name || !formData.email) {
                alert("Name and Email are required.");
                return;
              }
              if (!item?.id && !formData.password) {
                alert("Password is required for new users.");
                return;
              }
              onSave(formData);
            }}
          >
            <Text style={modalStyles.saveBtnText}>{item?.id ? "Save Changes" : "Create User"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
