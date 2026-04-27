import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const SECRET = process.env.JWT_SECRET || "supersecret";
const token = jwt.sign({ id: 1 }, SECRET);

const body = {
  items: [{ productId: 58, quantity: 1 }],
  paymentMethod: "cod",
  shippingAddress: {
    fullName: "Test User",
    phone: "1234567890",
    line1: "123 Test Street",
    city: "Test City",
    state: "Test State",
    postalCode: "123456"
  }
};

async function test() {
  console.log("Testing checkout start...");
  try {
    const res = await fetch("http://localhost:5000/api/orders/checkout/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch error:", err.message);
  }
}

test();
