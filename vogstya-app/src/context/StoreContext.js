import { createContext, useContext, useMemo, useState } from "react";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [cartItems, setCartItems] = useState([]); // { id, qty }
  const [wishlistIds, setWishlistIds] = useState([]); // number[]

  const cartCount = useMemo(
    () => cartItems.reduce((sum, it) => sum + (it.qty || 0), 0),
    [cartItems]
  );
  const wishlistCount = wishlistIds.length;

  const value = useMemo(() => {
    function addToCart(id, qty = 1) {
      setCartItems((prev) => {
        const found = prev.find((p) => p.id === id);
        if (!found) return [...prev, { id, qty }];
        return prev.map((p) => (p.id === id ? { ...p, qty: p.qty + qty } : p));
      });
    }

    function removeFromCart(id) {
      setCartItems((prev) => prev.filter((p) => p.id !== id));
    }

    function clearCart() {
      setCartItems([]);
    }

    function setCartQty(id, qty) {
      setCartItems((prev) =>
        prev
          .map((p) => (p.id === id ? { ...p, qty } : p))
          .filter((p) => p.qty > 0)
      );
    }

    function toggleWishlist(id) {
      setWishlistIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }

    function isWishlisted(id) {
      return wishlistIds.includes(id);
    }

    return {
      cartItems,
      wishlistIds,
      cartCount,
      wishlistCount,
      addToCart,
      removeFromCart,
      clearCart,
      setCartQty,
      toggleWishlist,
      isWishlisted,
    };
  }, [cartItems, wishlistIds, cartCount, wishlistCount]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

