export const APPROVED_COLOR_CATALOG = [
  { name: "Aquamarine", colorCode: "#7FFFD4" },
  { name: "Black", colorCode: "#000000" },
  { name: "Black", colorCode: "#000000" },
  { name: "Blue", colorCode: "#0000FF" },
  { name: "Brown", colorCode: "#A52A2A" },
  { name: "Cyan", colorCode: "#00FFFF" },
  { name: "Dark Blue", colorCode: "#00008B" },
  { name: "Gold", colorCode: "#FFD700" },
  { name: "Green", colorCode: "#008000" },
  { name: "Grey", colorCode: "#808080" },
  { name: "IndianRed", colorCode: "#CD5C5C" },
  { name: "Light Blue", colorCode: "#ADD8E6" },
  { name: "Light Pink", colorCode: "#FFB6C1" },
  { name: "Lime", colorCode: "#00FF00" },
  { name: "Magenta", colorCode: "#FF00FF" },
  { name: "Maroon", colorCode: "#800000" },
  { name: "Mehendi", colorCode: "#557054" },
  { name: "Multi Colour", colorCode: "transparent" },
  { name: "Navy", colorCode: "#000080" },
  { name: "Nickel", colorCode: "#727472" },
];

export const APPROVED_COLOR_COLUMNS = [
  { name: "id", dataType: "int" },
  { name: "name", dataType: "varchar" },
  { name: "name_ar", dataType: "varchar" },
  { name: "shop_id", dataType: "int" },
  { name: "color_code", dataType: "varchar" },
  { name: "is_active", dataType: "tinyint" },
  { name: "created_at", dataType: "timestamp" },
  { name: "updated_at", dataType: "timestamp" },
];

const approvedColorNames = APPROVED_COLOR_CATALOG.map((color) => color.name);

function normalizeColorCode(colorCode) {
  return String(colorCode || "").trim().toLowerCase();
}

export async function synchronizeApprovedColors(query) {
  for (const approvedColor of APPROVED_COLOR_CATALOG) {
    try {
      const [existing] = await query(
        `SELECT id FROM colors WHERE name = ? LIMIT 1`,
        [approvedColor.name]
      );

      if (existing) {
        // Force update existing color to match catalog and set active
        await query(
          `UPDATE colors 
           SET color_code = ?, is_active = 1, shop_id = 1
           WHERE id = ?`,
          [approvedColor.colorCode, existing.id]
        );
      } else {
        // Insert new approved color with all standard columns to avoid constraint issues
        await query(
          `INSERT INTO colors (name, name_ar, color_code, is_active, shop_id)
           VALUES (?, NULL, ?, 1, 1)`,
          [approvedColor.name, approvedColor.colorCode]
        );
      }
    } catch (err) {
      console.log(`Failed to sync color ${approvedColor.name}:`, err.message);
    }
  }
}

export function getApprovedColorOrderClause() {
  return `FIELD(name, ${approvedColorNames.map(() => "?").join(", ")}) ASC, id ASC`;
}

export function getApprovedColorOrderParams() {
  return [...approvedColorNames];
}
