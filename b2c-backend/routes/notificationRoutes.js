import { Router } from "express";
import { db } from "../config/db.js";
import { verifyToken, attachUserIfToken } from "../middleware/auth.js";

export const notificationRoutes = Router();

// Get all notifications (Broadcast + User specific)
notificationRoutes.get("/", attachUserIfToken, (req, res) => {
  const userId = req.user?.id || null;
  const sql = "SELECT * FROM notifications WHERE user_id IS NULL OR user_id = ? ORDER BY created_at DESC LIMIT 50";
  
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json(results);
  });
});

// Mark all as read
notificationRoutes.post("/read-all", verifyToken, (req, res) => {
  const userId = req.user.id;
  const sql = "UPDATE notifications SET is_read = 1 WHERE user_id = ? OR (user_id IS NULL AND is_read = 0)";
  
  db.query(sql, [userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: "Marked all as read" });
  });
});

// Delete a notification
notificationRoutes.delete("/:id", verifyToken, (req, res) => {
  const userId = req.user.id;
  const notifId = req.params.id;
  const sql = "DELETE FROM notifications WHERE id = ? AND (user_id = ? OR user_id IS NULL)";
  
  db.query(sql, [notifId, userId], (err) => {
    if (err) return res.status(500).json({ success: false, message: err.message });
    res.json({ success: true, message: "Notification deleted" });
  });
});
