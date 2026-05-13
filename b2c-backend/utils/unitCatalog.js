export const APPROVED_UNIT_CATALOG = [
  "1 Item", "2 Item", "3 Item", "4 Item", "1 pair", "2 pairs", "5 Item", "6 Item", "1 Dozen", "10 pcs", "12 pcs", "50 pcs", "100 pcs", "1 packet", "1 card", "7 Item", "8 Item", "9 Item", "10 Item", "3 pairs", "1 Sheet", "2 Dozens", "1 Set", "3 Dozens", "4 Pairs", "5 Pairs", "6 Pairs", "1 Box", "1 Pcs", "2 pcs"
];

export async function synchronizeApprovedUnits(query) {
  for (const unitName of APPROVED_UNIT_CATALOG) {
    try {
      const [existing] = await query(
        `SELECT id FROM units WHERE name = ? LIMIT 1`,
        [unitName]
      );

      if (existing) {
        // Ensure active and shop_id
        await query(
          `UPDATE units SET is_active = 1, shop_id = 1 WHERE id = ?`,
          [existing.id]
        );
      } else {
        // Insert new approved unit
        await query(
          `INSERT INTO units (name, is_active, shop_id) VALUES (?, 1, 1)`,
          [unitName]
        );
      }
    } catch (err) {
      console.log(`Failed to sync unit ${unitName}:`, err.message);
    }
  }
}
