import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || "supersecret");
const API_BASE = "https://vagstya-app.onrender.com/api";

const COLORS_TO_ADD = [
  { name: "Aquamarine", color_code: "#7FFFD4" },
  { name: "Black", color_code: "#000000" },
  { name: "Black", color_code: "#000000" },
  { name: "Blue", color_code: "#0000FF" },
  { name: "Brown", color_code: "#A52A2A" },
  { name: "Cyan", color_code: "#00FFFF" },
  { name: "Dark Blue", color_code: "#00008B" },
  { name: "Gold", color_code: "#FFD700" },
  { name: "Green", color_code: "#008000" },
  { name: "Grey", color_code: "#808080" },
  { name: "IndianRed", color_code: "#CD5C5C" },
  { name: "Light Blue", color_code: "#ADD8E6" },
  { name: "Light Pink", color_code: "#FFB6C1" },
  { name: "Lime", color_code: "#00FF00" },
  { name: "Magenta", color_code: "#FF00FF" },
  { name: "Maroon", color_code: "#800000" },
  { name: "Mehendi", color_code: "#557054" },
  { name: "Multi Colour", color_code: "transparent" },
  { name: "Navy", color_code: "#000080" },
  { name: "Nickel", color_code: "#727472" },
];

async function addColors() {
  console.log("Fetching existing colors...");
  try {
    const getRes = await fetch(`${API_BASE}/admin/data/tables/colors`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const existingData = await getRes.json();
    const existingNames = new Set((existingData.rows || []).map(r => r.name));

    for (const color of COLORS_TO_ADD) {
      if (existingNames.has(color.name)) {
        console.log(`Color "${color.name}" already exists. Skipping.`);
        continue;
      }

      console.log(`Adding color: ${color.name}...`);
      const postRes = await fetch(`${API_BASE}/admin/data/tables/colors`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ...color, is_active: 1 })
      });
      
      const resData = await postRes.json();
      console.log(`Response for ${color.name}:`, resData.message || resData);
    }

    console.log("All colors processed.");
  } catch (err) {
    console.error("Operation failed:", err.message);
  }
}

addColors();
