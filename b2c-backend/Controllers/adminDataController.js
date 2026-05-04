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
    return res.json({
      states: INDIAN_STATES,
      genders: GENDER_OPTIONS,
      orderStatuses: ORDER_STATUS_CATALOG,
      homeFilters: HOME_SECTION_FILTERS,
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
  const databaseName = process.env.DB_NAME || "sathyavogue_db";

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

  const tables = await getKnownTables();
  return tables.find((table) => table.tableName === tableName) ?? null;
}

export async function getCategories(req, res) {
  try {
    const categories = await query(
      `SELECT id, name, url_slug as slug, status as is_active, image_url, created_at, updated_at
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
    await synchronizeApprovedColors(query);

    const colors = await query(
      `SELECT id, name, name_ar, shop_id, color_code, is_active, color_code AS code, is_active AS status, created_at, updated_at
       FROM colors
       WHERE is_active = 1
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
      `SELECT id, name, size, is_active, created_at, updated_at
       FROM sizes
       WHERE is_active = 1
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
      `SELECT id, name, is_active, created_at, updated_at
       FROM units
       WHERE is_active = 1
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

    const columns = await query(
      `SELECT COLUMN_NAME AS name, DATA_TYPE AS dataType, COLUMN_KEY AS columnKey
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION ASC`,
      [process.env.DB_NAME || "sathyavogue_db", tableName]
    );

    const primaryColumn = columns.find((column) => column.columnKey === "PRI")?.name || columns[0]?.name;
    const safeOrderColumn = primaryColumn ? ` ORDER BY \`${primaryColumn}\` DESC` : "";
    
    let rows = [];
    try {
      if (tableName === "sub_categories") {
        rows = await query(`
          SELECT sc.*, c.name as category_name 
          FROM sub_categories sc 
          LEFT JOIN categories c ON sc.category_id = c.id 
          ORDER BY sc.id DESC 
          LIMIT ${limit}
        `);
      } else {
        rows = await query(`SELECT * FROM \`${tableName}\`${safeOrderColumn} LIMIT ${limit}`);
      }
    } catch (queryError) {
      console.error(`Query failed for table "${tableName}":`, queryError.message);
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
  const { tableName } = req.params;
  const data = req.body;

  if (!tableName || !data) {
    return res.status(400).json({ message: "Table name and data are required." });
  }

  try {
    const matchingTable = await assertTableExists(tableName);
    if (!matchingTable) return res.status(404).json({ message: `Table "${tableName}" not found.` });

    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => "?").join(", ");
    const sql = `INSERT INTO \`${tableName}\` (\`${keys.join("`, `")}\`) VALUES (${placeholders})`;

    await query(sql, values);
    return res.json({ success: true, message: "Record created successfully." });
  } catch (error) {
    return res.status(500).json({ message: `Failed to create record in "${tableName}".`, error: error.message });
  }
}

export async function updateRecord(req, res) {
  const { tableName, id } = req.params;
  const data = req.body;

  if (!tableName || !id || !data) {
    return res.status(400).json({ message: "Table name, ID, and data are required." });
  }

  try {
    const matchingTable = await assertTableExists(tableName);
    if (!matchingTable) return res.status(404).json({ message: `Table "${tableName}" not found.` });

    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `\`${key}\` = ?`).join(", ");
    const sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`;

    await query(sql, [...values, id]);
    return res.json({ success: true, message: "Record updated successfully." });
  } catch (error) {
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

    const sql = `DELETE FROM \`${tableName}\` WHERE id = ?`;
    await query(sql, [id]);
    return res.json({ success: true, message: "Record deleted successfully." });
  } catch (error) {
    return res.status(500).json({ message: `Failed to delete record from "${tableName}".`, error: error.message });
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
