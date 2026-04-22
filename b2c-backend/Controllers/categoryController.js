import { query } from "../utils/db.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await query('SELECT id, name, type, image_url, url_slug FROM categories WHERE status = 1');
    res.json(categories);
  } catch (err) {
    console.error("Failed to load categories:", err);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};
