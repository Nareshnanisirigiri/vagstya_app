import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
console.log(jwt.sign({ id: 1 }, process.env.JWT_SECRET || "supersecret"));
