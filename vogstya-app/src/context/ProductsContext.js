import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, mapBackendProduct } from "../api/client";

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reloadProducts() {
    setLoading(true);
    setError("");
    try {
      const [rows, cats] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/categories").catch(() => []) // fallback
      ]);
      setProducts(Array.isArray(rows) ? rows.map(mapBackendProduct) : []);
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (e) {
      setError(e.message || "Failed to load products.");
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reloadProducts();
  }, []);

  const value = useMemo(
    () => ({
      products,
      categories,
      loading,
      error,
      reloadProducts,
      getProductById: (id) => products.find((p) => Number(p.id) === Number(id)),
    }),
    [products, categories, loading, error]
  );

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error("useProducts must be used inside ProductsProvider");
  return ctx;
}

