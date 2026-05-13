import { db } from "../config/db.js";

async function checkTables() {
  db.query("SHOW TABLES", (err, results) => {
    if (err) {
      console.error("Error checking tables:", err);
      process.exit(1);
    }
    console.log("Tables in database:");
    console.log(results.map(r => Object.values(r)[0]));
    
    db.query("DESCRIBE specification_values", (err2, results2) => {
      if (err2) {
        console.error("Error describing specification_values:", err2);
      } else {
        console.log("specification_values schema:");
        console.table(results2);
      }
      
      db.query("SELECT * FROM specification_values LIMIT 5", (err3, results3) => {
        if (err3) {
          console.error("Error selecting from specification_values:", err3);
        } else {
          console.log("First 5 specification_values:");
          console.table(results3);
        }
        process.exit(0);
      });
    });
  });
}

checkTables();
