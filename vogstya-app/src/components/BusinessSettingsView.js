import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

export default function BusinessSettingsView({ colors, token, apiRequest }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Settings State
  const [settings, setSettings] = useState({
    website_name: "",
    website_title: "",
    currency: "USD",
    phone: "",
    email: "",
    address: "",
    primary_color: "#0d5731",
    secondary_color: "#f59e0b",
    logo_url: "",
    favicon_url: ""
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await apiRequest("/admin/data/tables/generate_settings", { token });
      if (data && data.rows) {
        const settingsMap = {};
        data.rows.forEach(row => {
          settingsMap[row.setting_key] = row.setting_value;
        });
        
        setSettings(prev => ({ ...prev, ...settingsMap }));
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // We will loop through the settings state and update each one.
      // If the setting exists, we PUT it. Wait, the backend doesn't have an upsert easily accessible.
      // Actually, the generic backend CRUD `createRecord` does NOT support upsert by setting_key.
      // So we can send an array or multiple requests.
      
      const promises = Object.entries(settings).map(async ([key, value]) => {
        // Find existing record ID to PUT, or POST new
        const existingData = await apiRequest(`/admin/data/tables/generate_settings`, { token });
        const existingRow = existingData?.rows?.find(r => r.setting_key === key);
        
        if (existingRow) {
          return apiRequest(`/admin/data/tables/generate_settings/${existingRow.id}`, {
            method: "PUT",
            token,
            body: { setting_value: value }
          });
        } else {
          return apiRequest(`/admin/data/tables/generate_settings`, {
            method: "POST",
            token,
            body: { setting_key: key, setting_value: value }
          });
        }
      });
      
      await Promise.all(promises);
      if(Platform.OS === 'web') alert("Settings saved successfully!");
    } catch (err) {
      console.error("Save error:", err);
      if(Platform.OS === 'web') alert("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const pickImage = (key) => {
    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => updateSetting(key, event.target.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Business Settings</Text>
        <Pressable style={[styles.saveBtn, { backgroundColor: colors.accent }]} onPress={handleSave}>
          {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Save Settings</Text>}
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
          <Text style={styles.cardTitle}>General Information</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website Name</Text>
            <TextInput style={styles.input} value={settings.website_name} onChangeText={v => updateSetting("website_name", v)} placeholder="E.g. Vogstya" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Website Title</Text>
            <TextInput style={styles.input} value={settings.website_title} onChangeText={v => updateSetting("website_title", v)} placeholder="E.g. Vogstya | Premium Jewellery" />
          </View>
        </View>
        
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Currency</Text>
            <TextInput style={styles.input} value={settings.currency} onChangeText={v => updateSetting("currency", v)} placeholder="USD / INR" />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={settings.phone} onChangeText={v => updateSetting("phone", v)} placeholder="+1 234 567 890" />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} value={settings.email} onChangeText={v => updateSetting("email", v)} placeholder="contact@example.com" />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={settings.address} onChangeText={v => updateSetting("address", v)} multiline placeholder="123 Main St, City, Country" />
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="color-palette-outline" size={20} color={colors.accent} />
          <Text style={styles.cardTitle}>Theme Styling</Text>
        </View>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Primary Color</Text>
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: settings.primary_color || "#0d5731", marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' }} />
              <TextInput style={{ flex: 1, outlineStyle: 'none' }} value={settings.primary_color} onChangeText={v => updateSetting("primary_color", v)} placeholder="#0d5731" />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Secondary Color</Text>
            <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: settings.secondary_color || "#f59e0b", marginRight: 10, borderWidth: 1, borderColor: '#e2e8f0' }} />
              <TextInput style={{ flex: 1, outlineStyle: 'none' }} value={settings.secondary_color} onChangeText={v => updateSetting("secondary_color", v)} placeholder="#f59e0b" />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.row}>
        <View style={[styles.card, { flex: 1, marginRight: 12 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="image-outline" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Website Logo</Text>
          </View>
          <Text style={styles.subLabel}>Recommended ratio: 4:1</Text>
          <View style={styles.imageUploadBox}>
             {settings.logo_url ? (
                <Image source={{ uri: settings.logo_url }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
             ) : (
                <Ionicons name="cloud-upload-outline" size={48} color="#cbd5e1" />
             )}
          </View>
          <Pressable style={styles.uploadBtn} onPress={() => pickImage("logo_url")}>
            <Text style={styles.uploadBtnText}>Upload Logo</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { flex: 1, marginLeft: 12 }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="globe-outline" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Favicon</Text>
          </View>
          <Text style={styles.subLabel}>Recommended size: 32x32 px</Text>
          <View style={[styles.imageUploadBox, { width: 100, height: 100, alignSelf: 'center' }]}>
             {settings.favicon_url ? (
                <Image source={{ uri: settings.favicon_url }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
             ) : (
                <Ionicons name="cloud-upload-outline" size={32} color="#cbd5e1" />
             )}
          </View>
          <Pressable style={[styles.uploadBtn, { alignSelf: 'center', marginTop: 10 }]} onPress={() => pickImage("favicon_url")}>
            <Text style={styles.uploadBtnText}>Upload Favicon</Text>
          </Pressable>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
  },
  row: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  subLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 16,
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
  imageUploadBox: {
    height: 160,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  uploadBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  uploadBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  }
});
