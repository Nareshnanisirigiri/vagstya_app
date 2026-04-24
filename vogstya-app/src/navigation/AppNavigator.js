import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "../screens/HomeScreen";
import CatalogScreen from "../screens/CatalogScreen";
import SearchScreen from "../screens/SearchScreen";
import WishlistScreen from "../screens/WishlistScreen";
import CartScreen from "../screens/CartScreen";
import AccountScreen from "../screens/AccountScreen";
import AuthLoginScreen from "../screens/AuthLoginScreen";
import AuthRegisterScreen from "../screens/AuthRegisterScreen";
import AuthForgotPasswordScreen from "../screens/AuthForgotPasswordScreen";
import AuthResetPasswordScreen from "../screens/AuthResetPasswordScreen";
import ProductDetailsScreen from "../screens/ProductDetailsScreen";
import CheckoutScreen from "../screens/CheckoutScreen";
import OrdersScreen from "../screens/OrdersScreen";
import UpiQrScreen from "../screens/UpiQrScreen";
import AdminPanelScreen from "../screens/AdminPanelScreen";
import OrderSuccessScreen from "../screens/OrderSuccessScreen";
import TrackOrderScreen from "../screens/TrackOrderScreen";
import WriteReviewScreen from "../screens/WriteReviewScreen";
import SellerFeedbackScreen from "../screens/SellerFeedbackScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Shop" component={CatalogScreen} initialParams={{ mode: "shop" }} />
      <Stack.Screen name="Collection" component={CatalogScreen} initialParams={{ mode: "collection" }} />
      <Stack.Screen name="BestDeals" component={CatalogScreen} initialParams={{ mode: "bestDeals" }} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Wishlist" component={WishlistScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Account" component={AccountScreen} />
      <Stack.Screen name="Login" component={AuthLoginScreen} />
      <Stack.Screen name="Register" component={AuthRegisterScreen} />
      <Stack.Screen name="AdminLogin" component={AuthLoginScreen} initialParams={{ role: "admin" }} />
      <Stack.Screen name="AdminRegister" component={AuthRegisterScreen} initialParams={{ role: "admin" }} />
      <Stack.Screen name="ForgotPassword" component={AuthForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={AuthResetPasswordScreen} />
      <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="OrderSuccess" component={OrderSuccessScreen} />
      <Stack.Screen name="UpiQr" component={UpiQrScreen} />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
      <Stack.Screen name="TrackOrder" component={TrackOrderScreen} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
      <Stack.Screen name="SellerFeedback" component={SellerFeedbackScreen} />
    </Stack.Navigator>
  );
}
