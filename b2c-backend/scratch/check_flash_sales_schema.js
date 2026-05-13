import { db } from './config/db.js';
db.query('DESCRIBE flash_sales', (err, res) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(res, null, 2));
  process.exit();
});
