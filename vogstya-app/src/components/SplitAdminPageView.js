import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Platform, Alert, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

export default function SplitAdminPageView({ 
  colors, 
  token, 
  apiRequest, 
  tableName, 
  title, 
  subtitle,
  customColumns = null,
  customFormFields = null 
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiRequest(`/admin/data/tables/${tableName}`, { token });
      if (res && res.rows) {
        setData(res.rows);
        setColumns(res.columns || []);
      }
    } catch (err) {
      console.error(`Failed to fetch ${tableName}:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = editingId 
        ? `/admin/data/tables/${tableName}/${editingId}` 
        : `/admin/data/tables/${tableName}`;
      const method = editingId ? "PUT" : "POST";
      
      const payload = { ...formData };
      delete payload.id;
      delete payload.created_at;
      delete payload.updated_at;

      await apiRequest(endpoint, {
        method,
        token,
        body: payload
      });

      if (Platform.OS === 'web') alert(`Successfully ${editingId ? 'updated' : 'added'}!`);
      else Alert.alert("Success", `Successfully ${editingId ? 'updated' : 'added'}!`);

      setFormData({});
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error(`Error saving ${tableName}:`, err);
      if (Platform.OS === 'web') alert("Failed to save.");
      else Alert.alert("Error", "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (Platform.OS === 'web') {
      if (!window.confirm("Are you sure you want to delete this record?")) return;
    } else {
      Alert.alert("Confirm", "Are you sure?", [
        { text: "Cancel" },
        { text: "Delete", onPress: () => performDelete(id) }
      ]);
      return;
    }
    performDelete(id);
  };

  const performDelete = async (id) => {
    try {
      await apiRequest(`/admin/data/tables/${tableName}/${id}`, {
        method: "DELETE",
        token
      });
      fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const updateField = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleStatus = async (item, fieldName = "status") => {
    try {
      const nextValue = Number(item[fieldName]) === 1 ? 0 : 1;
      await apiRequest(`/admin/data/tables/${tableName}/${item.id}`, {
        method: "PUT",
        token,
        body: { [fieldName]: nextValue }
      });
      setData(prev => prev.map(r => r.id === item.id ? { ...r, [fieldName]: nextValue } : r));
    } catch (err) {
      console.error("Toggle error:", err);
    }
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
          reader.onload = (event) => updateField(key, event.target.result);
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };

  const filteredData = data.filter(item => {
    if (!searchQuery) return true;
    return Object.values(item).some(val => String(val).toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const paginatedData = filteredData.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const displayColumns = customColumns || columns.filter(c => !["id", "created_at", "updated_at"].includes(c.name));
  const formFields = customFormFields || columns.filter(c => !["id", "created_at", "updated_at"].includes(c.name));

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24 }}>
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: colors.ink }}>{title || tableName.toUpperCase()}</Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{subtitle || `Manage your ${tableName} details here.`}</Text>
      </View>

      <View style={[styles.layout, { flexDirection: isDesktop ? 'row' : 'column' }]}>
        {/* LEFT COLUMN: FORM */}
        <View style={styles.formColumn}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{editingId ? `Update ${title || tableName}` : `Add New ${title || tableName}`}</Text>
            </View>
            <View style={styles.cardBody}>
              {formFields.map(col => {
                const label = col.label || col.name.replace(/_/g, ' ').toUpperCase();
                const type = col.type || (col.dataType?.includes('tinyint') || col.name === 'status' ? 'boolean' : col.dataType === 'text' ? 'textarea' : col.name.includes('image') || col.name.includes('icon') || col.name.includes('logo') ? 'image' : 'text');
                
                return (
                  <View key={col.name} style={styles.inputGroup}>
                    <Text style={styles.label}>{label}</Text>
                    {type === 'boolean' ? (
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                         <Pressable style={[styles.pill, formData[col.name] == 1 && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => updateField(col.name, 1)}>
                           <Text style={[styles.pillText, formData[col.name] == 1 && { color: 'white' }]}>Active</Text>
                         </Pressable>
                         <Pressable style={[styles.pill, (formData[col.name] == 0 || !formData[col.name]) && { backgroundColor: colors.accent, borderColor: colors.accent }]} onPress={() => updateField(col.name, 0)}>
                           <Text style={[styles.pillText, (formData[col.name] == 0 || !formData[col.name]) && { color: 'white' }]}>Inactive</Text>
                         </Pressable>
                      </View>
                    ) : type === 'image' ? (
                      <View>
                        <TextInput style={[styles.input, { marginBottom: 8 }]} value={formData[col.name] || ""} onChangeText={v => updateField(col.name, v)} placeholder="https://..." />
                        <Pressable style={styles.uploadBtn} onPress={() => pickImage(col.name)}>
                          <Text style={styles.uploadBtnText}>Upload Image</Text>
                        </Pressable>
                        {formData[col.name] && (
                          <Image source={{ uri: formData[col.name] }} style={{ width: 80, height: 80, marginTop: 10, borderRadius: 8 }} contentFit="contain" />
                        )}
                      </View>
                    ) : type === 'textarea' ? (
                      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} multiline value={String(formData[col.name] || "")} onChangeText={v => updateField(col.name, v)} placeholder={`Enter ${label}...`} />
                    ) : (
                      <TextInput style={styles.input} value={String(formData[col.name] || "")} onChangeText={v => updateField(col.name, v)} placeholder={`Enter ${label}...`} />
                    )}
                  </View>
                );
              })}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Pressable style={[styles.saveBtn, { flex: 1, backgroundColor: colors.accent }]} onPress={handleSave}>
                  {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>{editingId ? "Update" : "Save"}</Text>}
                </Pressable>
                {editingId && (
                  <Pressable style={[styles.saveBtn, { backgroundColor: '#f1f5f9' }]} onPress={() => { setEditingId(null); setFormData({}); }}>
                    <Text style={[styles.saveBtnText, { color: '#64748b' }]}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* RIGHT COLUMN: TABLE */}
        <View style={styles.tableColumn}>
          <View style={styles.card}>
            <View style={[styles.cardHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <Text style={styles.cardTitle}>{title || tableName} List <Text style={{ color: colors.accent, fontSize: 14 }}>({filteredData.length})</Text></Text>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={16} color="#94a3b8" />
                <TextInput style={styles.searchInput} value={searchQuery} onChangeText={v => { setSearchQuery(v); setCurrentPage(1); }} placeholder="Search..." />
              </View>
            </View>

            <View style={styles.cardBody}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={{ minWidth: '100%' }}>
                  <View style={styles.tableHeaderRow}>
                    <View style={[styles.cell, { width: 60 }]}><Text style={styles.columnName}>SL</Text></View>
                    {displayColumns.map(col => (
                      <View key={col.name} style={[styles.cell, { width: col.width || 150 }]}>
                        <Text style={styles.columnName}>{col.label || col.name.replace(/_/g, ' ').toUpperCase()}</Text>
                      </View>
                    ))}
                    <View style={[styles.cell, { width: 120, alignItems: 'center' }]}><Text style={styles.columnName}>Action</Text></View>
                  </View>

                  {paginatedData.length === 0 ? (
                    <View style={{ padding: 40, alignItems: 'center' }}>
                       <Text style={{ color: '#94a3b8' }}>No records found</Text>
                    </View>
                  ) : (
                    paginatedData.map((row, index) => (
                      <View key={row.id} style={[styles.tableRow, index % 2 === 1 && { backgroundColor: '#f8fafc' }]}>
                        <View style={[styles.cell, { width: 60 }]}><Text style={styles.cellText}>{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</Text></View>
                        {displayColumns.map(col => {
                          const isBool = col.dataType?.includes('tinyint') || col.name === 'status';
                          const isImg = col.name.includes('image') || col.name.includes('icon') || col.name.includes('logo');
                          return (
                            <View key={col.name} style={[styles.cell, { width: col.width || 150 }]}>
                              {isBool ? (
                                <Pressable onPress={() => handleToggleStatus(row, col.name)}>
                                  <View style={[styles.toggle, row[col.name] == 1 && styles.toggleActive]}>
                                    <View style={[styles.toggleThumb, row[col.name] == 1 && styles.toggleThumbActive]} />
                                  </View>
                                </Pressable>
                              ) : isImg ? (
                                row[col.name] ? <Image source={{ uri: row[col.name] }} style={{ width: 40, height: 40, borderRadius: 6 }} contentFit="cover" /> : <Text style={styles.cellText}>—</Text>
                              ) : (
                                <Text style={styles.cellText} numberOfLines={2}>{row[col.name]}</Text>
                              )}
                            </View>
                          );
                        })}
                        <View style={[styles.cell, { width: 120, flexDirection: 'row', gap: 10, justifyContent: 'center' }]}>
                          <Pressable style={styles.actionBtn} onPress={() => handleEdit(row)}>
                            <Ionicons name="create-outline" size={16} color={colors.accent} />
                          </Pressable>
                          <Pressable style={[styles.actionBtn, { backgroundColor: '#fee2e2', borderColor: '#fecaca' }]} onPress={() => handleDelete(row.id)}>
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <View style={styles.pagination}>
                  <Pressable onPress={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={styles.pageBtn}>
                    <Text style={{ color: currentPage === 1 ? '#cbd5e1' : '#64748b' }}>Prev</Text>
                  </Pressable>
                  <Text style={{ fontSize: 13, color: '#64748b' }}>Page {currentPage} of {totalPages}</Text>
                  <Pressable onPress={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={styles.pageBtn}>
                    <Text style={{ color: currentPage === totalPages ? '#cbd5e1' : '#64748b' }}>Next</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f1f5f9" },
  layout: { gap: 24 },
  formColumn: { flex: 1, minWidth: 300 },
  tableColumn: { flex: 2, minWidth: 500 },
  card: { backgroundColor: 'white', borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  cardBody: { padding: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, fontSize: 14, color: '#1e293b', backgroundColor: '#fff', outlineStyle: 'none' },
  pill: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  uploadBtn: { backgroundColor: '#f1f5f9', padding: 10, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  uploadBtnText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  saveBtn: { padding: 14, alignItems: 'center', borderRadius: 8 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0', width: 200, height: 36 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 13, outlineStyle: 'none' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingVertical: 12 },
  columnName: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingVertical: 12, alignItems: 'center' },
  cell: { paddingHorizontal: 10, justifyContent: 'center' },
  cellText: { fontSize: 13, color: '#334155' },
  actionBtn: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  toggle: { width: 40, height: 20, borderRadius: 10, backgroundColor: '#e2e8f0', justifyContent: 'center', padding: 2 },
  toggleActive: { backgroundColor: '#10b981', alignItems: 'flex-end' },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: 'white' },
  toggleThumbActive: { backgroundColor: 'white' },
  pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' }
});
