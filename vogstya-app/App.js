import React from "react";
import { SafeAreaView, StatusBar, Platform } from "react-native";
import * as Linking from "expo-linking";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";
import { StoreProvider } from "./src/context/StoreContext";
import { AuthProvider } from "./src/context/AuthContext";
import { OrdersProvider } from "./src/context/OrdersContext";
import { SnackbarProvider } from "./src/context/SnackbarContext";
import { ProductsProvider } from "./src/context/ProductsContext";

const linking = {
  prefixes: [
    Linking.createURL("/"),
    "vogstyaapp://",
    "https://vagstyaapp.vercel.app",
    "https://vogstyaapp.vercel.app",
  ],
  config: {
    screens: {
      Home: "",
      Shop: "shop",
      Collection: "collection",
      BestDeals: "best-deals",
      Search: "search",
      Wishlist: "wishlist",
      Cart: "cart",
      Account: "account",
      Login: "login",
      Register: "register",
      AdminLogin: "admin/login",
      AdminRegister: "admin/register",
      ForgotPassword: "forgot-password",
      ResetPassword: "reset-password",
      ProductDetails: "product/:slug",
      Checkout: "checkout",
      Orders: "orders",
      TrackOrder: "track-order",
      OrderSuccess: "order-success",
      AdminPanel: "admin-panel",
    },
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <OrdersProvider>
            <ProductsProvider>
              <StoreProvider>
                <SnackbarProvider>
                  <NavigationContainer linking={linking}>
                    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f0e8" }}>
                      <StatusBar barStyle="dark-content" />
                      <AppNavigator />
                    </SafeAreaView>
                  </NavigationContainer>
                </SnackbarProvider>
              </StoreProvider>
            </ProductsProvider>
          </OrdersProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
