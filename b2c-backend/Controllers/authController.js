import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../config/db.js";

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

function signAuthToken(user) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role || user.auth_type || "customer" },
    process.env.JWT_SECRET,
    {
      expiresIn: "2h",
    }
  );

  return { token, expiresAt };
}

function createAuthResponse({ tokenData, message, user }) {
  return {
    message,
    token: tokenData.token,
    expiresAt: tokenData.expiresAt,
    user,
  };
}

function normalizeUser(role, user, extra = {}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role,
    ...extra,
  };
}

async function findPortalUser(email) {
  const users = await query(
    `
      SELECT users.*, shops.id AS linked_shop_id, shops.name AS linked_shop_name
      FROM users
      LEFT JOIN shops ON shops.user_id = users.id
      WHERE users.email = ?
      LIMIT 1
    `,
    [email]
  );

  return users[0];
}

function isAdminUser(user) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (adminEmail && user.email?.toLowerCase() === adminEmail) {
    return true;
  }

  return Number(user.id) === 1 || user.auth_type === "admin";
}

function isVendorUser(user) {
  return Boolean(user.shop_id || user.linked_shop_id || user.auth_type === "vendor");
}

async function ensureAdminUsersTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
}

function normalizeAdminUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: "admin",
  };
}

async function findAdminUser(email) {
  await ensureAdminUsersTable();
  const users = await query("SELECT * FROM admin_users WHERE email = ? LIMIT 1", [email]);
  return users[0];
}

export async function adminRegister(req, res) {
  const { name, email, password, passcode, phone = null } = req.body;
  const expectedPasscode = String(process.env.ADMIN_REGISTRATION_PASSCODE || process.env.PORTAL_ONE_PASS_CODE || "").trim();

  if (!name || !email || !password || !passcode) {
    return res.status(400).json({ message: "name, email, password, and passcode are required." });
  }

  if (!expectedPasscode) {
    return res.status(500).json({ message: "Admin registration passcode is not configured." });
  }

  if (String(passcode).trim() !== expectedPasscode) {
    return res.status(403).json({ message: "Invalid admin registration passcode." });
  }

  try {
    await ensureAdminUsersTable();
    const existingUsers = await query("SELECT id FROM admin_users WHERE email = ?", [email]);

    if (existingUsers.length) {
      return res.status(409).json({ message: "Admin already exists." });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await query(
      "INSERT INTO admin_users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, phone]
    );

    const adminUser = { id: result.insertId, name, email, phone, role: "admin" };
    const tokenData = signAuthToken(adminUser);

    return res.status(201).json(
      createAuthResponse({
        tokenData,
        message: "Admin account created successfully.",
        user: normalizeAdminUser(adminUser),
      })
    );
  } catch (error) {
    console.error("ADMIN REGISTER ERROR:", error);
    return res.status(500).json({ message: "Admin registration failed.", error: error.message });
  }
}

export async function adminLogin(req, res) {
  const { email, password, passkey } = req.body;
  const secret = passkey ?? password;

  if (!email || !secret) {
    return res.status(400).json({ message: "email and password are required." });
  }

  try {
    const user = await findAdminUser(email);

    if (!user) {
      return res.status(404).json({ message: "Admin user not found." });
    }

    const isValidPassword = bcrypt.compareSync(secret, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const tokenData = signAuthToken({ ...user, role: "admin" });

    return res.json(
      createAuthResponse({
        tokenData,
        message: "Admin login successful.",
        user: normalizeAdminUser(user),
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Admin login failed.", error: error.message });
  }
}

export async function portalRegister(req, res) {
  const { role, name, email, password, passkey, onePassCode, phone = null } = req.body;
  const normalizedRole = String(role || "").trim().toLowerCase();
  const secret = passkey ?? password;
  const expectedOnePassCode = process.env.PORTAL_ONE_PASS_CODE?.trim();

  if (!["admin", "vendor"].includes(normalizedRole)) {
    return res.status(400).json({ message: "role must be either admin or vendor." });
  }

  if (!name || !email || !secret || !onePassCode) {
    return res.status(400).json({ message: "role, name, email, passkey, and one pass code are required." });
  }

  if (!expectedOnePassCode) {
    return res.status(500).json({ message: "Portal one pass code is not configured on the server." });
  }

  if (String(onePassCode).trim() !== expectedOnePassCode) {
    return res.status(403).json({ message: "Invalid one pass code." });
  }

  try {
    const existingUsers = await query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUsers.length) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = bcrypt.hashSync(secret, 10);
    const result = await query(
      "INSERT INTO users (name, email, password, phone, auth_type) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, phone, normalizedRole]
    );

    const createdUser = {
      id: result.insertId,
      name,
      email,
      phone,
      auth_type: normalizedRole,
    };

    const tokenData = signAuthToken({ ...createdUser, role: normalizedRole });

    return res.status(201).json(
      createAuthResponse({
        tokenData,
        message: `${normalizedRole === "admin" ? "Admin" : "Vendor"} account created successfully.`,
        user: normalizeUser(normalizedRole, createdUser),
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Portal registration failed.", error: error.message });
  }
}

export async function register(req, res) {
  const { name, email, password, passkey, phone = null } = req.body;
  const secret = passkey ?? password;

  if (!name || !email || !secret) {
    return res.status(400).json({ message: "name, email, and passkey are required." });
  }

  try {
    const existingUsers = await query("SELECT id FROM users WHERE email = ?", [email]);

    if (existingUsers.length) {
      return res.status(409).json({ message: "User already exists." });
    }

    const hashedPassword = bcrypt.hashSync(secret, 10);
    const result = await query(
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, phone]
    );

    const tokenData = signAuthToken({ id: result.insertId, email, role: "customer" });

    return res.status(201).json(
      createAuthResponse({
        tokenData,
        message: "User registered successfully.",
        user: {
          id: result.insertId,
          name,
          email,
          phone,
          role: "customer",
        },
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
}

export async function login(req, res) {
  const { email, password, passkey } = req.body;
  const secret = passkey ?? password;

  if (!email || !secret) {
    return res.status(400).json({ message: "email and passkey are required." });
  }

  try {
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isValidPassword = bcrypt.compareSync(secret, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const tokenData = signAuthToken({ ...user, role: "customer" });

    return res.json(
      createAuthResponse({
        tokenData,
        message: "Login successful.",
        user: normalizeUser("customer", user),
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
}

export async function portalLogin(req, res) {
  const { role, email, password, passkey } = req.body;
  const secret = passkey ?? password;
  const normalizedRole = String(role || "").trim().toLowerCase();

  if (!normalizedRole || !email || !secret) {
    return res.status(400).json({ message: "role, email, and passkey are required." });
  }

  if (!["admin", "vendor"].includes(normalizedRole)) {
    return res.status(400).json({ message: "role must be either admin or vendor." });
  }

  try {
    const user = await findPortalUser(email);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isValidPassword = bcrypt.compareSync(secret, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ message: "Invalid password." });
    }

    if (normalizedRole === "admin" && !isAdminUser(user)) {
      return res.status(403).json({ message: "This account is not allowed in the admin panel." });
    }

    if (normalizedRole === "vendor" && !isVendorUser(user)) {
      return res.status(403).json({ message: "This account is not allowed in the vendor panel." });
    }

    const tokenData = signAuthToken({ ...user, role: normalizedRole });

    return res.json(
      createAuthResponse({
        tokenData,
        message: `${normalizedRole === "admin" ? "Admin" : "Vendor"} login successful.`,
        user: normalizeUser(normalizedRole, user, {
          shopId: user.shop_id || user.linked_shop_id || null,
          shopName: user.linked_shop_name || null,
        }),
      })
    );
  } catch (error) {
    return res.status(500).json({ message: "Portal login failed.", error: error.message });
  }
}
