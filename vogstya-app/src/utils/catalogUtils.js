export function filterProducts(list, { categories, priceMin, priceMax, saleOnly }) {
  return list.filter((p) => {
    if (saleOnly && !p.sale) return false;
    if (categories.length > 0 && !categories.includes(p.category)) return false;
    if (p.price < priceMin || p.price > priceMax) return false;
    return true;
  });
}

export function sortProducts(list, sortBy) {
  const next = [...list];
  switch (sortBy) {
    case "featured":
      return next.sort((a, b) => a.id - b.id);
    case "priceAsc":
      return next.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return next.sort((a, b) => b.price - a.price);
    case "name":
      return next.sort((a, b) => a.name.localeCompare(b.name));
    case "rating":
      return next.sort((a, b) => b.rating - a.rating);
    default:
      return next;
  }
}
