import { db } from "../../../config/db.js";

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

export class CouponController {
  async index(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    try {
      const coupons = await query(
        `SELECT * FROM coupons ORDER BY id DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const [{ total }] = await query("SELECT COUNT(*) AS total FROM coupons");

      return res.json({
        success: true,
        table: { name: "coupons", count: total },
        columns: [
          { name: "id", label: "ID" },
          { name: "code", label: "Code" },
          { name: "discount", label: "Discount" },
          { name: "min_purchase", label: "Min Amount" },
          { name: "start_date", label: "Started At" },
          { name: "expire_date", label: "Expired At" },
          { name: "status", label: "Status" },
          { name: "action", label: "Action" }
        ],
        rows: coupons,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (err) {
      console.error("[CouponController] Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async store(req, res) {
    const { 
      code, 
      discount_type, 
      discount, 
      min_purchase, 
      max_discount, 
      limit_per_user, 
      start_date, 
      expire_date, 
      shop_ids 
    } = req.body;

    try {
      const result = await query(
        `INSERT INTO coupons (code, discount_type, discount, min_purchase, max_discount, limit_per_user, start_date, expire_date, shop_ids, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [code, discount_type, discount, min_purchase, max_discount, limit_per_user, start_date, expire_date, Array.isArray(shop_ids) ? shop_ids.join(',') : shop_ids]
      );

      return res.status(201).json({
        success: true,
        message: "Coupon created successfully",
        id: result.insertId
      });
    } catch (err) {
      console.error("[CouponController] Store Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { 
      code, 
      discount_type, 
      discount, 
      min_purchase, 
      max_discount, 
      limit_per_user, 
      start_date, 
      expire_date, 
      shop_ids 
    } = req.body;

    try {
      await query(
        `UPDATE coupons SET code = ?, discount_type = ?, discount = ?, min_purchase = ?, max_discount = ?, limit_per_user = ?, start_date = ?, expire_date = ?, shop_ids = ? 
         WHERE id = ?`,
        [code, discount_type, discount, min_purchase, max_discount, limit_per_user, start_date, expire_date, Array.isArray(shop_ids) ? shop_ids.join(',') : shop_ids, id]
      );

      return res.json({
        success: true,
        message: "Coupon updated successfully"
      });
    } catch (err) {
      console.error("[CouponController] Update Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async statusToggle(req, res) {
    const { id } = req.params;
    const { status } = req.body;

    try {
      await query("UPDATE coupons SET status = ? WHERE id = ?", [status, id]);
      return res.json({ success: true, message: "Status updated successfully" });
    } catch (err) {
      console.error("[CouponController] Status Toggle Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }

  async destroy(req, res) {
    const { id } = req.params;

    try {
      await query("DELETE FROM coupons WHERE id = ?", [id]);
      return res.json({ success: true, message: "Coupon deleted successfully" });
    } catch (err) {
      console.error("[CouponController] Destroy Error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
}

export const couponController = new CouponController();
