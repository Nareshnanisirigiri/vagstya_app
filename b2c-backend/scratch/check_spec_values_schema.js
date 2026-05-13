const { db } = require('../config/db.js');

db.query('DESCRIBE specification_values', (err, results) => {
  if (err) {
    db.query('DESCRIBE specificationvalues', (err2, results2) => {
       if (err2) console.error('Both tables failed');
       else {
         console.log('Table: specificationvalues');
         results2.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
       }
       process.exit();
    });
  } else {
    console.log('Table: specification_values');
    results.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    process.exit();
  }
});
