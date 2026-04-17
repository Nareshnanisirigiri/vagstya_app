import { db } from "../config/db.js";

export const addToCart = (req, res) => {
  const { product_id, quantity } = req.body;
  const user_id = req.user.id;

  db.query(
    "INSERT INTO cart (user_id,product_id,quantity) VALUES (?,?,?)",
    [user_id, product_id, quantity],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json("Added to cart");
    }
  );
};

export const getCart = (req, res) => {
  const user_id = req.user.id;

  db.query(
    "SELECT * FROM cart WHERE user_id=?",
    [user_id],
    (err, data) => {
      if (err) return res.status(500).json(err);
      res.json(data);
    }
  );
};