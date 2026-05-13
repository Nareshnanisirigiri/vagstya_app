const { db } = require('../config/db.js');
db.query("SHOW TABLES", (err, res) => {
  if (err) console.error(err);
  else console.log(res);
  process.exit();
});
