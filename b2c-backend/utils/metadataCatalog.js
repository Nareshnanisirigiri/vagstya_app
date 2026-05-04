export const APPROVED_SIZE_CATALOG = [
  "0-3 Months", "0-6 Months", "1", "1-2 Years", "10", "10", "10-11 Years", "100 CMS", "105 CMS", "11",
  "11-12 Years", "110 CMS", "12", "12", "12-13 Years", "12-18 Months", "13-14 Years", "14", "2", "2-2",
  "2-4", "2-6", "2-8", "26", "28", "3", "3-4 Years", "30", "32", "32A", "32B", "32C", "32D", "34",
  "34A", "34B", "34C", "34D", "36", "36A", "36B", "36C", "36D", "38", "38A", "38B", "38C", "38D",
  "3XL", "4", "4 XL", "4-5 Years", "40", "40A", "40B", "40C", "40D", "42", "44", "46", "48", "5",
  "5 XL", "5-6 Years", "50", "6", "6 XL", "6-12 months", "7", "7-8 Years", "75 CMS", "8", "8-9 Years",
  "80 CMS", "85 CMS", "9", "9-10 Years", "90 CMS", "95 CMS", "Adjustable", "Free Style", "L", "M",
  "Non-Adjustable", "S", "XL", "XS", "XXL"
];

export const APPROVED_UNIT_CATALOG = [
  "1 Item", "2 Item", "3 Item", "4 Item", "1 pair", "2 pairs", "5 Item", "6 Item",
  "1 Dozen", "10 pcs", "12 pcs", "50 pcs", "100 pcs", "1 packet", "1 card", "1 packet",
  "7 Item", "8 Item", "9 Item", "10 Item", "3 pairs", "1 Sheet", "2 Dozens", "1 Set",
  "3 Dozens", "4 Pairs", "5 Pairs", "6 Pairs", "1 Box", "1 Pcs", "2 pcs"
];

export const APPROVED_CATEGORY_CATALOG = [
  "Sarees", "Jewellery", "Fashion Accessories", "Kids Wear", "Tailoring Needs",
  "Toys & Stationary", "Women's Wear", "Men's Wear", "Home & Living", "Festive Vibes"
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
  "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export const GENDER_OPTIONS = ["Male", "Female", "Other"];

export const ORDER_STATUS_CATALOG = [
  { value: "pending", label: "Pending", icon: "time-outline", color: "#64748b" },
  { value: "confirm", label: "Confirm", icon: "checkmark-circle-outline", color: "#10b981" },
  { value: "processing", label: "Processing", icon: "sync-outline", color: "#3b82f6" },
  { value: "pickup", label: "Pickup", icon: "cube-outline", color: "#f59e0b" },
  { value: "on_the_way", label: "On The Way", icon: "bicycle-outline", color: "#8b5cf6" },
  { value: "delivered", label: "Delivered", icon: "checkmark-done-outline", color: "#10b981" },
  { value: "cancelled", label: "Cancelled", icon: "close-circle-outline", color: "#ef4444" },
  { value: "packed", label: "Packed", icon: "cube", color: "#6366f1" },
  { value: "shipped", label: "Shipped", icon: "send", color: "#8b5cf6" },
  { value: "out_for_delivery", label: "Out for Delivery", icon: "bicycle", color: "#f59e0b" },
  { value: "return_refund", label: "Return / Refund", icon: "refresh", color: "#ef4444" },
];

export const HOME_SECTION_FILTERS = [
  { id: "all", label: "All Products", color: "#0d5731", icon: "grid-outline" },
  { id: "is_featured", label: "Featured Edit", color: "#6366f1", icon: "star-outline" },
  { id: "is_auspicious", label: "Auspicious", color: "#f59e0b", icon: "leaf-outline" },
  { id: "is_popular_jewellery", label: "Popular Jewellery", color: "#06b6d4", icon: "diamond-outline" },
  { id: "is_mens_shirts", label: "Men's Shirts", color: "#10b981", icon: "shirt-outline" },
  { id: "is_womens_highlights", label: "Women's Highlights", color: "#f43f5e", icon: "female-outline" },
  { id: "is_premium_sarees", label: "Premium Sarees", color: "#ec4899", icon: "color-palette-outline" },
  { id: "is_flash_sale", label: "Flash Sale", color: "#ef4444", icon: "flash-outline" },
];
