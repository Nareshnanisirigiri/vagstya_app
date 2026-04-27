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
    (async () => {
      try {
        const guestCart = await AsyncStorage.getItem(`@vogstya_cart_guest`);
        const guestWish = await AsyncStorage.getItem(`@vogstya_wishlist_guest`);
        
        let initialCart = [];
        let initialWish = [];
        
        if (guestCart) initialCart = JSON.parse(guestCart);
        if (guestWish) initialWish = JSON.parse(guestWish);

        if (user) {
          const userCartData = await AsyncStorage.getItem(`@vogstya_cart_${user.id}`);
          const userWishData = await AsyncStorage.getItem(`@vogstya_wishlist_${user.id}`);
          
          let userCart = userCartData ? JSON.parse(userCartData) : [];
          let userWish = userWishData ? JSON.parse(userWishData) : [];

          // Merge Guest -> User
          if (initialCart.length) {
            initialCart.forEach(gItem => {
              const found = userCart.find(uItem => uItem.id === gItem.id);
              if (found) {
                found.qty = (found.qty || 0) + (gItem.qty || 0);
              } else {
                userCart.push(gItem);
              }
            });
            await AsyncStorage.removeItem(`@vogstya_cart_guest`);
          }
          
          if (initialWish.length) {
            initialWish.forEach(id => {
              if (!userWish.includes(id)) userWish.push(id);
            });
            await AsyncStorage.removeItem(`@vogstya_wishlist_guest`);
          }

          setCartItems(userCart);
          setWishlistIds(userWish);
        } else {
          setCartItems(initialCart);
          setWishlistIds(initialWish);
        }
      } catch (e) {
        console.error("Storage error:", e);
      } finally {
        setIsReady(true);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!isReady) return;
    const key = user ? `@vogstya_cart_${user.id}` : `@vogstya_cart_guest`;
    AsyncStorage.setItem(key, JSON.stringify(cartItems));
  }, [cartItems, isReady, user]);

  useEffect(() => {
    if (!isReady) return;
    const key = user ? `@vogstya_wishlist_${user.id}` : `@vogstya_wishlist_guest`;
    AsyncStorage.setItem(key, JSON.stringify(wishlistIds));
  }, [wishlistIds, isReady, user]);

  const cartCount = useMemo(
    () => cartItems.reduce((sum, it) => sum + (it.qty || 0), 0),
    [cartItems]
  );
  const wishlistCount = wishlistIds.length;

  const value = useMemo(() => {
    function addToCart(id, qty = 1, size = null) {
      setCartItems((prev) => {
        const found = prev.find((p) => p.id === id && p.size === size);
        if (!found) return [...prev, { id, qty, size }];
        return prev.map((p) => (p.id === id && p.size === size ? { ...p, qty: p.qty + qty } : p));
      });
    }

    function removeFromCart(id, size = null) {
      setCartItems((prev) => prev.filter((p) => !(p.id === id && p.size === size)));
    }

    function clearCart() {
      setCartItems([]);
    }

    function setCartQty(id, qty, size = null) {
      setCartItems((prev) =>
        prev
          .map((p) => (p.id === id && p.size === size ? { ...p, qty } : p))
          .filter((p) => p.qty > 0)
      );
    }

    function updateItemSize(id, oldSize, newSize) {
      setCartItems((prev) => {
        // If the new size already exists, merge them
        const target = prev.find(p => p.id === id && p.size === newSize);
        const source = prev.find(p => p.id === id && p.size === oldSize);
        
        if (!source) return prev;
        
        if (target) {
          return prev
            .filter(p => p !== source)
            .map(p => p === target ? { ...p, qty: p.qty + source.qty } : p);
        }
        
        return prev.map(p => (p.id === id && p.size === oldSize ? { ...p, size: newSize } : p));
      });
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
      updateItemSize,
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

