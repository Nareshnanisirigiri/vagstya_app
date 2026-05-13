import { db } from "../config/db.js";

db.query("DESCRIBE ads", (err, rows) => {
  if (err) console.error(err);
  else console.log(JSON.stringify(rows, null, 2));
  process.exit();
});
