export const APPROVED_SIZE_CATALOG = [
  "0-3 Months", "0-6 Months", "1", "1-2 Years", "10", "10-11 Years", "100 CMS", "105 CMS", "11", "11-12 Years", "110 CMS", "12", "12-13 Years", "12-18 Months", "13-14 Years", "14", "2", "2-2", "2-4", "2-6", "2-8", "26", "28", "3", "3-4 Years", "30", "32", "32A", "32B", "32C", "32D", "34", "34A", "34B", "34C", "34D", "36", "36A", "36B", "36C", "36D", "38", "38A", "38B", "38C", "38D", "3XL", "4", "4 XL", "4-5 Years", "40", "40A", "40B", "40C", "40D", "42", "44", "46", "48", "5", "5 XL", "5-6 Years", "50", "6", "6 XL", "6-12 months", "7", "7-8 Years", "75 CMS", "8", "8-9 Years", "80 CMS", "85 CMS", "9", "9-10 Years", "90 CMS", "95 CMS", "Adjustable", "Free Style", "L", "M", "Non-Adjustable", "S", "XL", "XS", "XXL"
];

export async function synchronizeApprovedSizes(query) {
  for (const sizeName of APPROVED_SIZE_CATALOG) {
    try {
      const [existing] = await query(
        `SELECT id FROM sizes WHERE name = ? LIMIT 1`,
        [sizeName]
      );

      if (existing) {
        // Ensure active and shop_id
        await query(
          `UPDATE sizes SET is_active = 1, shop_id = 1 WHERE id = ?`,
          [existing.id]
        );
      } else {
        // Insert new approved size
        await query(
          `INSERT INTO sizes (name, is_active, shop_id) VALUES (?, 1, 1)`,
          [sizeName]
        );
      }
    } catch (err) {
      console.log(`Failed to sync size ${sizeName}:`, err.message);
    }
  }
}
