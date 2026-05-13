import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function PushNotificationView({ token, apiRequest }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("All");
  const [users, setUsers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(true);
  const [fetchingHistory, setFetchingHistory] = useState(true);

  useEffect(() => {
    fetchUsers();
    fetchHistory();
  }, []);

  const fetchUsers = async () => {
    try {
      setFetchingUsers(true);
      const res = await apiRequest("/admin/data/tables/users", { token });
      if (res && res.rows) {
        // Only show customers, not admins
        const customers = res.rows.filter(u => u.role !== 'admin');
        setUsers(customers);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setFetchingUsers(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setFetchingHistory(true);
      const res = await apiRequest("/admin/data/tables/notifications", { token });
      if (res && res.rows) {
        setHistory(res.rows);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleSelectUser = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleDeleteHistory = async (id) => {
    try {
      await apiRequest(`/admin/data/tables/notifications/${id}`, { method: "DELETE", token });
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error("Failed to delete history:", error);
      Alert.alert("Error", "Failed to delete notification.");
    }
  };

  const handleSendMessage = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert("Error", "Title and Message are required.");
      return;
    }

    try {
      setLoading(true);
      
      const basePayload = {
        title,
        message,
        content: message,
        is_read: 0
      };

      if (selectedUsers.length > 0) {
        // Send individually to selected users
        let successCount = 0;
        for (const uid of selectedUsers) {
          try {
            await apiRequest("/admin/data/tables/notifications", {
              method: "POST",
              token,
              body: { ...basePayload, user_id: uid }
            });
            successCount++;
          } catch (e) {
            console.error(`Failed to send to user ${uid}:`, e);
          }
        }
        Alert.alert("Success", `Notification sent to ${successCount} users.`);
      } else {
        // Broadcast to all (user_id is null)
        await apiRequest("/admin/data/tables/notifications", {
          method: "POST",
          token,
          body: { ...basePayload, user_id: null }
        });
        Alert.alert("Success", "Broadcast notification sent successfully!");
      }

      setTitle("");
      setMessage("");
      setSelectedUsers([]);
      fetchHistory(); // Refresh history
    } catch (error) {
      console.error("Failed to send notification:", error);
      Alert.alert("Error", "Failed to send notification. Please check server logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="notifications-outline" size={24} color="#0d5731" />
          <Text style={styles.headerTitle}>Push Notification</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="Notification Title"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Message <Text style={{ color: 'red' }}>*</Text></Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notification Message..."
              multiline
              numberOfLines={4}
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Pressable 
              style={[styles.sendButton, loading && { opacity: 0.7 }]} 
              onPress={handleSendMessage}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send Message</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>

      <View style={[styles.card, { marginTop: 20 }]}>
        <View style={styles.filterSection}>
          <Text style={[styles.headerTitle, { fontSize: 18 }]}>Select Users</Text>
          <View style={styles.filterDropdown}>
            <Text>Filter by Device Type: {deviceFilter}</Text>
            <Ionicons name="chevron-down" size={16} color="#64748b" />
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Pressable onPress={handleSelectAll} style={styles.checkbox}>
              <Ionicons 
                name={selectedUsers.length === users.length && users.length > 0 ? "checkbox" : "square-outline"} 
                size={20} 
                color="#0d5731" 
              />
            </Pressable>
            <Text style={[styles.columnHeader, { width: 80 }]}>Thumbnail</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>Name</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>Email Address</Text>
            <Text style={[styles.columnHeader, { width: 120 }]}>Phone Number</Text>
          </View>

          {fetchingUsers ? (
            <ActivityIndicator style={{ margin: 20 }} color="#0d5731" />
          ) : users.length === 0 ? (
            <View style={styles.emptyState}>
              <Text>No customers found.</Text>
            </View>
          ) : (
            users.map((user, index) => (
              <View key={user.id} style={[styles.tableRow, index % 2 === 0 && { backgroundColor: '#f8fafc' }]}>
                <Pressable onPress={() => handleSelectUser(user.id)} style={styles.checkbox}>
                  <Ionicons 
                    name={selectedUsers.includes(user.id) ? "checkbox" : "square-outline"} 
                    size={20} 
                    color="#0d5731" 
                  />
                </Pressable>
                <View style={[styles.cell, { width: 80, alignItems: 'center' }]}>
                  <View style={styles.avatar}>
                    {user.image || user.profile_image ? (
                      <Image source={{ uri: user.image || user.profile_image }} style={styles.avatarImg} />
                    ) : (
                      <Ionicons name="person" size={20} color="#cbd5e1" />
                    )}
                  </View>
                </View>
                <Text style={[styles.cellText, { flex: 1 }]}>{user.name || `${user.first_name || ''} ${user.last_name || ''}`}</Text>
                <Text style={[styles.cellText, { flex: 1 }]}>{user.email}</Text>
                <Text style={[styles.cellText, { width: 120 }]}>{user.phone || 'N/A'}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      <View style={[styles.card, { marginTop: 20 }]}>
        <View style={styles.header}>
          <Ionicons name="time-outline" size={20} color="#0d5731" />
          <Text style={[styles.headerTitle, { fontSize: 18 }]}>Sent Notifications History</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { width: 50 }]}>ID</Text>
            <Text style={[styles.columnHeader, { width: 150 }]}>Title</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>Message</Text>
            <Text style={[styles.columnHeader, { width: 120 }]}>Sent To</Text>
            <Text style={[styles.columnHeader, { width: 80 }]}>Actions</Text>
          </View>

          {fetchingHistory ? (
            <ActivityIndicator style={{ margin: 20 }} color="#0d5731" />
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text>No history found.</Text>
            </View>
          ) : (
            history.map((h, index) => (
              <View key={h.id} style={[styles.tableRow, index % 2 === 0 && { backgroundColor: '#f8fafc' }]}>
                <Text style={[styles.cellText, { width: 50 }]}>{h.id}</Text>
                <Text style={[styles.cellText, { width: 150, fontWeight: '700' }]}>{h.title}</Text>
                <Text style={[styles.cellText, { flex: 1 }]} numberOfLines={1}>{h.message || h.content}</Text>
                <Text style={[styles.cellText, { width: 120 }]}>{h.user_id ? `User #${h.user_id}` : "Broadcast"}</Text>
                <View style={[styles.cell, { width: 80, flexDirection: 'row', gap: 10 }]}>
                  <Pressable onPress={() => handleDeleteHistory(h.id)}>
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f1f5f9",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  sendButton: {
    backgroundColor: "#0d5731",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  filterSection: {
    marginBottom: 20,
    gap: 8,
  },
  filterDropdown: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 10,
    width: 280,
  },
  table: {
    borderWidth: 1,
    borderColor: "#f1f5f9",
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    alignItems: "center",
  },
  checkbox: {
    marginRight: 15,
  },
  cellText: {
    fontSize: 13,
    color: "#334155",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  emptyState: {
    padding: 40,
    alignItems: "center",
  },
});
