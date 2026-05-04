import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  clearSharedPOS,
  getSharedCart,
  getSharedCustomer,
} from "../utils/posState";

const BRAND_GREEN = "#00441B";
const BRAND_BLUE = "#0D6EFD";
const BORDER = "#dee2e6";
const PANEL = "#ffffff";
const BG = "#f6f7f9";
const TEXT = "#334257";
const MUTED = "#6c757d";
const PREFERRED_BRANDS = ["VOGSTYA", "generic", "jockey"];
const PREFERRED_CATEGORIES = [
  "Fashion Accessories",
  "Jewellery",
  "Men's Wear",
  "Sarees",
  "Women's Wear",
];

function getProductName(product) {
  return product?.name || product?.product_name || "Product";
}

function getProductPrice(product) {
  return Number(
    product?.discount_price ||
    product?.selling_price ||
    product?.price ||
    product?.sale_price ||
    product?.product_price ||
    0
  );
}

function getProductStock(product) {
  return Number(product?.current_stock || product?.stock || product?.quantity || 0);
}

function getProductSold(product) {
  return Number(product?.sold_quantity || product?.total_sold || 0);
}

function getProductImage(product) {
  return product?.thumbnail || product?.image || product?.featured_image || product?.product_image || null;
}

function normalizeLabel(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace("'S", "'s");
}

function formatCurrency(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function parseOptions(source) {
  if (Array.isArray(source)) {
    return source.map((item) => String(item || "").trim()).filter(Boolean);
  }

  if (typeof source === "string") {
    return source
      .split(/[|,/]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function getProductVariantOptions(product, type, fallbackRows) {
  const keys =
    type === "color"
      ? ["color", "colors", "available_colors", "product_colors"]
      : ["size", "sizes", "available_sizes", "product_sizes"];

  for (const key of keys) {
    const values = parseOptions(product?.[key]);
    if (values.length) return values;
  }

  return fallbackRows
    .map((row) => row?.name || row?.value || row?.title)
    .filter(Boolean)
    .slice(0, 8);
}

function MetricCard({ label, value }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function POSView({ token, apiRequest }) {
  const { width } = useWindowDimensions();
  const isCompact = width < 1180;
  const isMobile = width < 760;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [colorOptions, setColorOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [discount, setDiscount] = useState(0);
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cart, setCart] = useState([]);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  const productSizes = useMemo(() => {
    return getProductVariantOptions(selectedProduct, "size", sizeOptions);
  }, [selectedProduct, sizeOptions]);

  const productColors = useMemo(() => {
    return getProductVariantOptions(selectedProduct, "color", colorOptions);
  }, [selectedProduct, colorOptions]);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const productData = await apiRequest("/products", { token });
      setProducts(Array.isArray(productData) ? productData : productData?.rows || []);

      try {
        const fetchTable = async (table) => {
          try {
            const data = await apiRequest(`/admin/data/tables/${table}`, { token });
            return data?.rows || [];
          } catch (e) {
            console.warn(`Failed to load ${table}:`, e?.message || e);
            return [];
          }
        };

        const [
          categoryData,
          brandData,
          colorData,
          sizeData,
          orderData,
        ] = await Promise.all([
          fetchTable("categories"),
          fetchTable("brands"),
          fetchTable("colors"),
          fetchTable("sizes"),
          fetchTable("orders"),
        ]);

        setCategories(categoryData);
        setBrands(brandData);
        setColorOptions(colorData);
        setSizeOptions(sizeData);
        setRecentOrders(orderData);
      } catch (adminError) {
        console.warn("Admin POS metadata failed to load:", adminError?.message || adminError);
      }

      try {
        const customerData = await apiRequest("/admin/data/tables/customers", { token });
        setCustomers(customerData?.rows || []);
      } catch {
        try {
          const userData = await apiRequest("/admin/data/tables/users", { token });
          setCustomers(userData?.rows || []);
        } catch (customerError) {
          console.warn("POS customers failed to load:", customerError?.message || customerError);
        }
      }
    } catch (error) {
      console.error("Failed to load POS data:", error);
      Alert.alert("POS Load Failed", error?.message || "Unable to load live POS data.");
    } finally {
      setLoading(false);
    }
  }, [apiRequest, token]);

  useEffect(() => {
    fetchInitialData();

    const restoredCart = getSharedCart();
    const restoredCustomer = getSharedCustomer();
    if (restoredCart?.length) {
      setCart(restoredCart);
      if (restoredCustomer) setSelectedCustomer(restoredCustomer);
      clearSharedPOS();
    }
  }, [fetchInitialData]);

  const availableBrands = useMemo(() => {
    if (!brands.length) {
      return PREFERRED_BRANDS.map((name, index) => ({ id: `pref_brand_${index}`, name }));
    }

    const byPreference = PREFERRED_BRANDS
      .map((name) =>
        brands.find(
          (brand) => String(brand.name || "").toLowerCase() === name.toLowerCase()
        )
      )
      .filter(Boolean);

    const leftovers = brands.filter(
      (brand) =>
        !byPreference.some((preferred) => String(preferred.id) === String(brand.id))
    );

    return [...byPreference, ...leftovers];
  }, [brands]);

  const availableCategories = useMemo(() => {
    if (!categories.length) {
      return PREFERRED_CATEGORIES.map((name, index) => ({ id: `pref_cat_${index}`, name }));
    }

    const byPreference = PREFERRED_CATEGORIES
      .map((name) =>
        categories.find(
          (category) => String(category.name || "").toLowerCase() === name.toLowerCase()
        )
      )
      .filter(Boolean);

    const leftovers = categories.filter(
      (category) =>
        !byPreference.some((preferred) => String(preferred.id) === String(category.id))
    );

    return byPreference;
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = getProductName(product)
        .toLowerCase()
        .includes(searchQuery.trim().toLowerCase());

      const matchesCategory =
        selectedCategory === "all" ||
        String(product?.category_id) === String(selectedCategory);

      let matchesBrand = selectedBrand === "all";
      if (!matchesBrand) {
        if (product?.brand_id !== undefined && product?.brand_id !== null) {
          matchesBrand = String(product.brand_id) === String(selectedBrand);
        } else {
          const brandObj = availableBrands.find((b) => String(b.id) === String(selectedBrand));
          const brandName = brandObj ? String(brandObj.name).toLowerCase() : "";
          if (brandName) {
            const prodName = getProductName(product).toLowerCase();
            if (brandName === "generic") {
              matchesBrand = !prodName.includes("vogstya") && !prodName.includes("jockey");
            } else {
              matchesBrand = prodName.includes(brandName);
            }
          }
        }
      }

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, availableBrands]);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );
  const itemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );
  const total = Math.max(0, subtotal - Number(discount || 0));
  const todayOrders = useMemo(() => {
    const today = new Date();
    return recentOrders.filter((order) => {
      const created = new Date(order?.created_at);
      return (
        !Number.isNaN(created.getTime()) &&
        created.getDate() === today.getDate() &&
        created.getMonth() === today.getMonth() &&
        created.getFullYear() === today.getFullYear()
      );
    });
  }, [recentOrders]);
  const todayRevenue = useMemo(
    () =>
      todayOrders.reduce(
        (sum, order) =>
          sum + Number(order?.total_amount || order?.grand_total || order?.price || 0),
        0
      ),
    [todayOrders]
  );



  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setSelectedColor("");
    setSelectedSize("");
    setQuantity(1);
    setIsModalOpen(true);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const item = {
      id: `${selectedProduct.id}-${selectedColor}-${selectedSize}`,
      productId: selectedProduct.id,
      name: getProductName(selectedProduct),
      image: getProductImage(selectedProduct),
      price: getProductPrice(selectedProduct),
      color: selectedColor,
      size: selectedSize,
      quantity,
    };

    setCart((previous) => {
      const existing = previous.find((cartItem) => cartItem.id === item.id);
      if (existing) {
        return previous.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      }
      return [...previous, item];
    });

    setIsModalOpen(false);
  };

  const removeFromCart = (itemId) => {
    setCart((previous) => previous.filter((item) => item.id !== itemId));
  };

  const updateCartQuantity = (itemId, nextQty) => {
    if (nextQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart((previous) =>
      previous.map((item) =>
        item.id === itemId ? { ...item, quantity: nextQty } : item
      )
    );
  };

  const saveDraft = async () => {
    if (!cart.length) {
      Alert.alert("Cart Empty", "Add at least one product before saving a draft.");
      return;
    }

    try {
      setLoading(true);
      await apiRequest("/admin/data/tables/pos_drafts", {
        method: "POST",
        token,
        body: {
          customer: selectedCustomer || "Walk-in Customer",
          total_products: itemCount,
          subtotal,
          discount: Number(discount || 0),
          total,
          payment_method: paymentMethod,
          coupon_code: coupon || null,
          items_json: JSON.stringify(cart),
        },
      });

      setCart([]);
      setDiscount(0);
      setCoupon("");
      setSelectedCustomer("");
      Alert.alert("Draft Saved", "Draft saved successfully.");
    } catch (error) {
      Alert.alert("Save Failed", error?.message || "Unable to save the draft.");
    } finally {
      setLoading(false);
    }
  };

  const processOrder = async () => {
    if (!cart.length) {
      Alert.alert("Cart Empty", "Add products before confirming the order.");
      return;
    }

    try {
      setLoading(true);
      const checkoutStart = await apiRequest("/api/orders/checkout/start", {
        method: "POST",
        token,
        body: {
          totalAmount: total,
          isPosOrder: true,
          shippingAddress: {
            fullName: selectedCustomer || "Walk-in Customer",
            phone: "0000000000",
            line1: "Vogstya POS Counter",
            city: "In-store",
            state: "POS",
            postalCode: "000000",
          },
          paymentMethod,
          cartItems: cart.map((item) => ({
            id: item.productId,
            quantity: item.quantity,
            variant: [item.color, item.size].filter(Boolean).join(" / ") || "Default",
          })),
        },
      });

      if (!checkoutStart?.orderId) {
        throw new Error("Checkout start response did not include an order id.");
      }

      await apiRequest("/api/orders/checkout/complete", {
        method: "POST",
        token,
        body: {
          orderId: checkoutStart.orderId,
          paymentDetails: {
            method: paymentMethod,
            transactionId: `POS-${Date.now()}`,
          },
        },
      });

      setCart([]);
      setDiscount(0);
      setCoupon("");
      setSelectedCustomer("");
      await fetchInitialData();
      Alert.alert("Checkout Complete", `Order #${checkoutStart.orderId} placed.`);
    } catch (error) {
      Alert.alert("Checkout Failed", error?.message || "Unable to finish checkout.");
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) {
      Alert.alert("Missing Details", "Customer name and phone number are required.");
      return;
    }

    try {
      await apiRequest("/admin/data/tables/users", {
        method: "POST",
        token,
        body: {
          name: newCustomer.name,
          email: newCustomer.email || `${newCustomer.phone}@vogstya.local`,
          phone: newCustomer.phone,
          password: "tempPassword123",
          auth_type: "local",
          is_active: 1,
        },
      });

      setIsAddCustomerOpen(false);
      setSelectedCustomer(newCustomer.name);
      setNewCustomer({ name: "", email: "", phone: "" });
      await fetchInitialData();
    } catch (error) {
      Alert.alert("Customer Create Failed", error?.message || "Unable to add customer.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BRAND_GREEN} />
        <Text style={styles.loadingText}>Loading live POS data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={{ flex: 1 }}>
        <Text style={styles.pageTitle}>Point of Sale (POS)</Text>

        <View style={[styles.workspace, isCompact && styles.workspaceStack, { flex: 1 }]}>
          <ScrollView style={[styles.catalogColumn, { flex: 1 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.panel}>
              <Text style={styles.catalogTitle}>Products</Text>
              <View style={[styles.filterRow, isMobile && styles.filterRowMobile]}>
                {Platform.OS === "web" ? (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={styles.filterSelect}>
                       <Text style={{ fontSize: 13, color: '#9aa6b5' }}>Brands: {selectedBrand}</Text>
                    </View>
                    <View style={styles.filterSelect}>
                       <Text style={{ fontSize: 13, color: '#9aa6b5' }}>Categories: {selectedCategory}</Text>
                    </View>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={[styles.textField, styles.mobileFilterField]}
                      placeholder="Select Brand"
                      placeholderTextColor="#9aa6b5"
                    />
                    <TextInput
                      style={[styles.textField, styles.mobileFilterField]}
                      placeholder="Select Category"
                      placeholderTextColor="#9aa6b5"
                    />
                  </>
                )}

                <View style={styles.searchWrap}>
                  <TextInput
                    style={styles.searchInput}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Search by product name"
                    placeholderTextColor="#9aa6b5"
                  />
                  <View style={styles.searchIconBox}>
                    <Ionicons name="search-outline" size={24} color="#51627f" />
                  </View>
                </View>
              </View>

              <View style={styles.productsCountRow}>
                <Text style={styles.productsCountText}>
                  {selectedBrand === "all" && selectedCategory === "all" && !searchQuery.trim()
                    ? `Showing all ${filteredProducts.length} live database products`
                    : `Showing ${filteredProducts.length} filtered live products`}
                </Text>
              </View>

              <View style={styles.productGrid}>
                {filteredProducts.map((product) => (
                  <Pressable
                    key={product.id}
                    style={[styles.productCard, isMobile && styles.productCardMobile]}
                    onPress={() => handleProductPress(product)}
                  >
                    <View style={styles.productImageWrap}>
                      {getProductImage(product) ? (
                        <Image
                          source={{ uri: getProductImage(product) }}
                          style={styles.productImage}
                        />
                      ) : (
                        <View style={styles.productFallback}>
                          <Ionicons name="image-outline" size={28} color="#bcc7d6" />
                        </View>
                      )}
                    </View>

                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={1}>
                        {getProductName(product)}
                      </Text>
                      <Text style={styles.productPrice}>
                        {formatCurrency(getProductPrice(product))}
                      </Text>
                      <Text style={styles.productMeta}>
                        {getProductSold(product)} Sold {" | "} {getProductStock(product)} Left
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {!filteredProducts.length && (
                <View style={styles.emptyProductsState}>
                  <Ionicons name="cube-outline" size={28} color="#94a3b8" />
                  <Text style={styles.emptyProductsTitle}>No products found</Text>
                  <Text style={styles.emptyProductsText}>
                    Check brand/category filters or search text.
                  </Text>
                </View>
              )}
            </View>
            </ScrollView>

          <View style={styles.cartColumn}>
            {isModalOpen && selectedProduct ? (
              <View style={[styles.panel, { flex: 1, height: "100%", padding: 0, overflow: "hidden" }]}>
                <View style={[styles.modalHeaderTop, { padding: 18, borderBottomWidth: 1, borderBottomColor: BORDER }]}>
                  <Text style={styles.modalTitleTop}>Product Details</Text>
                  <Pressable onPress={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                    <Ionicons name="close" size={20} color="#6B7280" />
                  </Pressable>
                </View>

                <View style={{ flex: 1, overflow: Platform.OS === 'web' ? 'auto' : 'scroll' }}>
                  <View style={{ padding: 18 }}>
                    <View style={styles.modalContentRow}>
                      <View style={styles.modalImageCol}>
                        <View style={styles.modalImageWrap}>
                          {getProductImage(selectedProduct) ? (
                            <Image
                              source={{ uri: getProductImage(selectedProduct) }}
                              style={styles.modalImage}
                            />
                          ) : (
                            <Ionicons name="image-outline" size={48} color="#bcc7d6" />
                          )}
                        </View>
                      </View>

                      <View style={styles.modalDetailsCol}>
                        <Text style={styles.modalProductName}>{getProductName(selectedProduct)}</Text>
                        <Text style={styles.modalProductPrice}>{formatCurrency(getProductPrice(selectedProduct))}</Text>

                        {!!productSizes.length && (
                          <View style={styles.modalVariantRow}>
                            <Text style={styles.modalVariantLabel}>Size</Text>
                            <View style={styles.modalOptionsRow}>
                              {productSizes.map((size) => (
                                <Pressable
                                  key={size}
                                  style={[
                                    styles.modalChipBox,
                                    selectedSize === size && styles.modalChipBoxActive,
                                  ]}
                                  onPress={() => setSelectedSize(size)}
                                >
                                  <Text
                                    style={[
                                      styles.modalChipBoxText,
                                      selectedSize === size && styles.modalChipBoxTextActive,
                                    ]}
                                  >
                                    {size}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        )}

                        {!!productColors.length && (
                          <View style={styles.modalVariantRow}>
                            <Text style={styles.modalVariantLabel}>Color</Text>
                            <View style={styles.modalOptionsRow}>
                              {productColors.map((color) => (
                                <Pressable
                                  key={color}
                                  style={[
                                    styles.modalChipBox,
                                    selectedColor === color && styles.modalChipBoxActive,
                                  ]}
                                  onPress={() => setSelectedColor(color)}
                                >
                                  <Text
                                    style={[
                                      styles.modalChipBoxText,
                                      selectedColor === color && styles.modalChipBoxTextActive,
                                    ]}
                                  >
                                    {color}
                                  </Text>
                                </Pressable>
                              ))}
                            </View>
                          </View>
                        )}

                        <View style={styles.modalVariantRow}>
                          <Text style={styles.modalVariantLabel}>Quantity</Text>
                          <View style={styles.qtyBox}>
                            <Pressable
                              style={styles.qtyBoxBtn}
                              onPress={() => setQuantity((current) => Math.max(1, current - 1))}
                            >
                              <Ionicons name="remove" size={16} color="#374151" />
                            </Pressable>
                            <Text style={styles.qtyBoxValue}>{quantity}</Text>
                            <Pressable
                              style={styles.qtyBoxBtn}
                              onPress={() => setQuantity((current) => current + 1)}
                            >
                              <Ionicons name="add" size={16} color="#374151" />
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                <View style={{ padding: 18, borderTopWidth: 1, borderTopColor: BORDER }}>
                  <Pressable style={styles.modalConfirmButton} onPress={addToCart}>
                    <Text style={styles.modalConfirmButtonText}>Confirm</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={[styles.panel, { flex: 1, height: "100%", padding: 0, overflow: "hidden" }]}>
                <View style={{ padding: 18, borderBottomWidth: 1, borderBottomColor: BORDER }}>
                  <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                    <View style={{ flex: 1 }}>
                      {Platform.OS === "web" ? (
                        <View style={styles.customerSelect}>
                          <Text style={{ color: '#9aa6b5' }}>{selectedCustomer || "Select Customer"}</Text>
                        </View>
                      ) : (
                        <TextInput
                          style={styles.customerSelect}
                          placeholder="Enter customer name or phone number"
                          value={selectedCustomer}
                          onChangeText={setSelectedCustomer}
                        />
                      )}
                    </View>
                    <Pressable
                      style={styles.customerButtonSmall}
                      onPress={() => setIsAddCustomerOpen(true)}
                    >
                      <Ionicons name="add-circle" size={20} color={BRAND_GREEN} />
                      <Text style={styles.customerButtonSmallText}>Customer</Text>
                    </Pressable>
                  </View>
                </View>

                <View style={{ flex: 1, overflow: Platform.OS === 'web' ? 'auto' : 'scroll', backgroundColor: "#eeeeee" }}>
                  <View style={{ padding: 18 }}>
                    <View style={styles.cartItemsList}>
                      {!cart.length ? (
                        <View style={styles.emptyCart}>
                          <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
                          <Text style={styles.emptyCartText}>Cart is empty</Text>
                        </View>
                      ) : (
                        cart.map((item) => (
                          <View key={item.id} style={styles.cartItemCard}>
                            <Image source={{ uri: item.image }} style={styles.cartItemImageCard} />
                            <View style={styles.cartItemInfoCard}>
                              <Text style={styles.cartItemNameCard} numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text style={styles.cartItemVariantCard}>
                                {item.quantity} pair
                              </Text>
                              <Text style={styles.cartItemPriceCard}>{formatCurrency(item.price)}</Text>
                            </View>
                            <View style={styles.cartItemActionsCard}>
                              <Pressable onPress={() => updateCartQuantity(item.id, item.quantity + 1)}>
                                <Ionicons name="create-outline" size={20} color={BRAND_BLUE} />
                              </Pressable>
                              <Pressable onPress={() => removeFromCart(item.id)}>
                                <Ionicons name="trash-outline" size={20} color="#ff4b55" />
                              </Pressable>
                            </View>
                          </View>
                        ))
                      )}
                    </View>
                  </View>
                </View>

                <View style={[styles.summaryBlock, { padding: 18, borderTopWidth: 1, borderTopColor: BORDER }]}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Sub Total</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount Amount</Text>
                    <Text style={[styles.summaryValue, { color: "#ff4b55" }]}>- {formatCurrency(discount)}</Text>
                  </View>

                  <View style={styles.couponRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="Add Coupon"
                      value={coupon}
                      onChangeText={setCoupon}
                    />
                    <Pressable style={styles.applyButton} onPress={() => {}}>
                      <Text style={styles.applyButtonText}>Apply</Text>
                    </Pressable>
                  </View>

                  <View style={styles.paymentMethodRow}>
                    {["cash", "card", "upi"].map((method) => (
                      <Pressable
                        key={method}
                        style={[
                          styles.paymentChip,
                          paymentMethod === method && styles.paymentChipActive,
                        ]}
                        onPress={() => setPaymentMethod(method)}
                      >
                        <Text
                          style={[
                            styles.paymentChipText,
                            paymentMethod === method && styles.paymentChipTextActive,
                          ]}
                        >
                          {method.toUpperCase()}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable style={styles.draftButton} onPress={saveDraft}>
                      <Text style={styles.draftButtonText}>Draft</Text>
                    </Pressable>
                    <Pressable style={styles.totalButton} onPress={processOrder}>
                      <Text style={styles.totalButtonText}>
                        Grand Total {formatCurrency(total)} →
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
        </View>
        </View>
        </View>

      {isAddCustomerOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Customer</Text>
              <Pressable onPress={() => setIsAddCustomerOpen(false)}>
                <Ionicons name="close" size={24} color={MUTED} />
              </Pressable>
            </View>

            <TextInput
              style={styles.textField}
              value={newCustomer.name}
              onChangeText={(value) =>
                setNewCustomer((current) => ({ ...current, name: value }))
              }
              placeholder="Customer name"
              placeholderTextColor="#9aa6b5"
            />
            <TextInput
              style={[styles.textField, styles.modalInputGap]}
              value={newCustomer.phone}
              onChangeText={(value) =>
                setNewCustomer((current) => ({ ...current, phone: value }))
              }
              placeholder="Phone number"
              placeholderTextColor="#9aa6b5"
            />
            <TextInput
              style={[styles.textField, styles.modalInputGap]}
              value={newCustomer.email}
              onChangeText={(value) =>
                setNewCustomer((current) => ({ ...current, email: value }))
              }
              placeholder="Email"
              placeholderTextColor="#9aa6b5"
            />

            <Pressable style={styles.modalAddButton} onPress={createCustomer}>
              <Text style={styles.modalAddButtonText}>Create Customer</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  loadingContainer: {
    minHeight: 520,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: MUTED,
    fontSize: 15,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "400",
    color: "#1f2d3d",
    marginBottom: 18,
  },
  metricsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 18,
  },
  metricCard: {
    backgroundColor: PANEL,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 140,
  },
  metricValue: {
    color: BRAND_GREEN,
    fontWeight: "700",
    fontSize: 18,
  },
  metricLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 4,
  },
  workspace: {
    flexDirection: "row",
    gap: 20,
    alignItems: "stretch",
  },
  workspaceStack: {
    flexDirection: "column",
  },
  catalogColumn: {
    flex: 1,
    minWidth: 0,
    height: "100%",
  },
  cartColumn: {
    width: 520,
    maxWidth: "100%",
    height: "100%",
  },
  panel: {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 18,
  },
  filterRow: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 18,
  },
  filterRowMobile: {
    flexDirection: "column",
  },
  filterSelect: {
    minWidth: 160,
    height: 52,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT,
  },
  mobileFilterField: {
    flex: 1,
  },
  searchWrap: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 260,
    minWidth: 220,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 14,
    color: TEXT,
    fontSize: 14,
  },
  searchIconBox: {
    width: 64,
    alignItems: "center",
    justifyContent: "center",
    borderLeftWidth: 1,
    borderLeftColor: "#e3e8ef",
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  productCard: {
    width: 320,
    maxWidth: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    overflow: "hidden",
    flexDirection: "row",
  },
  productCardMobile: {
    width: "100%",
  },
  productImageWrap: {
    width: 150,
    height: 165,
    backgroundColor: "#eef2f6",
  },
  productImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  productFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 16,
    justifyContent: "center",
  },
  productName: {
    color: TEXT,
    fontSize: 13,
    marginBottom: 8,
  },
  productPrice: {
    color: BRAND_BLUE,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  productMeta: {
    color: "#55657a",
    fontSize: 12,
  },
  catalogTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: "500",
    marginBottom: 16,
  },
  productsCountRow: {
    marginBottom: 14,
  },
  productsCountText: {
    color: MUTED,
    fontSize: 13,
  },
  emptyProductsState: {
    paddingVertical: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyProductsTitle: {
    marginTop: 10,
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyProductsText: {
    marginTop: 6,
    color: MUTED,
    fontSize: 13,
  },
  customerSelect: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT,
  },
  customerButtonSmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
  },
  customerButtonSmallText: {
    color: BRAND_GREEN,
    fontSize: 14,
    fontWeight: "500",
  },
  cartBox: {
    marginTop: 24,
    minHeight: 260,
    backgroundColor: "#f2f3f5",
    borderRadius: 8,
    padding: 16,
  },
  emptyCart: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
  },
  emptyCartText: {
    color: MUTED,
    fontSize: 15,
  },
  cartItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  cartItemImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "#edf2f6",
  },
  cartItemImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cartItemImageFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cartItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cartItemName: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
  },
  cartItemVariant: {
    color: BRAND_BLUE,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
  },
  cartItemPrice: {
    color: BRAND_BLUE,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },
  cartItemCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cartItemImageCard: {
    width: 80,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
    backgroundColor: "#f8fafc",
  },
  cartItemInfoCard: {
    flex: 1,
  },
  cartItemNameCard: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  cartItemVariantCard: {
    color: BRAND_BLUE,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  cartItemPriceCard: {
    color: "#1e293b",
    fontSize: 15,
    fontWeight: "700",
  },
  cartItemActionsCard: {
    flexDirection: "row",
    gap: 10,
  },
  summaryBlock: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#eceff4",
    paddingTop: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#16263b",
    fontSize: 15,
    fontWeight: "400",
  },
  summaryValue: {
    color: "#16263b",
    fontSize: 16,
    fontWeight: "600",
  },
  totalLabel: {
    color: "#16263b",
    fontSize: 18,
    fontWeight: "600",
  },
  totalValue: {
    color: BRAND_GREEN,
    fontSize: 22,
    fontWeight: "700",
  },
  discountInput: {
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    width: 100,
    textAlign: "right",
    fontSize: 14,
    color: "#16263b",
  },
  discountAmount: {
    color: "#ff4458",
    fontSize: 22,
    fontWeight: "500",
  },
  couponRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 18,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: TEXT,
  },
  applyButton: {
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: BRAND_GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  paymentMethodRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  paymentChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  paymentChipActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
  },
  paymentChipTextActive: {
    color: "#fff",
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  draftButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#fff2c8",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  draftButtonText: {
    color: "#f09c00",
    fontSize: 15,
    fontWeight: "600",
  },
  totalButton: {
    flex: 1.5,
    borderRadius: 8,
    backgroundColor: BRAND_GREEN,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  totalButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  textField: {
    borderWidth: 1,
    borderColor: "#d8dee8",
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: TEXT,
  },
  modalOverlay: {
    position: Platform.OS === "web" ? "fixed" : "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.38)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    zIndex: 9999,
  },
  modalCardLarge: {
    position: "absolute",
    width: "100%",
    maxWidth: 720,
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 24,
  },
  modalHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitleTop: {
    color: "#1f2937",
    fontSize: 22,
    fontWeight: "600",
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalContentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 32,
  },
  modalImageCol: {
    flex: 1,
    minWidth: 260,
  },
  modalImageWrap: {
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#e5e7eb",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  modalImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  modalDetailsCol: {
    flex: 1.2,
    minWidth: 280,
    justifyContent: "flex-start",
  },
  modalProductName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  modalProductPrice: {
    fontSize: 26,
    fontWeight: "700",
    color: BRAND_BLUE,
    marginBottom: 24,
  },
  modalVariantRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalVariantLabel: {
    width: 80,
    fontSize: 15,
    color: "#4b5563",
    fontWeight: "500",
  },
  modalOptionsRow: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  modalChipBox: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  modalChipBoxActive: {
    borderColor: "#7B61FF",
    backgroundColor: "#f5f3ff",
  },
  modalChipBoxText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  modalChipBoxTextActive: {
    color: "#111827",
  },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    overflow: "hidden",
    width: 140,
  },
  qtyBoxBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#f9fafb",
    alignItems: "center",
    justifyContent: "center",
  },
  qtyBoxValue: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
  },
  modalConfirmButton: {
    marginTop: 16,
    backgroundColor: BRAND_GREEN,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalInputGap: {
    marginTop: 12,
  },
});
