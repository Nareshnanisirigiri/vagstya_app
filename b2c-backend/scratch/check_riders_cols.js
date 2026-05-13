import { db } from './config/db.js';

db.query("SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_NAME = 'riders'", (err, res) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(res, null, 2));
  process.exit();
});
