import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

const SectionTitle = ({ title, icon, colors }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 12 }}>
    <Ionicons name={icon} size={18} color={colors.accent} />
    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.ink, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</Text>
  </View>
);

function SearchablePicker({ options, value, onSelect, placeholder = "Select...", searchPlaceholder = "Search...", colors, modalStyles }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const activeOptions = (options || []).map(opt => typeof opt === 'string' ? { id: opt, name: opt } : opt);
  const selectedOpt = activeOptions.find(o => String(o.id) === String(value));

  const filtered = activeOptions.filter(o => 
    String(o.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ zIndex: 1000, position: 'relative' }}>
      <Pressable 
        style={modalStyles.input}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
          {selectedOpt ? (
            <Text style={{ color: '#0f172a', fontSize: 14, fontWeight: '600' }}>{selectedOpt.name}</Text>
          ) : (
            <Text style={{ color: '#94a3b8', fontSize: 14 }}>{placeholder}</Text>
          )}
          <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
        </View>
      </Pressable>

      {isOpen && (
        <View style={{
          position: 'absolute',
          top: 54,
          left: 0,
          minWidth: 200,
          width: '100%',
          backgroundColor: 'white',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          zIndex: 6000,
          ...(Platform.OS === 'web' ? { boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' } : { elevation: 8 }),
          padding: 8,
          maxHeight: 300,
          overflow: 'hidden'
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: '#f1f5f9', 
            borderRadius: 8, 
            paddingHorizontal: 12, 
            marginBottom: 8,
            height: 40
          }}>
            <Ionicons name="search-outline" size={18} color="#64748b" />
            <TextInput 
              style={{ flex: 1, paddingLeft: 8, fontSize: 14, color: '#1e293b' }}
              placeholder={searchPlaceholder}
              placeholderTextColor="#94a3b8"
              value={search}
              onChangeText={setSearch}
              autoFocus
            />
          </View>
          <ScrollView showsVerticalScrollIndicator={true} style={{ flex: 1 }} nestedScrollEnabled={true}>
            {filtered.map(opt => (
              <Pressable 
                key={opt.id}
                onPress={() => {
                  onSelect(opt.id);
                  setIsOpen(false);
                }}
                style={({ hovered }) => [
                  {
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 6,
                    backgroundColor: String(opt.id) === String(value) ? '#0d5731' : (hovered ? '#f1f5f9' : 'transparent'),
                    marginBottom: 2
                  }
                ]}
              >
                <Text style={{ 
                  fontSize: 14, 
                  color: String(opt.id) === String(value) ? 'white' : '#1e293b',
                  fontWeight: String(opt.id) === String(value) ? '700' : '500'
                }}>
                  {opt.name}
                </Text>
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <Text style={{ padding: 20, textAlign: 'center', color: '#64748b' }}>No matches found</Text>
            )}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function ManageShopsModal({ visible, item, onClose, onSave, colors, modalStyles, styles, metadataCatalog }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [formData, setFormData] = useState({});
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (visible && item) {
      setFormData({ ...item });
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
      Alert.alert("Notice", "Local file picking is optimized for Web. For other platforms, please use a URL.");
    }
  };

  return (
    <View style={modalStyles.overlay}>
      <View style={[modalStyles.container, { width: isMobile ? '95%' : 900, maxHeight: '90%' }]}>
        <View style={modalStyles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="storefront-outline" size={20} color={colors.accent} />
            <Text style={modalStyles.title}>{formData.id ? "Edit Shop" : "New Shop"}</Text>
          </View>
          <Pressable onPress={onClose}><Ionicons name="close" size={24} color={colors.muted} /></Pressable>
        </View>

        <ScrollView 
          style={modalStyles.body} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 250 }}
          nestedScrollEnabled={true}
        >
          <View style={{ padding: 20 }}>
            <SectionTitle title="User Information" icon="person-outline" colors={colors} />
            <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 20, zIndex: 100 }}>
              <View style={{ flex: 1, gap: 16 }}>
                <View style={{ flexDirection: 'row', gap: 16 }}>
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
                <View>
                  <Text style={modalStyles.label}>Phone Number <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.phone}
                    onChangeText={(v) => updateField("phone", v)}
                    placeholder="Phone Number"
                  />
                </View>
                <View style={{ zIndex: 100 }}>
                  <Text style={modalStyles.label}>Gender</Text>
                  <SearchablePicker 
                    options={metadataCatalog.genders}
                    value={formData.gender}
                    onSelect={(v) => updateField("gender", v)}
                    placeholder="Select Gender"
                    colors={colors}
                    modalStyles={modalStyles}
                  />
                </View>
                <View>
                  <Text style={modalStyles.label}>Email <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.email}
                    onChangeText={(v) => updateField("email", v)}
                    placeholder="Email"
                  />
                </View>
              </View>
              
              <View style={{ width: isMobile ? '100%' : 280, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 180, height: 180, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' }}>
                  {formData.user_profile_url ? (
                    <Image source={{ uri: formData.user_profile_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : null}
                </View>
                <View style={{ width: '100%' }}>
                  <Text style={[modalStyles.label, { textAlign: 'left' }]}>User profile (Ratio 1:1)</Text>
                  <Pressable style={styles.filePicker} onPress={() => handlePickImage("user_profile_url")}>
                    <Text style={styles.filePickerBtn}>Choose File</Text>
                    <Text style={styles.filePickerText} numberOfLines={1}>
                      {formData.user_profile_url?.startsWith("data:") ? "Local file selected" : (formData.user_profile_url ? "File selected" : "No file chosen")}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            <SectionTitle title="Shop Information" icon="cart-outline" colors={colors} />
            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16, zIndex: 90 }}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Shop Name <Text style={{ color: '#ef4444' }}>*</Text></Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.name}
                    onChangeText={(v) => updateField("name", v)}
                    placeholder="Shop Name"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>State</Text>
                  <SearchablePicker 
                    options={metadataCatalog.states}
                    value={formData.state}
                    onSelect={(v) => updateField("state", v)}
                    placeholder="Select State"
                    colors={colors}
                    modalStyles={modalStyles}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>Address</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.address}
                    onChangeText={(v) => updateField("address", v)}
                    placeholder="Address"
                  />
                </View>
              </View>

              <View style={{ flexDirection: isMobile ? 'column' : 'row', gap: 16 }}>
                <View style={{ flex: 1 }}>
                  <Text style={modalStyles.label}>GST</Text>
                  <TextInput
                    style={modalStyles.input}
                    value={formData.gst_id}
                    onChangeText={(v) => updateField("gst_id", v)}
                    placeholder="Enter gst id"
                  />
                </View>
                <View style={{ flex: 1, zIndex: 80 }}>
                  <Text style={modalStyles.label}>Status</Text>
                  <SearchablePicker 
                    options={[
                      { id: 1, name: 'Active' },
                      { id: 0, name: 'Inactive' }
                    ]}
                    value={formData.is_active !== undefined ? formData.is_active : 1}
                    onSelect={(v) => updateField("is_active", v)}
                    placeholder="Select Status"
                    colors={colors}
                    modalStyles={modalStyles}
                  />
                </View>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <View style={{ width: 180, height: 180, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' }}>
                    {formData.logo_url ? (
                      <Image source={{ uri: formData.logo_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                    ) : null}
                  </View>
                  <View style={{ width: '100%', maxWidth: 400 }}>
                    <Text style={[modalStyles.label, { textAlign: 'left' }]}>Shop logo (Ratio 1:1)</Text>
                    <Pressable style={styles.filePicker} onPress={() => handlePickImage("logo_url")}>
                      <Text style={styles.filePickerBtn}>Choose File</Text>
                      <Text style={styles.filePickerText} numberOfLines={1}>
                        {formData.logo_url?.startsWith("data:") ? "Local file selected" : (formData.logo_url ? "File selected" : "No file chosen")}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              <View style={{ alignItems: 'center', marginTop: 16 }}>
                <View style={{ width: '100%', height: 160, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' }}>
                  {formData.banner_url ? (
                    <Image source={{ uri: formData.banner_url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : null}
                </View>
                <View style={{ width: '100%' }}>
                  <Text style={[modalStyles.label, { textAlign: 'left' }]}>Shop banner Ratio 4:1 (2000 x 500 px)</Text>
                  <Pressable style={styles.filePicker} onPress={() => handlePickImage("banner_url")}>
                    <Text style={styles.filePickerBtn}>Choose File</Text>
                    <Text style={styles.filePickerText} numberOfLines={1}>
                      {formData.banner_url?.startsWith("data:") ? "Local file selected" : (formData.banner_url ? "File selected" : "No file chosen")}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View style={{ width: '100%', marginTop: 8 }}>
                <Text style={modalStyles.label}>Description</Text>
                <TextInput
                  style={[modalStyles.input, { height: 80, textAlignVertical: 'top' }]}
                  value={formData.description}
                  onChangeText={(v) => updateField("description", v)}
                  placeholder="Enter Description"
                  multiline
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[modalStyles.footer, { justifyContent: 'flex-end', borderTopWidth: 0, paddingBottom: 24, paddingRight: 24 }]}>
          {saveError && (
            <Text style={{ color: '#ef4444', marginRight: 16, flex: 1, fontWeight: '500' }} numberOfLines={2}>
              {saveError}
            </Text>
          )}
          <Pressable 
            style={[modalStyles.cancelBtn, { backgroundColor: '#64748b', borderRadius: 8, marginRight: 'auto' }]} 
            onPress={onClose}
          >
            <Text style={{ color: 'white', fontWeight: '700' }}>Cancel</Text>
          </Pressable>
          <Pressable 
            style={[modalStyles.saveBtn, { backgroundColor: '#0d5731', paddingHorizontal: 30 }]} 
            onPress={() => onSave(formData, setSaveError)}
          >
            <Text style={modalStyles.saveBtnText}>{formData.id ? "Update Shop" : "Create Shop"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
