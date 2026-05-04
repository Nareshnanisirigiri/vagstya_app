import { db } from "../config/db.js";

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

async function safeQuery(sql, params = [], fallback = []) {
  try {
    return await query(sql, params);
  } catch (_error) {
    return fallback;
  }
}

function toCurrency(value) {
  return Number(value || 0);
}

function buildLastSevenDayLabels() {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Kolkata",
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return formatter.format(date).replace(",", "");
  });
}

function mapSeriesByLabel(rows, valueKey) {
  return rows.reduce((acc, row) => {
    acc[row.label] = Number(row[valueKey] || 0);
    return acc;
  }, {});
}

function normalizeOrderStatus(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getOrderAnalyticsBucket(status) {
  const normalized = normalizeOrderStatus(status);

  if (normalized === "pending") return "pending";
  if (["confirm", "confirmed", "placed"].includes(normalized)) return "confirm";
  if (normalized === "processing") return "processing";
  if (["pickup", "picked up", "packed"].includes(normalized)) return "pickup";
  if (["on the way", "shipped", "out for delivery"].includes(normalized)) return "onTheWay";
  if (normalized === "delivered") return "delivered";
  if (["cancelled", "canceled"].includes(normalized)) return "cancelled";

  return null;
}

export async function getAdminDashboard(req, res) {
  try {
    const [
      userCountRows,
      productCountRows,
      orderStatsRows,
      recentOrders,
      topProducts,
      dailyStats,
      dailyUserStats,
      dailyProductStats,
      topProductsDistribution,
      shopCountRows,
      orderStatusRows,
      customerCountRows,
      withdrawApprovedRows,
      withdrawPendingRows,
      withdrawRejectedRows,
    ] = await Promise.all([
      safeQuery("SELECT COUNT(*) AS total FROM users", [], [{ total: 0 }]),
      safeQuery("SELECT COUNT(*) AS total FROM products", [], [{ total: 0 }]),
      safeQuery(
        `SELECT COUNT(*) AS totalOrders, COALESCE(SUM(payable_amount), 0) AS totalRevenue
         FROM orders`,
        [],
        [{ totalOrders: 0, totalRevenue: 0 }]
      ),
      safeQuery(
        `SELECT
           o.id,
           o.order_code,
           o.order_status,
           o.payment_status,
           o.payable_amount,
           o.created_at,
           u.name AS customer_name
         FROM orders o
         LEFT JOIN customers c ON c.id = o.customer_id
         LEFT JOIN users u ON u.id = c.user_id
         ORDER BY o.id DESC
         LIMIT 6`,
        [],
        []
      ),
      safeQuery(
        `SELECT
           p.id,
           p.name,
           p.quantity,
           p.price,
           p.created_at
         FROM products p
         ORDER BY p.id DESC
         LIMIT 6`,
        [],
        []
      ),
      safeQuery(
        `SELECT 
            DATE_FORMAT(created_at, '%d %b') AS label,
            COALESCE(SUM(payable_amount), 0) AS revenue,
            COUNT(*) AS orders
         FROM orders o
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [],
        []
      ),
      safeQuery(
        `SELECT
           DATE_FORMAT(created_at, '%d %b') AS label,
           COUNT(*) AS users
         FROM users
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [],
        []
      ),
      safeQuery(
        `SELECT
           DATE_FORMAT(created_at, '%d %b') AS label,
           COUNT(*) AS products
         FROM products
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`,
        [],
        []
      ),
      safeQuery(
        `SELECT
           c.name AS label,
           COUNT(p.id) AS value
         FROM categories c
         LEFT JOIN product_categories pc ON pc.category_id = c.id
         LEFT JOIN products p ON p.id = pc.product_id
         GROUP BY c.id
         HAVING value > 0
         ORDER BY value DESC
         LIMIT 6`,
        [],
        []
      ),
      safeQuery("SELECT COUNT(*) AS total FROM shops", [], [{ total: 0 }]),
      safeQuery("SELECT order_status, COUNT(*) AS total FROM orders GROUP BY order_status", [], []),
      safeQuery("SELECT COUNT(*) AS total FROM customers", [], [{ total: 0 }]),
      safeQuery("SELECT COALESCE(SUM(amount), 0) AS total FROM withdraws WHERE status = 'approved'", [], [{ total: 0 }]),
      safeQuery("SELECT COALESCE(SUM(amount), 0) AS total FROM withdraws WHERE status = 'pending'", [], [{ total: 0 }]),
      safeQuery("SELECT COALESCE(SUM(amount), 0) AS total FROM withdraws WHERE status = 'rejected'", [], [{ total: 0 }]),
    ]);

    const labels = buildLastSevenDayLabels();
    const revenueByLabel = mapSeriesByLabel(dailyStats, "revenue");
    const ordersByLabel = mapSeriesByLabel(dailyStats, "orders");
    const usersByLabel = mapSeriesByLabel(dailyUserStats, "users");
    const productsByLabel = mapSeriesByLabel(dailyProductStats, "products");

    const orderCounts = orderStatusRows.reduce((acc, row) => {
      const bucket = getOrderAnalyticsBucket(row.order_status);
      if (!bucket) {
        return acc;
      }

      acc[bucket] = (acc[bucket] || 0) + Number(row.total || 0);
      return acc;
    }, {});

    const totalRevenue = toCurrency(orderStatsRows[0]?.totalRevenue);

    return res.json({
      businessOverview: {
        shops: Number(shopCountRows[0]?.total ?? 0),
        products: Number(productCountRows[0]?.total ?? 0),
        orders: Number(orderStatsRows[0]?.totalOrders ?? 0),
        customers: Number(customerCountRows[0]?.total ?? 0),
      },
      orderAnalytics: {
        pending: orderCounts.pending || 0,
        confirm: orderCounts.confirm || 0,
        processing: orderCounts.processing || 0,
        pickup: orderCounts.pickup || 0,
        onTheWay: orderCounts.onTheWay || 0,
        delivered: orderCounts.delivered || 0,
        cancelled: orderCounts.cancelled || 0,
      },
      adminWallet: {
        totalEarning: totalRevenue,
        alreadyWithdraw: Number(withdrawApprovedRows[0]?.total ?? 0),
        pendingWithdraw: Number(withdrawPendingRows[0]?.total ?? 0),
        totalCommission: totalRevenue * 0.15, // Assume 15% commission standard
        rejectedWithdraw: Number(withdrawRejectedRows[0]?.total ?? 0),
      },
      metrics: [
        { label: "Earnings", value: `Rs ${totalRevenue.toLocaleString("en-IN")}` },
        { label: "Products", value: String(productCountRows[0]?.total ?? 0) },
        { label: "Orders", value: String(orderStatsRows[0]?.totalOrders ?? 0) },
        { label: "Users", value: String(userCountRows[0]?.total ?? 0) },
      ],
      analytics: {
        labels,
        datasets: {
          revenue: labels.map((label) => revenueByLabel[label] || 0),
          orders: labels.map((label) => ordersByLabel[label] || 0),
          users: labels.map((label) => usersByLabel[label] || 0),
          products: labels.map((label) => productsByLabel[label] || 0),
        }
      },
      meta: {
        period: "Last 7 Days",
        updatedAt: new Date().toISOString(),
      },
      categoryDistribution: topProductsDistribution.map((row, idx) => ({
        name: row.label,
        population: Number(row.value),
        color: ["#0d5731", "#f6b51e", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899"][idx % 6],
        legendFontColor: "#7f7f7f",
        legendFontSize: 12
      })),
      recentOrders,
      topProducts,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    return res.status(500).json({ message: "Failed to load admin dashboard.", error: error.message });
  }
}

export async function getVendorDashboard(req, res) {
  const userId = Number(req.query.userId || 0);
  const email = String(req.query.email || "").trim();

  if (!userId && !email) {
    return res.status(400).json({ message: "userId or email is required." });
  }

  try {
    const users = await query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.shop_id,
         s.id AS linked_shop_id,
         s.name AS linked_shop_name,
         s.status AS linked_shop_status
       FROM users u
       LEFT JOIN shops s ON s.user_id = u.id
       WHERE ${userId ? "u.id = ?" : "u.email = ?"}
       LIMIT 1`,
      [userId || email]
    );

    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "Vendor account not found." });
    }

    let shopId = user.shop_id || user.linked_shop_id;
    let shopSource = "linked";

    if (!shopId) {
      const fallbackShops = await query(
        `SELECT id, name, status, delivery_charge, min_order_amount, created_at
         FROM shops
         ORDER BY id ASC
         LIMIT 1`
      );

      if (!fallbackShops.length) {
        return res.status(404).json({ message: "No shop data exists in the database yet." });
      }

      shopId = fallbackShops[0].id;
      shopSource = "fallback";
    }

    const [
      shopRows,
      productStatsRows,
      orderStatsRows,
      recentProducts,
      recentOrders,
    ] = await Promise.all([
      query(
        `SELECT id, name, status, delivery_charge, min_order_amount, created_at
         FROM shops
         WHERE id = ?
         LIMIT 1`,
        [shopId]
      ),
      query(
        `SELECT
           COUNT(*) AS totalProducts,
           SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS activeProducts,
           SUM(CASE WHEN quantity <= 5 THEN 1 ELSE 0 END) AS lowStockProducts
         FROM products
         WHERE shop_id = ?`,
        [shopId]
      ),
      query(
        `SELECT
           COUNT(*) AS totalOrders,
           COALESCE(SUM(payable_amount), 0) AS totalRevenue,
           SUM(CASE WHEN order_status IN ('Pending', 'Placed', 'Processing') THEN 1 ELSE 0 END) AS openOrders
         FROM orders
         WHERE shop_id = ?`,
        [shopId]
      ),
      query(
        `SELECT
           id,
           name,
           quantity,
           price,
           is_active,
           created_at
         FROM products
         WHERE shop_id = ?
         ORDER BY id DESC
         LIMIT 6`,
        [shopId]
      ),
      query(
        `SELECT
           id,
           order_code,
           order_status,
           payment_status,
           payable_amount,
           created_at
         FROM orders
         WHERE shop_id = ?
         ORDER BY id DESC
         LIMIT 6`,
        [shopId]
      ),
    ]);

    return res.json({
      shop: shopRows[0] ?? {
        id: shopId,
        name: user.linked_shop_name ?? "Vendor Shop",
        status: user.linked_shop_status ?? 0,
      },
      shopSource,
      metrics: [
        { label: "Products", value: String(productStatsRows[0]?.totalProducts ?? 0) },
        { label: "Active", value: String(productStatsRows[0]?.activeProducts ?? 0) },
        { label: "Low Stock", value: String(productStatsRows[0]?.lowStockProducts ?? 0) },
        { label: "Orders", value: String(orderStatsRows[0]?.totalOrders ?? 0) },
        { label: "Open Orders", value: String(orderStatsRows[0]?.openOrders ?? 0) },
        { label: "Revenue", value: `Rs ${toCurrency(orderStatsRows[0]?.totalRevenue).toLocaleString("en-IN")}` },
      ],
      recentProducts,
      recentOrders,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load vendor dashboard.", error: error.message });
  }
}
