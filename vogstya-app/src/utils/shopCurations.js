export const HOME_COLLECTIONS = [
  {
    key: "jewellery",
    title: "Most Popular Jewellery",
    aliases: ["jewellery", "jewelry", "necklace", "ring", "earring", "bracelet", "pendant"],
    limit: 10,
  },
  {
    key: "mens-shirts",
    title: "Men's Shirts",
    aliases: ["men", "mens", "shirt", "kurta"],
    limit: 10,
  },
  {
    key: "women",
    title: "Women's Highlights",
    aliases: ["women", "ladies", "dress", "kurti", "lehenga", "blouse"],
    limit: 10,
  },
  {
    key: "sarees",
    title: "Premium Sarees",
    aliases: ["saree", "sarees", "kalamkari", "silk saree", "cotton saree"],
    limit: 10,
  },
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export function inferCategoryLabel(product) {
  const rawCategory = normalizeText(product?.category);
  const rawName = normalizeText(product?.name);
  const haystack = `${rawCategory} ${rawName}`;

  if (haystack.includes("saree") || haystack.includes("kalamkari")) return "Sarees";
  if (
    haystack.includes("jewel") ||
    haystack.includes("ring") ||
    haystack.includes("necklace") ||
    haystack.includes("bracelet") ||
    haystack.includes("earring") ||
    haystack.includes("pendant")
  ) {
    return "Jewellery";
  }
  if (
    haystack.includes("women") ||
    haystack.includes("dress") ||
    haystack.includes("kurti") ||
    haystack.includes("blouse") ||
    haystack.includes("lehenga") ||
    haystack.includes("dupatta")
  ) {
    return "Women";
  }
  if (/\bmen\b/.test(haystack) || haystack.includes("shirt") || haystack.includes("kurta")) return "Men";
  return product?.category || "Collections";
}

export function scoreProduct(product) {
  const rating = Number(product?.rating || 0);
  const reviews = Number(product?.reviews || 0);
  const featuredBoost = product?.sale ? 40 : 0;
  return rating * 100 + reviews + featuredBoost;
}

export function pickTopProducts(products, aliases, limit = 10) {
  const aliasList = aliases.map(normalizeText);
  const exact = products.filter((product) => {
    const haystack = `${normalizeText(product?.category)} ${normalizeText(product?.name)}`;
    return aliasList.some((alias) => haystack.includes(alias));
  });

  const ranked = [...exact].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  if (ranked.length >= limit) {
    return ranked.slice(0, limit);
  }

  const takenIds = new Set(ranked.map((product) => product.id));
  const fallback = [...products]
    .filter((product) => !takenIds.has(product.id))
    .sort((a, b) => scoreProduct(b) - scoreProduct(a))
    .slice(0, Math.max(0, limit - ranked.length));

  return [...ranked, ...fallback];
}
