import { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [cartItems, setCartItems] = useState([]); // { id, qty }
  const [wishlistIds, setWishlistIds] = useState([]); // number[]
  const [isReady, setIsReady] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    // Only load from storage if user is logged in
    if (!user) {
      setCartItems([]);
      setWishlistIds([]);
      setIsReady(true);
      return;
    }

    Promise.all([
      AsyncStorage.getItem(`@vogstya_cart_${user.id || 'guest'}`),
      AsyncStorage.getItem(`@vogstya_wishlist_${user.id || 'guest'}`),
    ]).then(([cartData, wishData]) => {
      try { if (cartData) setCartItems(JSON.parse(cartData)); else setCartItems([]); } catch (e) {}
      try { if (wishData) setWishlistIds(JSON.parse(wishData)); else setWishlistIds([]); } catch (e) {}
      setIsReady(true);
    });
  }, [user]);

  useEffect(() => {
    if (!isReady || !user) return;
    AsyncStorage.setItem(`@vogstya_cart_${user.id || 'guest'}`, JSON.stringify(cartItems));
  }, [cartItems, isReady, user]);

  useEffect(() => {
    if (!isReady || !user) return;
    AsyncStorage.setItem(`@vogstya_wishlist_${user.id || 'guest'}`, JSON.stringify(wishlistIds));
  }, [wishlistIds, isReady, user]);

  const cartCount = useMemo(
    () => user ? cartItems.reduce((sum, it) => sum + (it.qty || 0), 0) : 0,
    [cartItems, user]
  );
  const wishlistCount = user ? wishlistIds.length : 0;

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

