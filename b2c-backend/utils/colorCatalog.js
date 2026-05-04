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
  { name: "Olive", colorCode: "#808000" },
  { name: "Orange", colorCode: "#FFA500" },
  { name: "PINK", colorCode: "#FFC0CB" },
  { name: "Purple", colorCode: "#800080" },
  { name: "Red", colorCode: "#FF0000" },
  { name: "Rose gold", colorCode: "#B76E79" },
  { name: "Silver", colorCode: "#C0C0C0" },
  { name: "Teal", colorCode: "#008080" },
  { name: "White", colorCode: "#FFFFFF" },
  { name: "Yellow", colorCode: "#FFFF00" },
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
  const existingRows = await query(
    `SELECT id, name, color_code, is_active
     FROM colors
     ORDER BY id ASC`
  );

  // Deactivate all colors first to ensure only the catalog items are active
  await query(`UPDATE colors SET is_active = 0`);

  const rowsByName = new Map();
  for (const row of existingRows) {
    const bucket = rowsByName.get(row.name) || [];
    bucket.push(row);
    rowsByName.set(row.name, bucket);
  }

  for (const approvedColor of APPROVED_COLOR_CATALOG) {
    const sameNameRows = rowsByName.get(approvedColor.name) || [];
    const matchingRow = sameNameRows.shift();

    if (matchingRow) {
      const needsUpdate =
        normalizeColorCode(matchingRow.color_code) !== normalizeColorCode(approvedColor.colorCode) ||
        Number(matchingRow.is_active) !== 1;

      if (needsUpdate) {
        await query(
          `UPDATE colors
           SET color_code = ?, is_active = 1
           WHERE id = ?`,
          [approvedColor.colorCode, matchingRow.id]
        );
      }
      continue;
    }

    await query(
      `INSERT INTO colors (name, color_code, is_active)
       VALUES (?, ?, 1)`,
      [approvedColor.name, approvedColor.colorCode]
    );
  }
}

export function getApprovedColorOrderClause() {
  return `FIELD(name, ${approvedColorNames.map(() => "?").join(", ")}) ASC, id ASC`;
}

export function getApprovedColorOrderParams() {
  return [...approvedColorNames];
}
