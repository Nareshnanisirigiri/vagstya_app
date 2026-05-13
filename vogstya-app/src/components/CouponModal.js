import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Simple helper to format date for display
const formatDate = (date) => {
  if (!date) return "";
  return date.toLocaleDateString();
};

const formatTime = (date) => {
  if (!date) return "";
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CouponModal = ({ visible, onClose, onSave, editingItem }) => {
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "amount",
    discount: "",
    min_purchase: "",
    limit_per_user: "1",
    max_discount: "",
    start_date: new Date(),
    expire_date: new Date(),
    shop_ids: [],
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setFormData({
        ...editingItem,
        start_date: editingItem.start_date ? new Date(editingItem.start_date) : new Date(),
        expire_date: editingItem.expire_date ? new Date(editingItem.expire_date) : new Date(),
        shop_ids: editingItem.shop_ids ? editingItem.shop_ids.split(',') : [],
      });
    } else {
      setFormData({
        code: "",
        discount_type: "amount",
        discount: "",
        min_purchase: "",
        limit_per_user: "1",
        max_discount: "",
        start_date: new Date(),
        expire_date: new Date(),
        shop_ids: [],
      });
    }
  }, [editingItem, visible]);

  const handleSave = async () => {
    if (!formData.code || !formData.discount) {
      alert("Please fill in Code and Discount");
      return;
    }

    setLoading(true);
    try {
      await onSave({
        ...formData,
        start_date: formData.start_date.toISOString().slice(0, 19).replace('T', ' '),
        expire_date: formData.expire_date.toISOString().slice(0, 19).replace('T', ' '),
      });
      onClose();
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="create-outline" size={24} color="#0d5731" style={{ marginRight: 10 }} />
                <Text style={styles.headerTitle}>{editingItem ? "Edit Promo Code" : "Create Promo Code"}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <View style={styles.formGrid}>
              {/* Shop selection (Placeholder for now) */}
              <View style={[styles.inputGroup, { width: '100%' }]}>
                <Text style={styles.label}>Select shops</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    placeholder="All Shops"
                    style={styles.input}
                    editable={false}
                  />
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Voucher Code <Text style={{ color: 'red' }}>*</Text></Text>
                <TextInput
                  value={formData.code}
                  onChangeText={(text) => setFormData({ ...formData, code: text })}
                  placeholder="WELCOME"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Discount Type <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <Pressable 
                    onPress={() => setFormData({ ...formData, discount_type: formData.discount_type === 'amount' ? 'percentage' : 'amount' })}
                    style={[styles.input, { justifyContent: 'center' }]}
                  >
                    <Text style={{ color: formData.discount_type ? '#1e293b' : '#94a3b8' }}>
                        {formData.discount_type === 'amount' ? 'Amount' : 'Percentage'}
                    </Text>
                  </Pressable>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Discount <Text style={{ color: 'red' }}>*</Text></Text>
                <TextInput
                  value={String(formData.discount)}
                  onChangeText={(text) => setFormData({ ...formData, discount: text })}
                  placeholder="1"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Minimum Order Amount <Text style={{ color: 'red' }}>*</Text></Text>
                <TextInput
                  value={String(formData.min_purchase)}
                  onChangeText={(text) => setFormData({ ...formData, min_purchase: text })}
                  placeholder="499"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Limit For Single User</Text>
                <TextInput
                  value={String(formData.limit_per_user)}
                  onChangeText={(text) => setFormData({ ...formData, limit_per_user: text })}
                  placeholder="1"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Maximum Discount Amount</Text>
                <TextInput
                  value={String(formData.max_discount)}
                  onChangeText={(text) => setFormData({ ...formData, max_discount: text })}
                  placeholder="1"
                  keyboardType="numeric"
                  style={styles.input}
                />
              </View>

              {/* Dates */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Date <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    type={Platform.OS === 'web' ? "date" : "text"}
                    value={formData.start_date instanceof Date ? formData.start_date.toISOString().split('T')[0] : formData.start_date}
                    onChangeText={(text) => setFormData({ ...formData, start_date: new Date(text) })}
                    style={styles.input}
                  />
                  <Ionicons name="calendar-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Start Time <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    type={Platform.OS === 'web' ? "time" : "text"}
                    value={formData.start_date instanceof Date ? formData.start_date.toTimeString().split(' ')[0].slice(0, 5) : ""}
                    onChangeText={(text) => {
                      const [h, m] = text.split(':');
                      const d = new Date(formData.start_date);
                      d.setHours(h, m);
                      setFormData({ ...formData, start_date: d });
                    }}
                    style={styles.input}
                  />
                  <Ionicons name="time-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expired Date <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    type={Platform.OS === 'web' ? "date" : "text"}
                    value={formData.expire_date instanceof Date ? formData.expire_date.toISOString().split('T')[0] : formData.expire_date}
                    onChangeText={(text) => setFormData({ ...formData, expire_date: new Date(text) })}
                    style={styles.input}
                  />
                  <Ionicons name="calendar-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Expired Time <Text style={{ color: 'red' }}>*</Text></Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    type={Platform.OS === 'web' ? "time" : "text"}
                    value={formData.expire_date instanceof Date ? formData.expire_date.toTimeString().split(' ')[0].slice(0, 5) : ""}
                    onChangeText={(text) => {
                      const [h, m] = text.split(':');
                      const d = new Date(formData.expire_date);
                      d.setHours(h, m);
                      setFormData({ ...formData, expire_date: d });
                    }}
                    style={styles.input}
                  />
                  <Ionicons name="time-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={handleSave} 
                style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>{editingItem ? "Update" : "Create"}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    width: Math.min(width * 0.9, 800),
    maxHeight: "90%",
    borderRadius: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
  },
  closeBtn: {
    padding: 4,
  },
  formScroll: {
    padding: 20,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  inputGroup: {
    width: '48%', // Default for 2 columns
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    height: 48,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  datePickerBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    height: 48,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#f8fafc",
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelBtnText: {
    color: "#64748b",
    fontWeight: "700",
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#0d5731",
  },
  saveBtnText: {
    color: "white",
    fontWeight: "700",
  },
});

export default CouponModal;
