import { useState, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useProducts } from "../context/ProductsContext";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";
import { apiRequest } from "../api/client";

export default function WriteReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { productId } = route.params || {};
  const { products } = useProducts();
  const { token } = useAuth();
  
  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!token) {
      Alert.alert("Error", "Please log in to submit a review.");
      return;
    }

    if (!comment || !title) {
      Alert.alert("Required", "Please provide a title and a comment for your review.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest("/products/reviews", {
        method: "POST",
        token,
        body: { productId, rating, title, comment }
      });

      if (response.message) {
        Alert.alert("Success", "Your review has been submitted!");
        navigation.goBack();
      } else {
        throw new Error("Failed to submit review.");
      }
    } catch (error) {
      console.error("Submit Review Error:", error);
      Alert.alert("Error", "Could not submit review. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!product) {
    return (
      <View style={styles.root}>
        <Header />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Product not found.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Header />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Review</Text>

        <View style={styles.productBrief}>
          <Image source={{ uri: product.image }} style={styles.productImg} contentFit="cover" />
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall rating</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Ionicons 
                  name={star <= rating ? "star" : "star-outline"} 
                  size={36} 
                  color={star <= rating ? "#ffa41c" : "#ccc"} 
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a headline</Text>
          <TextInput
            style={styles.input}
            placeholder="What's most important to know?"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a written review</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What did you like or dislike? What did you use this product for?"
            multiline
            numberOfLines={6}
            value={comment}
            onChangeText={setComment}
            placeholderTextColor="#888"
            textAlignVertical="top"
          />
        </View>

        <Pressable 
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#0f1111" />
          ) : (
            <Text style={styles.submitBtnText}>Submit</Text>
          )}
        </Pressable>

        <Footer />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },
  body: { padding: 20 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#111", marginBottom: 20 },
  productBrief: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, gap: 15 },
  productImg: { width: 60, height: 60, borderRadius: 4 },
  productName: { fontSize: 16, color: "#111", flex: 1 },
  section: { marginBottom: 30, borderTopWidth: 1, borderTopColor: '#f3f3f3', paddingTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111", marginBottom: 15 },
  starsRow: { flexDirection: 'row', gap: 10 },
  starBtn: { padding: 4 },
  input: {
    borderWidth: 1,
    borderColor: "#d5d9d9",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#111",
    backgroundColor: "#fff",
  },
  textArea: { minHeight: 120 },
  submitBtn: {
    backgroundColor: "#FFD814",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FCD200",
    marginBottom: 40,
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: 15, fontWeight: "500", color: "#0F1111" },
  errorText: { fontSize: 16, color: colors.danger },
});
