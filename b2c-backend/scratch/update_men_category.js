const { db } = require('../config/db.js');

const oldName = 'Men';
const newName = "Men's Wear";

db.query('UPDATE categories SET name = ? WHERE name = ?', [newName, oldName], (err, results) => {
  if (err) {
    console.error('Update failed:', err);
  } else {
    console.log(`Successfully updated ${results.affectedRows} category(ies) from "${oldName}" to "${newName}".`);
  }
  process.exit();
});
