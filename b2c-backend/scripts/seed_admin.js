/**
 * seed_admin.js
 * Run with: node scripts/seed_admin.js
 *
 * Creates the admin_users table if missing, then UPSERTS an admin record
 * for nareshcherry317@gmail.com with the hashed password "12345678".
 */

import bcrypt from "bcryptjs";
import { db } from "../config/db.js";

const ADMIN_NAME  = "Naresh";
const ADMIN_EMAIL = "nareshcherry317@gmail.com";
const ADMIN_PASS  = "12345678";
const ADMIN_PHONE = null;

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

async function run() {
  console.log("─────────────────────────────────────");
  console.log("  Vogstya Admin Seeder");
  console.log("─────────────────────────────────────");

  // 1. Ensure table exists
  await query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id         INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(191) NOT NULL,
      email      VARCHAR(191) NOT NULL UNIQUE,
      password   VARCHAR(255) NOT NULL,
      phone      VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ admin_users table ready.");

  // 2. Hash the password
  const hashedPassword = bcrypt.hashSync(ADMIN_PASS, 10);

  // 3. UPSERT – insert or update password/name if email already exists
  const existing = await query(
    "SELECT id FROM admin_users WHERE email = ? LIMIT 1",
    [ADMIN_EMAIL]
  );

  if (existing.length > 0) {
    await query(
      "UPDATE admin_users SET name = ?, password = ?, phone = ? WHERE email = ?",
      [ADMIN_NAME, hashedPassword, ADMIN_PHONE, ADMIN_EMAIL]
    );
    console.log(`✅ Admin user UPDATED  → ${ADMIN_EMAIL}`);
  } else {
    await query(
      "INSERT INTO admin_users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [ADMIN_NAME, ADMIN_EMAIL, hashedPassword, ADMIN_PHONE]
    );
    console.log(`✅ Admin user CREATED  → ${ADMIN_EMAIL}`);
  }

  console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Password : ${ADMIN_PASS}  (stored hashed)`);
  console.log("─────────────────────────────────────");
  console.log("Done! You can now log in to the Admin Panel.");

  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
