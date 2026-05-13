const { db } = require('../config/db.js');

db.query('DESCRIBE specifications', (err, results) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Specifications Table Columns:');
    results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  }
  process.exit();
});
