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

function notFound(res, message) {
  return res.status(404).json({ message });
}

export class AdController {
  async index(req, res) {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.max(Number(req.query.limit ?? 20), 1);
    const offset = (page - 1) * limit;

    try {
      const ads = await query(
        `SELECT a.id, a.title, a.media_id, a.status, a.created_at, a.updated_at, m.src AS media_src
         FROM ads a
         LEFT JOIN media m ON m.id = a.media_id
         ORDER BY a.id DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      const [{ total }] = await query("SELECT COUNT(*) AS total FROM ads");

      return res.json({
        data: ads,
        pagination: {
          page,
          limit,
          total
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch ads.", error: error.message });
    }
  }

  async create(req, res) {
    return res.json({
      message: "Use POST /api/admin/ads to create an ad.",
      fields: ["title", "media_id", "status"]
    });
  }

  async store(req, res) {
    const { title = null, media_id = null, status = 1 } = req.body;

    try {
      const result = await query(
        "INSERT INTO ads (title, media_id, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [title, media_id, Number(status) ? 1 : 0]
      );

      const [ad] = await query("SELECT * FROM ads WHERE id = ?", [result.insertId]);

      return res.status(201).json({
        message: "Ad created successfully.",
        data: ad
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to create ad.", error: error.message });
    }
  }

  async edit(req, res) {
    const { id } = req.params;

    try {
      const [ad] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      if (!ad) {
        return notFound(res, "Ad not found.");
      }

      return res.json({ data: ad });
    } catch (error) {
      return res.status(500).json({ message: "Failed to fetch ad.", error: error.message });
    }
  }

  async update(req, res) {
    const { id } = req.params;
    const { title = null, media_id = null, status = 1 } = req.body;

    try {
      const [existingAd] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      if (!existingAd) {
        return notFound(res, "Ad not found.");
      }

      await query(
        "UPDATE ads SET title = ?, media_id = ?, status = ?, updated_at = NOW() WHERE id = ?",
        [title, media_id, Number(status) ? 1 : 0, id]
      );

      const [updatedAd] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      return res.json({
        message: "Ad updated successfully.",
        data: updatedAd
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to update ad.", error: error.message });
    }
  }

  async statusToggle(req, res) {
    const { id } = req.params;

    try {
      const [ad] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      if (!ad) {
        return notFound(res, "Ad not found.");
      }

      const nextStatus = ad.status ? 0 : 1;

      await query("UPDATE ads SET status = ?, updated_at = NOW() WHERE id = ?", [nextStatus, id]);

      return res.json({
        message: "Ad status updated.",
        data: {
          id: Number(id),
          status: nextStatus
        }
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to toggle ad status.", error: error.message });
    }
  }

  async destroy(req, res) {
    const { id } = req.params;

    try {
      const [ad] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      if (!ad) {
        return notFound(res, "Ad not found.");
      }

      await query("DELETE FROM ads WHERE id = ?", [id]);

      return res.json({
        message: "Ad deleted successfully."
      });
    } catch (error) {
      return res.status(500).json({ message: "Failed to delete ad.", error: error.message });
    }
  }
}

export const adController = new AdController();
