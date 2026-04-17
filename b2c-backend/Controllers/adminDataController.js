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
  const tables = await getKnownTables();
  return tables.find((table) => table.tableName === tableName) ?? null;
}

export async function getCategories(req, res) {
  try {
    const categories = await query(
      `SELECT id, name, slug, is_active, created_at, updated_at
       FROM categories
       ORDER BY id DESC`
    );

    return res.json({ rows: categories });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load categories.", error: error.message });
  }
}

export async function getColors(req, res) {
  try {
    const colors = await query(
      `SELECT id, name, code, created_at, updated_at
       FROM colors
       ORDER BY id DESC`
    );

    return res.json({ rows: colors });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load colors.", error: error.message });
  }
}

export async function getSizes(req, res) {
  try {
    const sizes = await query(
      `SELECT id, name, size, created_at, updated_at
       FROM sizes
       ORDER BY id DESC`
    );

    return res.json({ rows: sizes });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load sizes.", error: error.message });
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
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 25;

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
    const rows = await query(`SELECT * FROM \`${tableName}\`${safeOrderColumn} LIMIT ${limit}`);

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
