import { Platform } from "react-native";
import { inferCategoryLabel } from "../utils/shopCurations";

const WEB_DEFAULT = "http://localhost:5000/api";
const ANDROID_DEFAULT = "http://10.0.2.2:5000/api";
const IOS_DEFAULT = "http://localhost:5000/api";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === "web" ? WEB_DEFAULT : Platform.OS === "android" ? ANDROID_DEFAULT : IOS_DEFAULT);

function normalizeError(payload, fallback = "Request failed.") {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  return payload.message || payload.error || fallback;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(normalizeError(payload, `HTTP ${res.status}`));
  }
  return payload;
}

export function mapBackendProduct(row) {
  const price = Number(row.discount_price || row.price || 0);
  const category = inferCategoryLabel({
    category: row.category_name,
    name: row.name,
  });
  const reviews = Number(row.review_count || row.reviews_count || 0);
  const rating = Number(row.rating_average || (reviews ? 4.6 : 4.2));
  return {
    id: Number(row.id),
    name: row.name || "Product",
    category,
    price,
    priceLabel: `₹${price.toFixed(2)}`,
    image:
      row.image ||
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&q=80",
    sale: Number(row.discount_price || 0) > 0 && Number(row.discount_price) < Number(row.price || 0),
    rating,
    reviews,
    description: row.description || row.short_description || "",
    stock: Number(row.quantity || 0),
    slug: row.slug || "",
    brand: row.brand || "Vogstya",
    metal: row.metal || "Premium Alloy",
    size: row.size || "",
  };
}
