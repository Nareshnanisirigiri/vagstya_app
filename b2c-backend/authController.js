import { db } from "./config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ✅ REGISTER
export const register = (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hash = bcrypt.hashSync(password, 10);

    db.query(
      "INSERT INTO users (name,email,password) VALUES (?,?,?)",
      [name, email, hash],
      (err) => {
        if (err) {
          console.log("DB ERROR:", err);
          return res.status(500).json(err);
        }

        res.json("User registered successfully");
      }
    );
  } catch (error) {
    console.log("REGISTER ERROR:", error);
    res.status(500).json("Server error");
  }
};

// ✅ LOGIN
export const login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email=?",
    [email],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.length === 0)
        return res.status(404).json("User not found");

      const valid = bcrypt.compareSync(password, result[0].password);

      if (!valid) return res.status(400).json("Wrong password");

      const token = jwt.sign(
        { id: result[0].id },
        process.env.JWT_SECRET
      );

      res.json({ token });
    }
  );
};