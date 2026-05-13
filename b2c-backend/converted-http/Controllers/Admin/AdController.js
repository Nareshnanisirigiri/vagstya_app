import { db } from "../../../config/db.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      console.log(`[AdController] Found ${ads.length} ads. Total: ${total}`);

      return res.json({
        success: true,
        table: { name: "ads", count: total },
        columns: [
          { name: "id", dataType: "int" },
          { name: "thumbnail", dataType: "virtual" },
          { name: "title", dataType: "varchar" },
          { name: "status", dataType: "tinyint" },
          { name: "action", dataType: "virtual" }
        ],
        rows: ads,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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
    let { title = null, media_id = null, status = 1, image_url = null } = req.body;

    try {
      // Handle base64 image upload
      if (image_url && image_url.startsWith("data:")) {
        const matches = image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split('/')[1] || 'png';
          const base64Data = matches[2];
          const fileName = `ad_${Date.now()}.${extension}`;
          // Correct path: controller is in converted-http/Controllers/Admin/
          const uploadsDir = path.join(__dirname, '../../../uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const fullPath = path.join(uploadsDir, fileName);
          
          fs.writeFileSync(fullPath, base64Data, 'base64');
          const mediaPath = `uploads/${fileName}`;
          
          const mediaRes = await query("INSERT INTO media (src) VALUES (?)", [mediaPath]);
          media_id = mediaRes.insertId;
        }
      }

      console.log("[AdController] Creating ad with media_id:", media_id);
      const result = await query(
        "INSERT INTO ads (title, media_id, status, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [title, media_id, Number(status) ? 1 : 0]
      );
      console.log("[AdController] Ad created successfully, ID:", result.insertId);

      const [ad] = await query("SELECT * FROM ads WHERE id = ?", [result.insertId]);

      return res.status(201).json({
        success: true,
        message: "Ad created successfully.",
        data: ad
      });
    } catch (error) {
      console.error("Ad Store Error:", error);
      return res.status(500).json({ success: false, message: "Failed to create ad.", error: error.message });
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
    let { title = null, media_id = null, status = 1, image_url = null } = req.body;

    try {
      const [existingAd] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      if (!existingAd) {
        return notFound(res, "Ad not found.");
      }

      // Handle base64 image upload
      if (image_url && image_url.startsWith("data:")) {
        const matches = image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split('/')[1] || 'png';
          const base64Data = matches[2];
          const fileName = `ad_${Date.now()}.${extension}`;
          const uploadsDir = path.join(__dirname, '../../../uploads');
          if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
          const fullPath = path.join(uploadsDir, fileName);
          
          fs.writeFileSync(fullPath, base64Data, 'base64');
          const mediaPath = `uploads/${fileName}`;
          
          const mediaRes = await query("INSERT INTO media (src) VALUES (?)", [mediaPath]);
          media_id = mediaRes.insertId;
        }
      }

      await query(
        "UPDATE ads SET title = ?, media_id = IFNULL(?, media_id), status = ?, updated_at = NOW() WHERE id = ?",
        [title, media_id, Number(status) ? 1 : 0, id]
      );

      const [updatedAd] = await query("SELECT * FROM ads WHERE id = ?", [id]);

      return res.json({
        success: true,
        message: "Ad updated successfully.",
        data: updatedAd
      });
    } catch (error) {
      console.error("Ad Update Error:", error);
      return res.status(500).json({ success: false, message: "Failed to update ad.", error: error.message });
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
        success: true,
        message: "Ad status updated.",
        data: {
          id: Number(id),
          status: nextStatus
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to toggle ad status.", error: error.message });
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
        success: true,
        message: "Ad deleted successfully."
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to delete ad.", error: error.message });
    }
  }
}

export const adController = new AdController();
