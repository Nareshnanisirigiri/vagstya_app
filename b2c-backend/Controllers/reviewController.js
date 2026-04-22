import { db } from "../config/db.js";

// Helper to run queries
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

// Create a review
export async function createReview(req, res) {
  if (!req.user?.id) {
    return res.status(401).json({ message: "Please log in to submit a review." });
  }

  const { productId, rating, title, comment } = req.body;

  if (!productId || !rating) {
    return res.status(400).json({ message: "Product ID and Rating are required." });
  }

  try {
    const userId = req.user.id;
    
    // Check if user already reviewed this product (optional, but good practice)
    const existing = await query(
      "SELECT id FROM product_reviews WHERE product_id = ? AND user_id = ? LIMIT 1",
      [productId, userId]
    );

    if (existing.length > 0) {
      // Update existing review
      await query(
        "UPDATE product_reviews SET rating = ?, title = ?, comment = ?, updated_at = NOW() WHERE id = ?",
        [rating, title, comment, existing[0].id]
      );
      return res.json({ message: "Review updated successfully." });
    }

    // Insert new review
    await query(
      "INSERT INTO product_reviews (product_id, user_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)",
      [productId, userId, rating, title, comment]
    );

    return res.status(201).json({ message: "Review submitted successfully." });
  } catch (error) {
    console.error("Create Review Error:", error);
    return res.status(500).json({ message: "Could not submit review.", error: error.message });
  }
}

// Get reviews for a product
export async function getProductReviews(req, res) {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({ message: "Product ID is required." });
  }

  try {
    const reviews = await query(
      `SELECT r.*, u.name as user_name 
       FROM product_reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.product_id = ? AND r.is_active = 1
       ORDER BY r.created_at DESC`,
      [productId]
    );

    return res.json({ reviews });
  } catch (error) {
    console.error("Get Product Reviews Error:", error);
    return res.status(500).json({ message: "Could not fetch reviews.", error: error.message });
  }
}

// Get all reviews (Admin)
export async function getAllReviews(req, res) {
  try {
    const reviews = await query(
      `SELECT r.*, u.name as user_name, p.name as product_name
       FROM product_reviews r
       JOIN users u ON u.id = r.user_id
       JOIN products p ON p.id = r.product_id
       ORDER BY r.created_at DESC`
    );

    return res.json({ reviews });
  } catch (error) {
    console.error("Get All Reviews Error:", error);
    return res.status(500).json({ message: "Could not fetch reviews.", error: error.message });
  }
}

// Delete review (Admin)
export async function deleteReview(req, res) {
  const { id } = req.params;

  try {
    await query("DELETE FROM product_reviews WHERE id = ?", [id]);
    return res.json({ message: "Review deleted successfully." });
  } catch (error) {
    console.error("Delete Review Error:", error);
    return res.status(500).json({ message: "Could not delete review.", error: error.message });
  }
}
