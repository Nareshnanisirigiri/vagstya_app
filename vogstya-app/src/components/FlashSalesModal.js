import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Platform, ScrollView, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function FlashSalesModal({ visible, item, onClose, onSave }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({ title: "", start_date: "", end_date: "", status: 1 });

  useEffect(() => {
    if (visible) {
      if (item) setFormData({ ...item });
      else setFormData({ title: "", start_date: "", end_date: "", status: 1 });
    }
  }, [visible, item]);

  if (!visible) return null;

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  return (
    <View style={styles.overlay}>
      <View style={[styles.container, { width: isMobile ? '95%' : 500 }]}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Ionicons name="flash" size={24} color="#f59e0b" />
            <Text style={styles.title}>{item ? "Edit Flash Sale" : "Add New Flash Sale"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color="#64748b" /></Pressable>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title <Text style={{ color: '#ef4444' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(v) => updateField("title", v)}
              placeholder="E.g. Diwali Mega Sale"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={styles.input}
              value={formData.start_date}
              onChangeText={(v) => updateField("start_date", v)}
              placeholder="YYYY-MM-DD"
              type={Platform.OS === 'web' ? 'date' : 'default'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date</Text>
            <TextInput
              style={styles.input}
              value={formData.end_date}
              onChangeText={(v) => updateField("end_date", v)}
              placeholder="YYYY-MM-DD"
              type={Platform.OS === 'web' ? 'date' : 'default'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable 
                style={[styles.pill, formData.status == 1 && styles.pillActive]}
                onPress={() => updateField("status", 1)}
              >
                <Text style={[styles.pillText, formData.status == 1 && styles.pillTextActive]}>Active</Text>
              </Pressable>
              <Pressable 
                style={[styles.pill, formData.status == 0 && styles.pillActive]}
                onPress={() => updateField("status", 0)}
              >
                <Text style={[styles.pillText, formData.status == 0 && styles.pillTextActive]}>Inactive</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Discard</Text>
          </Pressable>
          <Pressable 
            style={styles.saveBtn} 
            onPress={() => {
              if (!formData.title) {
                alert("Title is required.");
                return;
              }
              onSave(formData);
            }}
          >
            <Text style={styles.saveBtnText}>{item ? "Update" : "Save"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  body: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#fff',
    outlineStyle: 'none',
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pillActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  pillTextActive: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
    gap: 12,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0d5731',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  }
});
