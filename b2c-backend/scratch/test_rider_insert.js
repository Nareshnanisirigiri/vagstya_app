import { db } from './config/db.js';

const testData = {
  first_name: "Test",
  last_name: "Rider",
  phone: "1234567890",
  email: "test@rider.com",
  gender: "Male",
  driving_license: "XYZ123",
  password: "password123",
  dob: "05/12/1990", // Frontend format
  vehicle_type: "Bike",
  status: 1
};

// Simulate backend sanitization
const sanitize = (val, key) => {
  if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
    const [m, d, y] = val.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (val === "" && (key.includes("date") || key.includes("time") || key === "dob")) {
    return null;
  }
  return val;
};

const sanitizedData = {};
Object.keys(testData).forEach(k => sanitizedData[k] = sanitize(testData[k], k));

const keys = Object.keys(sanitizedData);
const values = Object.values(sanitizedData);
const placeholders = keys.map(() => "?").join(", ");
const sql = `INSERT INTO riders (\`${keys.join("`, `")}\`) VALUES (${placeholders})`;

db.query(sql, values, (err, res) => {
  if (err) {
    console.error("INSERT FAILED:");
    console.error(err);
  } else {
    console.log("INSERT SUCCESSFUL:", res.insertId);
  }
  process.exit();
});
