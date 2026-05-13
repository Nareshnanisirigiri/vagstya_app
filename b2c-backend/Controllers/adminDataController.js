import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { db } from "../config/db.js";
import {
  APPROVED_COLOR_COLUMNS,
  getApprovedColorOrderClause,
  getApprovedColorOrderParams,
  synchronizeApprovedColors,
} from "../utils/colorCatalog.js";
import { synchronizeAllAdminData } from "../utils/adminDataSeeder.js";
import { INDIAN_STATES, GENDER_OPTIONS, ORDER_STATUS_CATALOG, HOME_SECTION_FILTERS } from "../utils/metadataCatalog.js";

export async function getMetadata(req, res) {
  try {
    let categories = [];
    try { categories = await query("SELECT id, name FROM categories"); } catch(e) { console.log("Metadata Note: categories table missing"); }
    
    let subCategories = [];
    try { subCategories = await query("SELECT id, name, category_id FROM sub_categories"); } catch(e) { console.log("Metadata Note: sub_categories table missing"); }
    
    let colors = [];
    try { colors = await query("SELECT id, name, color_code FROM colors"); } catch(e) { console.log("Metadata Note: colors table missing"); }
    
    let sizes = [];
    try { sizes = await query("SELECT id, name, size FROM sizes"); } catch(e) { console.log("Metadata Note: sizes table missing"); }

    let specifications = [];
    try { specifications = await query("SELECT id, name FROM specifications"); } catch(e) { console.log("Metadata Note: specifications table missing"); }

    let brands = [];
    try { brands = await query("SELECT id, name FROM brands WHERE is_active = 1"); } catch(e) { console.log("Metadata Note: brands table missing"); }

    let units = [];
    try { units = await query("SELECT id, name FROM units"); } catch(e) { console.log("Metadata Note: units table missing"); }

    let shops = [];
    try { shops = await query("SELECT id, name FROM shops"); } catch(e) { console.log("Metadata Note: shops table missing"); }

    return res.json({
      metadata: {
        states: INDIAN_STATES,
        genders: GENDER_OPTIONS,
        orderStatuses: ORDER_STATUS_CATALOG,
        homeFilters: HOME_SECTION_FILTERS,
        categories,
        subCategories,
        colors,
        sizes,
        specifications,
        brands,
        units,
        shops
      }
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load metadata.", error: error.message });
  }
}

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

async function getKnownTables() {
  const [dbResult] = await query("SELECT DATABASE() as dbName");
  const databaseName = dbResult?.dbName || process.env.DB_NAME || "sathyavogue_db";

  return query(
    `SELECT TABLE_NAME AS tableName, TABLE_ROWS AS tableRows, CREATE_TIME AS createdAt, UPDATE_TIME AS updatedAt
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME ASC`,
    [databaseName]
  );
}

async function assertTableExists(tableName) {
  if (tableName === "pos_drafts") {
    const createDraftsTable = `
    CREATE TABLE IF NOT EXISTS pos_drafts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer VARCHAR(255),
      total_products INT,
      subtotal DECIMAL(10,2),
      discount DECIMAL(10,2),
      total DECIMAL(10,2),
      items_json TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
    `;
    try {
      await query(createDraftsTable);
    } catch (e) {
      console.error("Failed to assert pos_drafts table:", e);
    }
    return { tableName: "pos_drafts" };
  }

  if (["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(tableName)) {
    const tables = await getKnownTables();
    const productTable = tables.find(t => t.tableName.toLowerCase() === "products");
    return productTable ? { ...productTable } : { tableName: "products", tableRows: 0 };
  }

  const tables = await getKnownTables();
  try {
    const fs = await import('fs');
    fs.writeFileSync('tables_debug.log', JSON.stringify(tables, null, 2));
  } catch(e) {}
  
  const exactMatch = tables.find(t => t.tableName.toLowerCase() === tableName.toLowerCase());
  if (exactMatch) return exactMatch;

  const normalizedRequested = tableName.toLowerCase().replace(/_/g, "");
  
  return tables.find((table) => {
    const tableInDb = table.tableName.toLowerCase().replace(/_/g, "");
    return tableInDb === normalizedRequested;
  }) ?? null;
}

export async function getCategories(req, res) {
  try {
    const categories = await query(
      `SELECT id, name, url_slug, status, image_url, created_at, updated_at
       FROM categories
       ORDER BY id ASC`
    );

    return res.json({ rows: categories });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load categories.", error: error.message });
  }
}

export async function getColors(req, res) {
  try {
    const colors = await query(
      `SELECT id, name, name_ar, shop_id, color_code, is_active, color_code AS code, is_active AS status, created_at, updated_at
       FROM colors
       ORDER BY ${getApprovedColorOrderClause()}`,
      getApprovedColorOrderParams()
    );

    return res.json({ columns: APPROVED_COLOR_COLUMNS, rows: colors });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load colors.", error: error.message });
  }
}

export async function getSizes(req, res) {
  try {
    const sizes = await query(
      `SELECT id, name, size, created_at, updated_at
       FROM sizes
       ORDER BY id ASC`
    );

    return res.json({ rows: sizes });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load sizes.", error: error.message });
  }
}

export async function getUnits(req, res) {
  try {
    const units = await query(
      `SELECT id, name, created_at, updated_at
       FROM units
       ORDER BY id ASC`
    );

    return res.json({ rows: units });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load units.", error: error.message });
  }
}

export async function getCustomers(req, res) {
  try {
    const users = await query(
      `SELECT id, name, email, phone, is_active, created_at, updated_at, auth_type
       FROM users
       ORDER BY id DESC`
    );

    return res.json({ rows: users });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load customers.", error: error.message });
  }
}

export async function getSqlTables(req, res) {
  try {
    const tables = await getKnownTables();

    return res.json({
      database: process.env.DB_NAME || "sathyavogue_db",
      tables: tables.map((table) => ({
        name: table.tableName,
        count: Number(table.tableRows) || 0,
        createdAt: table.createdAt,
        updatedAt: table.updatedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load SQL tables.", error: error.message });
  }
}

export async function getSqlTableContent(req, res) {
  const tableName = String(req.params.tableName || "").trim();
  const requestedLimit = Number(req.query.limit);
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(2000, requestedLimit)) : 500;

  if (!tableName) {
    return res.status(400).json({ message: "Table name is required." });
  }

  try {
    const matchingTable = await assertTableExists(tableName);

    if (!matchingTable) {
      return res.status(404).json({ message: `Table "${tableName}" was not found in the configured database.` });
    }

    const [dbResult] = await query("SELECT DATABASE() as dbName");
    const databaseName = dbResult?.dbName || process.env.DB_NAME || "sathyavogue_db";

    const actualTableName = matchingTable.tableName;
    const columns = await query(
      `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, COLUMN_KEY AS columnKey
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [databaseName, actualTableName]
    );

    const primaryColumn = columns.find((column) => column.columnKey === "PRI")?.name || columns[0]?.name;
    const safeOrderColumn = primaryColumn ? ` ORDER BY \`${primaryColumn}\` DESC` : "";
    // Parent tables we need for dropdowns
    const parentTables = ["categories", "shops", "sub_categories", "brands", "specifications"];
    
    let rows = [];
    try {
       if (actualTableName === "sub_categories") {
        rows = await query(`
          SELECT sc.*, c.name as category_name 
          FROM sub_categories sc 
          LEFT JOIN categories c ON sc.category_id = c.id 
          ORDER BY sc.id DESC 
          LIMIT ${limit}
        `);
      } else if (["item_requests", "update_requests", "accepted_items", "rejected_items"].includes(actualTableName)) {
        let statusFilter = "approved";
        let whereClause = "p.approval_status = ?";
        if (actualTableName === "item_requests") statusFilter = "pending_create";
        else if (actualTableName === "update_requests") statusFilter = "pending_update";
        else if (actualTableName === "rejected_items") statusFilter = "rejected";
        else if (actualTableName === "accepted_items") {
          whereClause = "(p.approval_status = 'approved' OR p.approval_status IS NULL)";
        }

        const shopIdVal = req.query.shop_id;
        let shopIdFilter = "";
        if (shopIdVal && shopIdVal !== 'all' && shopIdVal !== 'undefined') {
          if (String(shopIdVal) === "1") {
            shopIdFilter = `AND (p.shop_id = 1 OR p.shop_id IS NULL OR p.shop_id = 0)`;
          } else {
            shopIdFilter = `AND p.shop_id = ${Number(shopIdVal)}`;
          }
        }

        const finalQuery = `
          SELECT p.*, IFNULL(s.name, 'Vogue By Satyabhama') as shop_name, c.name as category_name, sc.name as sub_category_name
          FROM products p
          LEFT JOIN shops s ON p.shop_id = s.id
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id
          WHERE ${whereClause} ${shopIdFilter}
          ORDER BY p.id DESC
          LIMIT ${limit}
        `;
        
        rows = await query(finalQuery, actualTableName === "accepted_items" ? [] : [statusFilter]);
      } else if (actualTableName === "products") {
        const hasCategoryId = columns.some(c => c.name.toLowerCase() === "category_id");
        const hasSubCategoryId = columns.some(c => c.name.toLowerCase() === "sub_category_id");
        const hasMediaId = columns.some(c => c.name.toLowerCase() === "media_id");
        const hasBrandId = columns.some(c => c.name.toLowerCase() === "brand_id");
        const hasUnitId = columns.some(c => c.name.toLowerCase() === "unit_id");
        
        // Check if join tables exist
        const allTables = await getKnownTables();
        const tableNames = allTables.map(t => t.tableName.toLowerCase());
        const categoriesExist = tableNames.includes("categories");
        const subCategoriesExist = tableNames.includes("sub_categories");
        const mediaExist = tableNames.includes("media");
        const flashSaleExist = tableNames.includes("flash_sale_products");
        const brandsExist = tableNames.includes("brands");
        const unitsExist = tableNames.includes("units");

        let sql = "SELECT p.*";
        if (hasCategoryId && categoriesExist) sql += ", c.name as category_name";
        if (hasSubCategoryId && subCategoriesExist) sql += ", sc.name as sub_category_name";
        if (hasMediaId && mediaExist) sql += ", m.src as media_src";
        if (hasBrandId && brandsExist) sql += ", b.name as brand_name";
        if (hasUnitId && unitsExist) sql += ", u.name as unit_name";

        if (flashSaleExist) {
          sql += `, CASE WHEN fsp.product_id IS NOT NULL THEN 1 ELSE 0 END AS is_flash_sale,
                  fsp.price AS flash_sale_price,
                  fsp.discount AS flash_sale_discount,
                  fsp.quantity AS flash_sale_total_qty,
                  fsp.sale_quantity AS flash_sale_sold_qty`;
        }
        
        sql += " FROM products p";
        if (hasCategoryId && categoriesExist) sql += " LEFT JOIN categories c ON p.category_id = c.id";
        if (hasSubCategoryId && subCategoriesExist) sql += " LEFT JOIN sub_categories sc ON p.sub_category_id = sc.id";
        if (hasMediaId && mediaExist) sql += " LEFT JOIN media m ON p.media_id = m.id";
        if (hasBrandId && brandsExist) sql += " LEFT JOIN brands b ON p.brand_id = b.id";
        if (hasUnitId && unitsExist) sql += " LEFT JOIN units u ON p.unit_id = u.id";
        if (flashSaleExist) sql += " LEFT JOIN flash_sale_products fsp ON fsp.product_id = p.id";
        
        sql += ` ORDER BY p.id DESC LIMIT ${limit}`;
        
        rows = await query(sql);
      } else if (actualTableName === "specification_values" || actualTableName === "specificationvalues") {
        try {
          rows = await query(`
            SELECT sv.*, s.name as specification_name 
            FROM \`${actualTableName}\` sv
            LEFT JOIN specifications s ON sv.specification_id = s.id
            ${safeOrderColumn ? safeOrderColumn.replace("ORDER BY ", "ORDER BY sv.") : ""}
            LIMIT ${limit}
          `);
        } catch (joinError) {
          console.error("Join failed for specification_values, falling back:", joinError.message);
          rows = await query(`SELECT * FROM \`${actualTableName}\`${safeOrderColumn} LIMIT ${limit}`);
        }
      } else if (actualTableName === "shops") {
        rows = await query(`
          SELECT s.*, 
            (SELECT COUNT(*) FROM products p WHERE p.shop_id = s.id) as product_count,
            (SELECT COUNT(*) FROM orders o WHERE o.shop_id = s.id) as order_count
          FROM shops s
          ${safeOrderColumn ? safeOrderColumn.replace("ORDER BY ", "ORDER BY s.") : ""}
          LIMIT ${limit}
        `);
      } else if (actualTableName === "banners") {
        const allTables = await getKnownTables();
        const tableNames = allTables.map(t => t.tableName.toLowerCase());
        const mediaExist = tableNames.includes("media");
        
        let sql = "SELECT b.*";
        if (mediaExist) sql += ", m.src as media_src";
        sql += " FROM banners b";
        if (mediaExist) sql += " LEFT JOIN media m ON b.media_id = m.id";
        sql += ` ${safeOrderColumn ? safeOrderColumn.replace("ORDER BY ", "ORDER BY b.") : "ORDER BY b.id DESC"} LIMIT ${limit}`;
        
        rows = await query(sql);
      } else if (actualTableName === "users") {
        rows = await query(`
          SELECT * FROM \`${actualTableName}\` 
          ${safeOrderColumn}
          LIMIT ${limit}
        `);
      } else {
        rows = await query(`SELECT * FROM \`${actualTableName}\`${safeOrderColumn} LIMIT ${limit}`);
      }
    } catch (queryError) {
      console.error(`Query failed for table "${actualTableName}":`, queryError.message);
      // Return empty rows instead of 500 to keep UI stable
      rows = [];
    }

    return res.json({
      table: {
        name: matchingTable.tableName,
        count: Number(matchingTable.tableRows) || 0,
      },
      limit,
      columns,
      rows,
    });
  } catch (error) {
    return res.status(500).json({ message: `Failed to load content from table "${tableName}".`, error: error.message });
  }
}
export async function createRecord(req, res) {
  try { await query("SET SESSION max_allowed_packet=33554432"); } catch(e) {}
  const { tableName } = req.params;
  const data = req.body;

  if (!tableName || !data) {
    return res.status(400).json({ message: "Table name and data are required." });
  }

  try {
    const matchingTable = await assertTableExists(tableName);
    if (!matchingTable) return res.status(404).json({ message: `Table "${tableName}" not found.` });

    const actualTableName = matchingTable.tableName;

    // Banner specific handling for media_src mapping
    if (actualTableName === "banners" && data.image_url) {
      let mediaPath = data.image_url;
      if (data.image_url.startsWith("data:")) {
        const matches = data.image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split('/')[1] || 'png';
          const base64Data = matches[2];
          const fileName = `banner_${Date.now()}.${extension}`;
          const fullPath = path.join(__dirname, '../uploads', fileName);
          fs.writeFileSync(fullPath, base64Data, 'base64');
          mediaPath = `uploads/${fileName}`;
        }
      }
      data.media_src = mediaPath;
    }

    // Fetch actual columns to filter out extra fields from frontend
    const [dbResult] = await query("SELECT DATABASE() as dbName");
    const databaseName = dbResult?.dbName || process.env.DB_NAME || "sathyavogue_db";
    const dbColumns = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [databaseName, actualTableName]
    );
    const validColumns = dbColumns.map(c => c.COLUMN_NAME);

    // Filter and sanitize data
    const filteredData = {};
    for (const key of Object.keys(data)) {
      if (validColumns.includes(key) && key !== "id") {
        let val = data[key];

        // Automatic Media ID Handling: If table has media_id but we got image_url
        if (key === "image_url" && validColumns.includes("media_id") && !validColumns.includes("image_url") && val) {
          try {
            let mediaPath = val;
            
            // If it's a base64 string, save it as a physical file
            if (val.startsWith("data:")) {
              const matches = val.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const extension = matches[1].split('/')[1] || 'png';
                const base64Data = matches[2];
                const fileName = `media_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
                const fullPath = path.join(__dirname, '../uploads', fileName);
                
                fs.writeFileSync(fullPath, base64Data, 'base64');
                mediaPath = `uploads/${fileName}`;
              }
            }

            const mediaRes = await query("INSERT INTO media (src) VALUES (?)", [mediaPath]);
            filteredData["media_id"] = mediaRes.insertId;
            continue; // Skip the image_url field itself
          } catch (mediaErr) {
            console.error("Failed to auto-create media entry in createRecord:", mediaErr);
          }
        }
        
        // Convert mm/dd/yyyy to yyyy-mm-dd for MySQL DATE/DATETIME
        if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
          const [m, d, y] = val.split('/');
          val = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        
        // Handle empty strings for date/time fields
        if (val === "" && (key.includes("date") || key.includes("time") || key === "dob")) {
          val = null;
        }

        filteredData[key] = val;
      }
    }

    // Handle fallback category IDs from frontend (e.g., 'fb1')
    if (actualTableName === "sub_categories" || actualTableName === "products") {
      const fbNameMap = {
        'fb1': "Women's Wear", 'fb2': "saree", 'fb3': "men's Wear",
        'fb4': "Jewellery", 'fb5': "Fashion Accessories"
      };
      
      const cid = String(filteredData.category_id || "");
      if (cid.startsWith("fb")) {
        const targetName = fbNameMap[cid];
        if (targetName) {
          const rows = await query("SELECT id FROM categories WHERE name = ?", [targetName]);
          if (rows && rows.length > 0) {
            filteredData.category_id = rows[0].id;
          } else {
            // AUTO-CREATE: If category doesn't exist, create it so we can link to it
            const result = await query("INSERT INTO categories (name, shop_id, status) VALUES (?, 1, 1)", [targetName]);
            filteredData.category_id = result.insertId;
          }
        }
      }
    }

    // User Management Specifics
    if (actualTableName === "users" || actualTableName === "admin_users") {
      // 1. Default role to user if not specified
      if (!filteredData.role && actualTableName === "users") filteredData.role = "user";
      
      // 2. Hash password if provided
      if (filteredData.password) {
        filteredData.password = await bcrypt.hash(filteredData.password, 10);
      }
    }

    const keys = Object.keys(filteredData);
    const values = Object.values(filteredData);
    if (keys.length === 0) return res.status(400).json({ message: "No valid data to insert." });

    // Product Approval Workflow: New products start as pending
    if (actualTableName === "products" && validColumns.includes("approval_status")) {
      keys.push("approval_status");
      values.push("pending_create");
    }

    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO \`${actualTableName}\` (\`${keys.join("`, `")}\`) VALUES (${placeholders})`;

    await query(sql, values);
    return res.json({ success: true, message: "Record created successfully." });
  } catch (error) {
    console.error("Create Record Error:", error);
    try {
      const fs = await import('fs');
      fs.appendFileSync('create_error_debug.log', `[${new Date().toISOString()}] Table: ${tableName}, Error: ${error.message}, SQL: ${error.sql}\n`);
    } catch(e) {}
    return res.status(500).json({ message: `Failed to create record in "${tableName}".`, error: error.message });
  }
}

export async function updateRecord(req, res) {
  try { await query("SET SESSION max_allowed_packet=33554432"); } catch(e) {}
  const { tableName, id } = req.params;
  const data = req.body;

  if (!tableName || !id || !data) {
    return res.status(400).json({ message: "Table name, ID, and data are required." });
  }

  try {
    const matchingTable = await assertTableExists(tableName);
    if (!matchingTable) return res.status(404).json({ message: `Table "${tableName}" not found.` });

    const actualTableName = matchingTable.tableName;

    // Banner specific handling for media_src mapping
    if (actualTableName === "banners" && data.image_url) {
      let mediaPath = data.image_url;
      if (data.image_url.startsWith("data:")) {
        const matches = data.image_url.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const extension = matches[1].split('/')[1] || 'png';
          const base64Data = matches[2];
          const fileName = `banner_${Date.now()}.${extension}`;
          const fullPath = path.join(__dirname, '../uploads', fileName);
          fs.writeFileSync(fullPath, base64Data, 'base64');
          mediaPath = `uploads/${fileName}`;
        }
      }
      data.media_src = mediaPath;
    }

    // Fetch actual columns to filter out extra fields from frontend
    const [dbResult] = await query("SELECT DATABASE() as dbName");
    const databaseName = dbResult?.dbName || process.env.DB_NAME || "sathyavogue_db";
    const dbColumns = await query(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [databaseName, actualTableName]
    );
    const validColumns = dbColumns.map(c => c.COLUMN_NAME);

    // Filter and sanitize data
    const filteredData = {};
    const toSkip = ["id", "created_at", "updated_at", "deleted_at"];
    for (const key of Object.keys(data)) {
      if (validColumns.includes(key) && !toSkip.includes(key)) {
        let val = data[key];

        // Automatic Media ID Handling: If table has media_id but we got image_url
        if (key === "image_url" && validColumns.includes("media_id") && !validColumns.includes("image_url") && val) {
          try {
            let mediaPath = val;
            
            // If it's a base64 string, save it as a physical file
            if (val.startsWith("data:")) {
              const matches = val.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                const extension = matches[1].split('/')[1] || 'png';
                const base64Data = matches[2];
                const fileName = `media_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
                const fullPath = path.join(__dirname, '../uploads', fileName);
                
                fs.writeFileSync(fullPath, base64Data, 'base64');
                mediaPath = `uploads/${fileName}`;
              }
            }

            const mediaRes = await query("INSERT INTO media (src) VALUES (?)", [mediaPath]);
            filteredData["media_id"] = mediaRes.insertId;
            continue; // Skip the image_url field itself
          } catch (mediaErr) {
            console.error("Failed to auto-create media entry:", mediaErr);
          }
        }

        // Convert mm/dd/yyyy to yyyy-mm-dd for MySQL DATE/DATETIME
        if (typeof val === "string" && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
          const [m, d, y] = val.split('/');
          val = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
        
        // Handle empty strings for date/time fields
        if (val === "" && (key.includes("date") || key.includes("time") || key === "dob")) {
          val = null;
        }

        // User Management Specifics for Update
        if ((actualTableName === "users" || actualTableName === "admin_users") && key === "password") {
          if (!val) continue; // Skip password update if empty
          val = await bcrypt.hash(val, 10);
        }

        filteredData[key] = val;
      }
    }

    // Handle fallback category IDs from frontend (e.g., 'fb1')
    if (actualTableName === "sub_categories" || actualTableName === "products") {
      const fbNameMap = {
        'fb1': "Women's Wear", 'fb2': "saree", 'fb3': "men's Wear",
        'fb4': "Jewellery", 'fb5': "Fashion Accessories"
      };
      
      const cid = String(filteredData.category_id || "");
      if (cid.startsWith("fb")) {
        const targetName = fbNameMap[cid];
        if (targetName) {
          const rows = await query("SELECT id FROM categories WHERE name = ?", [targetName]);
          if (rows && rows.length > 0) {
            filteredData.category_id = rows[0].id;
          } else {
            // AUTO-CREATE: If category doesn't exist, create it so we can link to it
            const result = await query("INSERT INTO categories (name, shop_id, status) VALUES (?, 1, 1)", [targetName]);
            filteredData.category_id = result.insertId;
          }
        }
      }
    }

    const keys = Object.keys(filteredData);
    const values = Object.values(filteredData);
    if (keys.length === 0) return res.status(400).json({ message: "No valid data to update." });

    // Product Approval Workflow: Updates move back to pending review
    if (actualTableName === "products" && validColumns.includes("approval_status")) {
      const [current] = await query("SELECT approval_status FROM products WHERE id = ?", [id]);
      if (current && (current.approval_status === "approved" || current.approval_status === null)) {
        // Store updates in pending_data instead of applying them immediately
        const sql = "UPDATE products SET approval_status = 'pending_update', pending_data = ? WHERE id = ?";
        await query(sql, [JSON.stringify(filteredData), id]);
        return res.json({ success: true, message: "Update submitted for approval." });
      }
    }

    const setClause = keys.map(key => `\`${key}\` = ?`).join(", ");
    const sql = `UPDATE \`${actualTableName}\` SET ${setClause} WHERE id = ?`;

    await query(sql, [...values, id]);
    return res.json({ success: true, message: "Record updated successfully." });
  } catch (error) {
    console.error("Update Record Error:", error);
    try {
      const fs = await import('fs');
      fs.appendFileSync('update_error_debug.log', `[${new Date().toISOString()}] Table: ${tableName}, Error: ${error.message}, SQL: ${error.sql}\n`);
    } catch(e) {}
    return res.status(500).json({ message: `Failed to update record in "${tableName}".`, error: error.message });
  }
}

export async function deleteRecord(req, res) {
  const { tableName, id } = req.params;

  if (!tableName || !id) {
    return res.status(400).json({ message: "Table name and ID are required." });
  }

  try {
    const matchingTable = await assertTableExists(tableName);
    if (!matchingTable) return res.status(404).json({ message: `Table "${tableName}" not found.` });

    const sql = `DELETE FROM \`${matchingTable.tableName}\` WHERE id = ?`;
    await query(sql, [id]);
    return res.json({ success: true, message: "Record deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: `Failed to delete record from "${tableName}".`, error: error.message });
  }
}

export async function handleProductAction(req, res) {
  const { productId, action } = req.body; // action: 'accept', 'reject'
  try {
    const [product] = await query("SELECT * FROM products WHERE id = ?", [productId]);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (action === "accept") {
      if (product.approval_status === "pending_update" && product.pending_data) {
        const newData = typeof product.pending_data === "string" ? JSON.parse(product.pending_data) : product.pending_data;
        const keys = Object.keys(newData);
        if (keys.length > 0) {
          const setClause = keys.map(k => `\`${k}\` = ?`).join(", ");
          await query(`UPDATE products SET ${setClause}, approval_status = 'approved', is_active = 1, pending_data = NULL WHERE id = ?`, [...Object.values(newData), productId]);
        } else {
          await query("UPDATE products SET approval_status = 'approved', is_active = 1, pending_data = NULL WHERE id = ?", [productId]);
        }
      } else {
        await query("UPDATE products SET approval_status = 'approved', is_active = 1 WHERE id = ?", [productId]);
      }
    } else if (action === "reject") {
      await query("UPDATE products SET approval_status = 'rejected', is_active = 0 WHERE id = ?", [productId]);
    }

    return res.json({ success: true, message: `Product ${action}ed successfully.` });
  } catch (error) {
    console.error("Product Action Error:", error);
    return res.status(500).json({ message: "Action failed", error: error.message });
  }
}

export async function seedAdminData(req, res) {
  try {
    const result = await synchronizeAllAdminData(query);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to seed admin data.", error: error.message });
  }
}
