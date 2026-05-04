import crypto from "crypto";
import { db } from "../config/db.js";
import { sendMail } from "../utils/mail.js";
import { orderUpdateTemplate } from "../utils/emailTemplates.js";

const DEFAULT_DELIVERY_CHARGE = 50;
const DEFAULT_ORDER_PREFIX = "RC";
const PAYMENT_METHOD_LABELS = {
  upi_qr: "UPI Scanner",
  card: "Card Payment",
  netbanking: "Netbanking",
  cod: "Cash On Delivery",
};
const GATEWAY_HELPERS = {
  razorpay: "UPI, cards, net banking",
  easebuzz: "UPI and wallet checkout",
  payu: "UPI, cards, wallets",
  paypal: "International cards and wallets",
  stripe: "Cards and global payment methods",
};
const FALLBACK_GATEWAYS = [
  {
    id: "razorpay",
    label: "Razorpay",
    helper: "UPI, cards, net banking",
    temporaryKey: "rzp_test_********",
    upiHandle: "merchant@razorpay",
    mode: "test",
    isActive: true,
  },
  {
    id: "easebuzz",
    label: "Easebuzz",
    helper: "UPI and wallet checkout",
    temporaryKey: "easebuzz_test_********",
    upiHandle: "merchant@easebuzz",
    mode: "test",
    isActive: true,
  },
];

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(results);
    });
  });
}

function beginTransaction() {
  return new Promise((resolve, reject) => {
    db.beginTransaction((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function commitTransaction() {
  return new Promise((resolve, reject) => {
    db.commit((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function rollbackTransaction() {
  return new Promise((resolve) => {
    db.rollback(() => {
      resolve();
    });
  });
}

function normalizePaymentMethod(value) {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "upi_qr" || normalized === "card" || normalized === "netbanking" || normalized === "cod") {
    return normalized;
  }

  return "upi_qr";
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJson(value) {
  if (!value || typeof value !== "string") {
    return {};
  }

  try {
    return JSON.parse(value);
  } catch (_error) {
    return {};
  }
}

function maskCredential(value) {
  const text = String(value || "").trim();

  if (!text) {
    return "Not configured";
  }

  if (text.length <= 8) {
    return `${text.slice(0, 2)}****`;
  }

  return `${text.slice(0, 4)}****${text.slice(-4)}`;
}

function createSessionToken(prefix = "pay") {
  const entropy = crypto.randomBytes(6).toString("hex");
  return `${prefix}_${Date.now()}_${entropy}`;
}

function toPaise(amount) {
  return Math.max(100, Math.round(toNumber(amount, 0) * 100));
}

async function createRazorpayGatewayOrder({ amount, receipt, notes }) {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    return {
      publicKey: keyId || null,
      gatewayOrderId: null,
    };
  }

  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: toPaise(amount),
        currency: "INR",
        receipt,
        notes: notes || {},
      }),
    });

    if (!response.ok) {
      const payload = await response.text();
      throw new Error(`Razorpay order create failed: ${payload}`);
    }

    const payload = await response.json();
    return {
      publicKey: keyId,
      gatewayOrderId: payload?.id || null,
    };
  } catch (_error) {
    return {
      publicKey: keyId,
      gatewayOrderId: null,
    };
  }
}

function verifyRazorpaySignature({ gatewayOrderId, gatewayTransactionId, gatewaySignature }) {
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keySecret) {
    return false;
  }

  const payload = `${gatewayOrderId}|${gatewayTransactionId}`;
  const expectedSignature = crypto.createHmac("sha256", keySecret).update(payload).digest("hex");
  return expectedSignature === gatewaySignature;
}

function allowRazorpayVerificationBypass() {
  return String(process.env.RAZORPAY_ALLOW_TEST_NO_SIGNATURE || "")
    .trim()
    .toLowerCase() === "true";
}

function buildEasebuzzRedirectUrl({ orderCode, amount, phone }) {
  const explicitUrl = String(process.env.EASEBUZZ_REDIRECT_URL || "").trim();
  if (explicitUrl) {
    return explicitUrl;
  }

  const baseUrl = String(process.env.EASEBUZZ_BASE_URL || "https://testpay.easebuzz.in").trim();
  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const query = new URLSearchParams({
    order_code: String(orderCode || ""),
    amount: String(formatToTwoDecimals(amount)),
    phone: String(phone || ""),
  });
  return `${normalizedBase}/pay/mock-session?${query.toString()}`;
}

function formatToTwoDecimals(value) {
  const amount = toNumber(value, 0);
  return amount % 1 === 0 ? String(amount) : amount.toFixed(2);
}

function normalizeCheckoutItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => {
      const productId = Number(item?.productId ?? item?.id);
      const quantity = Math.max(1, Math.floor(toNumber(item?.quantity, 1)));

      if (!Number.isInteger(productId) || productId <= 0) {
        return null;
      }

      return {
        productId,
        quantity,
        color: item?.color || null,
        size: item?.size || null,
        unit: item?.unit || null,
      };
    })
    .filter(Boolean);
}

function formatOrderCode(nextOrderId) {
  return String(nextOrderId).padStart(6, "0");
}

function mapGatewayRow(row) {
  const config = parseJson(row.config);
  const id = String(row.name || row.title || "")
    .trim()
    .toLowerCase();
  const label = String(row.title || row.name || "Gateway").trim();
  const rawKey =
    config.published_key ||
    config.public_key ||
    config.key ||
    config.store_id ||
    config.profile_id ||
    "";

  return {
    id,
    label,
    helper: GATEWAY_HELPERS[id] || "Secure online checkout",
    temporaryKey: maskCredential(rawKey),
    upiHandle: config.upi_handle || `merchant@${id || "upi"}`,
    mode: String(row.mode || "test").toLowerCase(),
    isActive: Boolean(Number(row.is_active ?? 0)),
  };
}

async function getGatewayList() {
  try {
    const rows = await query(
      `SELECT id, title, name, config, mode, is_active
       FROM payment_gateways
       WHERE is_active = 1
       ORDER BY id ASC`
    );

    const gateways = rows.map(mapGatewayRow).filter((gateway) => gateway.id);
    return gateways.length ? gateways : FALLBACK_GATEWAYS;
  } catch (_error) {
    return FALLBACK_GATEWAYS;
  }
}

async function resolveCustomerId(userId) {
  if (!userId) {
    return null;
  }

  const users = await query("SELECT id FROM users WHERE id = ? LIMIT 1", [userId]);
  if (!users.length) {
    const error = new Error("Session expired. Please sign in again.");
    error.statusCode = 401;
    throw error;
  }

  const customers = await query("SELECT id FROM customers WHERE user_id = ? LIMIT 1", [userId]);

  if (customers.length) {
    return Number(customers[0].id);
  }

  const created = await query(
    "INSERT INTO customers (user_id, created_at, updated_at) VALUES (?, NOW(), NOW())",
    [userId]
  );

  return Number(created.insertId);
}

async function createAddressRecord(shippingAddress, customerId) {
  const address = shippingAddress || {};

  const result = await query(
    `INSERT INTO addresses (
      name,
      phone,
      customer_id,
      address_type,
      city,
      area,
      address_line,
      address_line2,
      post_code,
      latitude,
      longitude,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      address.fullName || null,
      address.phone || null,
      customerId,
      "Home",
      address.city || null,
      address.state || null,
      address.line1 || null,
      [address.line2, address.country].filter(Boolean).join(", ") || null,
      address.postalCode || null,
      address.latitude || null,
      address.longitude || null,
    ]
  );

  return Number(result.insertId);
}

function formatInr(value) {
  return `INR ${toNumber(value, 0).toFixed(2)}`;
}

const ORDER_MAIL_TOPICS = {
  order_confirmation: {
    badge: "Order Confirmation",
    title: "Your order is confirmed",
    subject: (orderCode) => `Order Confirmation - ${orderCode}`,
    accent: "#2563eb",
  },
  payment_success: {
    badge: "Payment Success",
    title: "Payment received successfully",
    subject: (orderCode) => `Payment Success - ${orderCode}`,
    accent: "#059669",
  },
  order_packed: {
    badge: "Order Packed",
    title: "Your order is packed",
    subject: (orderCode) => `Order Packed - ${orderCode}`,
    accent: "#7c3aed",
  },
  shipped: {
    badge: "Shipped",
    title: "Your order has been shipped",
    subject: (orderCode) => `Order Shipped - ${orderCode}`,
    accent: "#0ea5e9",
  },
  out_for_delivery: {
    badge: "Out for Delivery",
    title: "Your order is out for delivery",
    subject: (orderCode) => `Out for Delivery - ${orderCode}`,
    accent: "#ea580c",
  },
  delivered: {
    badge: "Delivered",
    title: "Delivered successfully",
    subject: (orderCode) => `Delivered - ${orderCode}`,
    accent: "#16a34a",
  },
  return_refund: {
    badge: "Return / Refund",
    title: "Your return/refund request was updated",
    subject: (orderCode) => `Return / Refund Update - ${orderCode}`,
    accent: "#dc2626",
  },
};



async function getOrderEmailMeta(orderId) {
  const rows = await query(
    `SELECT
       o.id,
       o.order_code,
       o.payable_amount,
       o.delivery_charge,
       o.total_amount,
       o.payment_method,
       o.order_status,
       o.payment_status,
       u.name AS user_name,
       u.email AS user_email
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE o.id = ?
     LIMIT 1`,
    [orderId]
  );

  return rows[0] || null;
}

async function maybeSendLifecycleEmail(orderId, topicKey, options = {}) {
  if (!orderId || !ORDER_MAIL_TOPICS[topicKey]) {
    return;
  }

  try {
    const order = await getOrderEmailMeta(orderId);
    const email = order?.user_email;
    const name = order?.user_name || "Customer";
    const orderCode = order?.order_code || "N/A";

    if (!email) {
      return;
    }

    const topic = ORDER_MAIL_TOPICS[topicKey];
    const description =
      options.description ||
      `There is a new update for your order ${orderCode}. Please check the latest status in your account.`;
    const detailRows = options.detailRows || [
      { label: "Total Amount", value: formatInr(order.payable_amount) },
      { label: "Payment Status", value: order.payment_status || "Pending" },
      { label: "Order Status", value: order.order_status || "Pending" },
    ];
    const textContent = [
      `Hi ${name},`,
      "",
      `${topic.badge}: ${description}`,
      `Order ID: ${orderCode}`,
      ...detailRows.map((row) => `${row.label}: ${row.value}`),
      "",
      "Thank you for shopping with VOGSTYA Store.",
    ].join("\n");

    const html = orderUpdateTemplate(name, orderCode, topic, description, detailRows, orderId);

    await sendMail(email, topic.subject(orderCode), textContent, html);
  } catch (_error) {
    // Email is best-effort only.
    console.error("Order lifecycle email error:", _error);
  }
}

export async function listPaymentGateways(_req, res) {
  const gateways = await getGatewayList();
  return res.json({ gateways });
}

export async function listOrders(req, res) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Please log in to view orders." });
  }

  try {
    const isAdmin = String(req.user?.role || "").toLowerCase() === "admin";
    const params = [];
    const whereClause = isAdmin ? "" : "WHERE c.user_id = ?";

    if (!isAdmin) {
      params.push(Number(req.user.id));
    }

    const orders = await query(
      `SELECT
         o.id,
         o.order_code,
         o.payable_amount,
         o.total_amount,
         o.delivery_charge,
         o.payment_status,
         o.order_status,
         o.payment_method,
         o.created_at,
         a.name,
         a.phone,
         a.city,
         a.area,
         a.address_line,
         a.post_code
       FROM orders o
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN addresses a ON a.id = o.address_id
       ${whereClause}
       ORDER BY o.id DESC`,
      params
    );

    const orderIds = orders.map((order) => Number(order.id));
    let items = [];

    if (orderIds.length) {
      const placeholders = orderIds.map(() => "?").join(",");
      items = await query(
        `SELECT
           op.order_id,
           op.product_id,
           op.quantity,
           p.name AS product_name
         FROM order_products op
         LEFT JOIN products p ON p.id = op.product_id
         WHERE op.order_id IN (${placeholders})`,
        orderIds
      );
    }

    const itemsByOrderId = items.reduce((acc, item) => {
      const key = Number(item.order_id);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return res.json({
      orders: orders.map((order) => ({
        ...order,
        items: itemsByOrderId[Number(order.id)] || [],
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load orders.", error: error.message });
  }
}

export async function startCheckout(req, res) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Please log in to place your order." });
  }

  const shippingAddress = req.body?.shippingAddress || {};
  const paymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
  const requestedGatewayId = String(req.body?.paymentGateway || "").trim().toLowerCase();
  const items = normalizeCheckoutItems(req.body?.items);

  if (!items.length) {
    return res.status(400).json({ message: "At least one cart item is required." });
  }

  const requiredAddressFields = [
    ["fullName", "Full name"],
    ["phone", "Phone number"],
    ["line1", "Address line 1"],
    ["city", "City"],
    ["state", "State"],
    ["postalCode", "Postal code"],
  ];

  const missingField = requiredAddressFields.find(
    ([field]) => !String(shippingAddress[field] || "").trim()
  );

  if (missingField) {
    return res.status(400).json({ message: `${missingField[1]} is required.` });
  }

  const productIds = [...new Set(items.map((item) => item.productId))];
  const placeholders = productIds.map(() => "?").join(",");

  try {
    const products = await query(
      `SELECT id, name, shop_id, price, discount_price, quantity
       FROM products
       WHERE id IN (${placeholders})`,
      productIds
    );

    if (products.length !== productIds.length) {
      const foundIds = new Set(products.map((product) => Number(product.id)));
      const missingIds = productIds.filter((id) => !foundIds.has(Number(id)));
      return res.status(400).json({ message: `Some products do not exist: ${missingIds.join(", ")}` });
    }

    const productById = new Map(products.map((product) => [Number(product.id), product]));
    const shopIds = [...new Set(products.map((product) => Number(product.shop_id || 0)).filter(Boolean))];

    if (shopIds.length !== 1) {
      return res.status(400).json({ message: "All products in an order must belong to one shop." });
    }

    const lineItems = [];
    let subtotal = 0;
    const requestedQuantityByProduct = new Map();

    for (const item of items) {
      const product = productById.get(item.productId);
      const availableStock = Math.max(0, Math.floor(toNumber(product.quantity, 0)));
      const alreadyRequested = requestedQuantityByProduct.get(item.productId) || 0;
      const nextRequested = alreadyRequested + item.quantity;

      if (nextRequested > availableStock) {
        return res.status(400).json({
          message: `${product.name} has only ${availableStock} item(s) left in stock.`,
        });
      }

      requestedQuantityByProduct.set(item.productId, nextRequested);

      const unitPrice =
        toNumber(product.discount_price, 0) > 0
          ? toNumber(product.discount_price, 0)
          : toNumber(product.price, 0);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      lineItems.push({
        ...item,
        productName: product.name,
        shopId: Number(product.shop_id),
        unitPrice,
        lineTotal,
      });
    }

    const shopId = shopIds[0];
    const shopRows = await query("SELECT id, delivery_charge FROM shops WHERE id = ? LIMIT 1", [shopId]);

    if (!shopRows.length) {
      return res.status(400).json({ message: "Selected shop was not found." });
    }

    const configuredDeliveryCharge = toNumber(shopRows[0].delivery_charge, DEFAULT_DELIVERY_CHARGE);
    const requestedDeliveryCharge = toNumber(req.body?.deliveryCharge, configuredDeliveryCharge);
    const deliveryCharge = Math.max(0, requestedDeliveryCharge);
    const payableAmount = subtotal + deliveryCharge;
    const gateways = await getGatewayList();
    const selectedGateway =
      gateways.find((gateway) => gateway.id === requestedGatewayId) || gateways[0] || FALLBACK_GATEWAYS[0];

    if (!selectedGateway && paymentMethod !== "cod") {
      return res.status(400).json({ message: "No payment gateway is active right now." });
    }

    const userId = Number(req.user?.id || 0) || null;

    let orderId;
    let paymentId;
    let orderCode;
    let sessionToken;
    let publicKey = null;
    let gatewayOrderId = null;
    let redirectUrl = null;

    try {
      await beginTransaction();

      const customerId = await resolveCustomerId(userId);
      const addressId = await createAddressRecord(shippingAddress, customerId);
      const lastOrderRows = await query("SELECT id FROM orders ORDER BY id DESC LIMIT 1");
      const nextOrderId = Number(lastOrderRows[0]?.id || 0) + 1;
      orderCode = formatOrderCode(nextOrderId);
      const paymentMethodLabel =
        paymentMethod === "cod"
          ? PAYMENT_METHOD_LABELS.cod
          : `${selectedGateway.label} - ${PAYMENT_METHOD_LABELS[paymentMethod]}`;

      const orderInsert = await query(
        `INSERT INTO orders (
          shop_id,
          pos_order,
          customer_id,
          order_code,
          prefix,
          coupon_id,
          coupon_discount,
          payable_amount,
          total_amount,
          tax_amount,
          discount,
          delivery_charge,
          payment_status,
          order_status,
          payment_method,
          address_id,
          instruction,
          admin_commission,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, NULL, 0, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
        [
          shopId,
          req.body?.isPosOrder ? 1 : 0,
          customerId,
          orderCode,
          DEFAULT_ORDER_PREFIX,
          payableAmount,
          subtotal,
          deliveryCharge,
          "Pending",
          "Pending",
          paymentMethodLabel,
          addressId,
          req.body?.note || null,
        ]
      );

      orderId = Number(orderInsert.insertId);

      for (const line of lineItems) {
        await query(
          `INSERT INTO order_products (
            order_id,
            product_id,
            quantity,
            color,
            size,
            unit,
            price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, line.productId, line.quantity, line.color, line.size, line.unit, line.unitPrice]
        );

        await query("UPDATE products SET quantity = quantity - ?, updated_at = NOW() WHERE id = ?", [
          line.quantity,
          line.productId,
        ]);
      }

      if (paymentMethod !== "cod" && selectedGateway?.id === "razorpay") {
        const razorpayOrder = await createRazorpayGatewayOrder({
          amount: payableAmount,
          receipt: orderCode,
          notes: {
            orderCode,
            phone: shippingAddress.phone || "",
          },
        });
        publicKey = razorpayOrder.publicKey;
        gatewayOrderId = razorpayOrder.gatewayOrderId || createSessionToken("rzp_order");
      }

      if (paymentMethod !== "cod" && selectedGateway?.id === "easebuzz") {
        redirectUrl = buildEasebuzzRedirectUrl({
          orderCode,
          amount: payableAmount,
          phone: shippingAddress.phone,
        });
      }

      sessionToken = gatewayOrderId || createSessionToken(selectedGateway?.id || "pay");
      const paymentInsert = await query(
        `INSERT INTO payments (
          amount,
          currency,
          payment_method,
          is_paid,
          payment_token,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          payableAmount,
          "INR",
          paymentMethod === "cod" ? "cash" : selectedGateway.id,
          0,
          sessionToken,
        ]
      );

      paymentId = Number(paymentInsert.insertId);

      await query("INSERT INTO order_payments (order_id, payment_id) VALUES (?, ?)", [orderId, paymentId]);

      await commitTransaction();
      maybeSendLifecycleEmail(orderId, "order_confirmation", {
        description: "Your order has been placed successfully and is now confirmed.",
        detailRows: [
          { label: "Subtotal", value: formatInr(subtotal) },
          { label: "Delivery Charge", value: formatInr(deliveryCharge) },
          { label: "Total Amount", value: formatInr(payableAmount) },
          { label: "Payment Method", value: paymentMethodLabel },
        ],
      });
    } catch (transactionError) {
      await rollbackTransaction();
      throw transactionError;
    }

    return res.status(201).json({
      message: "Order created successfully. Continue to complete payment.",
      order: {
        id: orderId,
        orderCode,
        payableAmount,
        totalAmount: subtotal,
        deliveryCharge,
        paymentStatus: "Pending",
        orderStatus: "Pending",
        paymentMethod: paymentMethod === "cod" ? PAYMENT_METHOD_LABELS.cod : PAYMENT_METHOD_LABELS[paymentMethod],
      },
      payment: {
        id: paymentId,
        status: "pending",
        method: paymentMethod,
        sessionToken,
        publicKey,
        gatewayOrderId,
        redirectUrl,
        gateway: selectedGateway || null,
        amount: payableAmount,
        currency: "INR",
      },
    });
  } catch (error) {
    console.error("CHECKOUT ERROR:", error);
    try {
      import("fs").then(fs => {
        fs.appendFileSync("checkout_error.log", `\n[${new Date().toISOString()}] ${error.stack}\n`);
      });
    } catch (fsError) {}

    if (Number(error?.statusCode) === 401) {
      return res.status(401).json({
        message: error.message || "Session expired. Please sign in again.",
      });
    }
    
    return res.status(500).json({ 
      message: "Could not start checkout.", 
      error: error.message,
      detail: error.sqlMessage || "Check checkout_error.log for full stack trace"
    });
  }
}

function normalizeCompletionStatus(value) {
  const status = String(value || "").trim().toLowerCase();

  if (status === "paid" || status === "success") return "paid";
  if (status === "failed") return "failed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "cod_confirmed") return "cod_confirmed";
  return "paid";
}

export async function completeCheckout(req, res) {
  const orderId = Number(req.body?.orderId || 0);

  if (!orderId) {
    return res.status(400).json({ message: "orderId is required." });
  }

  const status = normalizeCompletionStatus(req.body?.status);
  const gatewayTransactionId = String(req.body?.gatewayTransactionId || "").trim();
  const gatewayOrderId = String(req.body?.gatewayOrderId || "").trim();
  const gatewaySignature = String(req.body?.gatewaySignature || "").trim();

  try {
    const rows = await query(
      `SELECT
         o.id,
         o.order_code,
         o.payable_amount,
         o.payment_status,
         o.order_status,
         o.payment_method,
         o.address_id,
         p.id AS payment_id,
         p.payment_method AS payment_method_code,
         p.payment_token
       FROM orders o
       LEFT JOIN order_payments op ON op.order_id = o.id
       LEFT JOIN payments p ON p.id = op.payment_id
       WHERE o.id = ?
       LIMIT 1`,
      [orderId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Order not found." });
    }

    const order = rows[0];

    if (!order.payment_id) {
      return res.status(400).json({ message: "Payment entry not found for this order." });
    }

    const isCashPayment = String(order.payment_method_code || "").toLowerCase() === "cash";
    const isRazorpayPayment = String(order.payment_method_code || "").toLowerCase() === "razorpay";
    const finalStatus = status === "paid" && isCashPayment ? "cod_confirmed" : status;
    const transactionId =
      gatewayTransactionId || createSessionToken(finalStatus === "cod_confirmed" ? "cod" : "txn");

    if (finalStatus === "paid" && isRazorpayPayment) {
      const allowBypass =
        allowRazorpayVerificationBypass() ||
        String(gatewayOrderId || "").startsWith("rzp_order") ||
        String(gatewaySignature || "").trim() === "test_signature";
      if ((!gatewayOrderId || !gatewayTransactionId || !gatewaySignature) && !allowBypass) {
        return res.status(400).json({ message: "Razorpay verification data is required." });
      }

      if (!allowBypass) {
        const isValidSignature = verifyRazorpaySignature({
          gatewayOrderId,
          gatewayTransactionId,
          gatewaySignature,
        });

        if (!isValidSignature) {
          return res.status(400).json({ message: "Invalid payment signature." });
        }
      }
    }

    let nextPaymentStatus = "Pending";
    let nextOrderStatus = "Placed";

    try {
      await beginTransaction();

      if (finalStatus === "paid") {
        nextPaymentStatus = "Paid";
        nextOrderStatus = "Placed";

        await query(
          "UPDATE payments SET is_paid = 1, payment_token = ?, updated_at = NOW() WHERE id = ?",
          [transactionId, order.payment_id]
        );
      } else if (finalStatus === "cod_confirmed") {
        nextPaymentStatus = "Pending";
        nextOrderStatus = "Placed";

        await query(
          "UPDATE payments SET is_paid = 0, payment_token = ?, updated_at = NOW() WHERE id = ?",
          [transactionId, order.payment_id]
        );
      } else if (finalStatus === "failed") {
        nextPaymentStatus = "Failed";
        nextOrderStatus = "Cancelled";

        await query(
          "UPDATE payments SET is_paid = 0, payment_token = ?, updated_at = NOW() WHERE id = ?",
          [transactionId, order.payment_id]
        );
      } else {
        nextPaymentStatus = "Cancelled";
        nextOrderStatus = "Cancelled";

        await query(
          "UPDATE payments SET is_paid = 0, payment_token = ?, updated_at = NOW() WHERE id = ?",
          [transactionId, order.payment_id]
        );
      }

      await query(
        "UPDATE orders SET payment_status = ?, order_status = ?, updated_at = NOW() WHERE id = ?",
        [nextPaymentStatus, nextOrderStatus, orderId]
      );

      await commitTransaction();
    } catch (transactionError) {
      await rollbackTransaction();
      throw transactionError;
    }

    const addressRows = order.address_id
      ? await query(
          `SELECT name, phone, city, area, address_line, address_line2, post_code, latitude, longitude
           FROM addresses
           WHERE id = ?
           LIMIT 1`,
          [order.address_id]
        )
      : [];
    const shipping = addressRows[0] || null;

    if (finalStatus === "paid") {
      maybeSendLifecycleEmail(orderId, "payment_success", {
        description: "Your payment was successful. We are preparing your package now.",
        detailRows: [
          { label: "Total Paid", value: formatInr(order.payable_amount) },
          { label: "Transaction ID", value: transactionId },
          { label: "Payment Method", value: order.payment_method || "Online" },
        ],
      });
    } else if (finalStatus === "cod_confirmed") {
      maybeSendLifecycleEmail(orderId, "order_confirmation", {
        description: "Your order has been placed successfully with Cash on Delivery.",
        detailRows: [
          { label: "Payable Amount", value: formatInr(order.payable_amount) },
          { label: "Payment Method", value: "Cash On Delivery" },
        ],
      });
    }

    return res.json({
      message:
        finalStatus === "paid"
          ? "Payment completed and order confirmed."
          : finalStatus === "cod_confirmed"
            ? "Order placed with cash on delivery."
            : "Order payment was not successful.",
      order: {
        id: orderId,
        orderCode: order.order_code,
        payableAmount: toNumber(order.payable_amount, 0),
        paymentStatus: nextPaymentStatus,
        orderStatus: nextOrderStatus,
        paymentMethod: order.payment_method,
        shipping,
      },
      payment: {
        id: Number(order.payment_id),
        transactionId,
        status: nextPaymentStatus.toLowerCase(),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not complete checkout.", error: error.message });
  }
}

export async function getOrderDetails(req, res) {
  const orderId = Number(req.params.id || 0);

  if (!orderId) {
    return res.status(400).json({ message: "Valid order id is required." });
  }

  try {
    const orders = await query(
      `SELECT
         o.id,
         o.order_code,
         o.payable_amount,
         o.total_amount,
         o.delivery_charge,
         o.payment_status,
         o.order_status,
         o.payment_method,
         o.created_at,
         a.name AS shipping_name,
         a.phone AS shipping_phone,
         a.city,
         a.address_line,
         a.address_line2,
         a.post_code
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?
       LIMIT 1`,
      [orderId]
    );

    if (!orders.length) {
      return res.status(404).json({ message: "Order not found." });
    }

    const items = await query(
      `SELECT
         op.product_id,
         op.quantity,
         op.price,
         op.color,
         op.size,
         op.unit,
         p.name AS product_name
       FROM order_products op
       LEFT JOIN products p ON p.id = op.product_id
       WHERE op.order_id = ?`,
      [orderId]
    );

    return res.json({
      order: orders[0],
      items,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not load order details.", error: error.message });
  }
}

const STATUS_EVENT_MAP = {
  packed: { orderStatus: "Packed", topicKey: "order_packed", description: "Great news. Your order has been packed and is ready for shipment." },
  shipped: { orderStatus: "Shipped", topicKey: "shipped", description: "Your package has been shipped and is on the way." },
  out_for_delivery: {
    orderStatus: "Out for Delivery",
    topicKey: "out_for_delivery",
    description: "Your package is out for delivery and should reach you soon.",
  },
  delivered: { orderStatus: "Delivered", topicKey: "delivered", description: "Your order was delivered successfully. We hope you love it." },
  return_refund: {
    orderStatus: "Returned",
    topicKey: "return_refund",
    description: "Your return/refund request was processed. Refund will reflect as per your payment provider timeline.",
  },
};

export async function updateOrderLifecycleStatus(req, res) {
  const orderId = Number(req.params.id || 0);
  const statusKey = String(req.body?.status || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  const statusConfig = STATUS_EVENT_MAP[statusKey];
  const requesterRole = String(req.user?.role || "").trim().toLowerCase();

  if (!orderId) {
    return res.status(400).json({ message: "Valid order id is required." });
  }

  if (!statusConfig) {
    return res.status(400).json({
      message: "Invalid status. Allowed: packed, shipped, out_for_delivery, delivered, return_refund.",
    });
  }

  if (requesterRole !== "admin") {
    return res.status(403).json({ message: "Only admin can update lifecycle status." });
  }

  try {
    const result = await query("UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?", [
      statusConfig.orderStatus,
      orderId,
    ]);

    if (!result?.affectedRows) {
      return res.status(404).json({ message: "Order not found." });
    }

    maybeSendLifecycleEmail(orderId, statusConfig.topicKey, {
      description: statusConfig.description,
      detailRows: [
        { label: "Order Status", value: statusConfig.orderStatus },
        { label: "Updated By", value: requesterRole.toUpperCase() },
      ],
    });

    return res.json({
      message: "Order lifecycle updated successfully.",
      orderId,
      orderStatus: statusConfig.orderStatus,
      emailTopic: statusConfig.topicKey,
    });
  } catch (error) {
    return res.status(500).json({ message: "Could not update order lifecycle.", error: error.message });
  }
}

export const createOrder = startCheckout;
