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

function toCurrency(value) {
  return Number(value || 0);
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
      topProductsDistribution,
    ] = await Promise.all([
      query("SELECT COUNT(*) AS total FROM users"),
      query("SELECT COUNT(*) AS total FROM products"),
      query(
        `SELECT COUNT(*) AS totalOrders, COALESCE(SUM(payable_amount), 0) AS totalRevenue
         FROM orders`
      ),
      query(
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
         LIMIT 6`
      ),
      query(
        `SELECT
           p.id,
           p.name,
           p.quantity,
           p.price,
           p.created_at
         FROM products p
         ORDER BY p.id DESC
         LIMIT 6`
      ),
      query(
        `SELECT 
            DATE_FORMAT(created_at, '%d %b') AS label,
            COALESCE(SUM(payable_amount), 0) AS revenue,
            COUNT(*) AS orders,
            (SELECT COUNT(*) FROM users u2 WHERE DATE(u2.created_at) = DATE(o.created_at)) AS users
         FROM orders o
         WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
         GROUP BY DATE(created_at)
         ORDER BY created_at ASC`
      ),
      query(
        `SELECT
           c.name AS label,
           COUNT(p.id) AS value
         FROM categories c
         LEFT JOIN product_categories pc ON pc.category_id = c.id
         LEFT JOIN products p ON p.id = pc.product_id
         GROUP BY c.id
         HAVING value > 0
         ORDER BY value DESC
         LIMIT 6`
      ),
    ]);

    return res.json({
      metrics: [
        { label: "Total Earnings", value: `Rs ${toCurrency(orderStatsRows[0]?.totalRevenue).toLocaleString("en-IN")}` },
        { label: "Total Products", value: String(productCountRows[0]?.total ?? 0) },
        { label: "Processed Orders", value: String(orderStatsRows[0]?.totalOrders ?? 0) },
        { label: "Active Users", value: String(userCountRows[0]?.total ?? 0) },
      ],
      analytics: {
        labels: dailyStats.map(s => s.label),
        datasets: {
          revenue: dailyStats.map(s => Number(s.revenue)),
          orders: dailyStats.map(s => Number(s.orders)),
          users: dailyStats.map(s => Number(s.users)),
        }
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
