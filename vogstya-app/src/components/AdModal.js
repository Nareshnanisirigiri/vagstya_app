import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { resolveImageUrl } from "../api/client";

const { width } = Dimensions.get("window");

const AdModal = ({
  visible,
  onClose,
  onSave,
  item,
  loading: saving,
}) => {
  const [formData, setFormData] = useState({
    title: "",
    image_url: "",
    status: 1,
  });

  useEffect(() => {
    if (visible) {
      if (item) {
        setFormData({
          title: item.title || "",
          image_url: item.media_src || item.image_url || "",
          status: item.status ?? 1,
        });
      } else {
        setFormData({
          title: "",
          image_url: "",
          status: 1,
        });
      }
    }
  }, [item, visible]);

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
            setFormData(prev => ({
              ...prev,
              image_url: event.target.result
            }));
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    } else {
      alert("Image picking on mobile is not supported in this version.");
    }
  };

  const handleSave = () => {
    onSave(formData);
  };



  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{item ? "Edit Ad" : "Create New Ad"}</Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#64748b" />
            </Pressable>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                placeholder="Enter ad title"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.field}>
              <View style={styles.previewContainer}>
                {formData.image_url ? (
                  <Image
                    source={{ uri: resolveImageUrl(formData.image_url) }}
                    style={styles.previewImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.placeholder}>
                    <Ionicons name="image-outline" size={64} color="#94a3b8" />
                  </View>
                )}
              </View>
              
              <Text style={styles.ratioLabel}>Ad Ratio (400 × 250 px) *</Text>
              
              <View style={styles.fileSelector}>
                <Pressable style={styles.chooseFileBtn} onPress={handlePickImage}>
                  <Text style={styles.chooseFileText}>Choose File</Text>
                </Pressable>
                <View style={styles.fileNameContainer}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {formData.image_url ? "Image selected" : "No file chosen"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Pressable
              style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: Platform.OS === "web" ? 500 : width * 0.9,
    backgroundColor: "white",
    borderRadius: 12,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },
  closeBtn: {
    padding: 4,
  },
  form: {
    padding: 20,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1e293b",
    backgroundColor: "#fff",
  },
  previewContainer: {
    width: "100%",
    aspectRatio: 400 / 250,
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  ratioLabel: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 8,
    fontWeight: "500",
  },
  fileSelector: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  chooseFileBtn: {
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  chooseFileText: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "500",
  },
  fileNameContainer: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  fileName: {
    fontSize: 14,
    color: "#64748b",
  },
  footer: {
    padding: 20,
    paddingTop: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  submitBtn: {
    backgroundColor: "#0d5731",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    minWidth: 120,
    alignItems: "center",
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});

export default AdModal;
