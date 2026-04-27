import { Platform } from "react-native";
import Constants from "expo-constants";
import { inferCategoryLabel } from "../utils/shopCurations";

function isPrivateHost(host) {
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
  );
}

function resolveWebApiBaseUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const protocol = window.location.protocol;

    if (isPrivateHost(host)) {
      return `http://${host}:5000/api`;
    }

    if (protocol === "https:" && host !== "vagstyaapp.vercel.app") {
      return "https://vagstya-app.onrender.com/api";
    }
  }

  return "https://vagstya-app.onrender.com/api";
}

const WEB_DEFAULT = resolveWebApiBaseUrl();
const ANDROID_DEFAULT = "http://10.0.2.2:5000/api";
const IOS_DEFAULT = "http://localhost:5000/api";

const DEV_IP = "192.168.1.16"; // Your current computer IP

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  (Platform.OS === "web" 
    ? WEB_DEFAULT 
    : Platform.OS === "android" 
      ? (Constants?.expoConfig?.hostUri ? `http://${Constants.expoConfig.hostUri.split(':')[0]}:5000/api` : ANDROID_DEFAULT)
      : `http://${DEV_IP}:5000/api`);

console.log(`[AUTH] API Base set to: ${API_BASE_URL}`);

function normalizeError(payload, fallback = "Request failed.") {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (payload.message && payload.detail) return `${payload.message} ${payload.detail}`;
  if (payload.message && payload.error && payload.message !== payload.error) {
    return `${payload.message} ${payload.error}`;
  }
  return payload.message || payload.error || fallback;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fullUrl = `${API_BASE_URL}${path}`;
  console.log(`[API] Fetching: ${fullUrl}`);

  let res;
  try {
    res = await fetch(fullUrl, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    throw new Error(`Network error while calling ${fullUrl}. Make sure the backend is running and reachable.`);
  }

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
  const isFlashSale = Boolean(row.is_flash_sale);
  const flashSalePrice = row.flash_sale_price ? Number(row.flash_sale_price) : null;
  const originalPrice = Number(row.price || 0);
  const discountPrice = Number(row.discount_price || 0);

  const price = isFlashSale && flashSalePrice !== null ? flashSalePrice : (discountPrice || originalPrice);
  const oldPrice = isFlashSale && flashSalePrice !== null ? (discountPrice || originalPrice) : (discountPrice ? originalPrice : null);
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
    sale: Boolean(oldPrice && oldPrice > price),
    oldPriceLabel: oldPrice ? `₹${oldPrice.toFixed(2)}` : null,
    rating,
    reviews,
    description: row.description || row.short_description || "",
    stock: Number(row.quantity || 0),
    slug: row.slug || "",
    brand: row.brand || "Vogstya",
    metal: row.metal || "Premium Alloy",
    size: row.size || "",
    isFeatured: Boolean(row.is_featured),
    isAuspicious: Boolean(row.is_auspicious),
    isBannerMain: Boolean(row.is_banner_main),
    isBannerEarrings: Boolean(row.is_banner_earrings),
    isBannerNecklaces: Boolean(row.is_banner_necklaces),
    isPopularJewellery: Boolean(row.is_popular_jewellery),
    isMensShirts: Boolean(row.is_mens_shirts),
    isWomensHighlights: Boolean(row.is_womens_highlights),
    isPremiumSarees: Boolean(row.is_premium_sarees),
    isFlashSale: Boolean(row.is_flash_sale),
    flashSalePrice: row.flash_sale_price ? Number(row.flash_sale_price) : null,
    flashSaleDiscount: row.flash_sale_discount ? Number(row.flash_sale_discount) : null,
    flashSaleTotalQty: row.flash_sale_total_qty ? Number(row.flash_sale_total_qty) : 0,
    flashSaleSoldQty: row.flash_sale_sold_qty ? Number(row.flash_sale_sold_qty) : 0,
  };
}
