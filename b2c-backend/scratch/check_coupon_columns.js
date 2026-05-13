import { db } from "./config/db.js";

const checkColumns = "DESCRIBE coupons";

db.query(checkColumns, (err, results) => {
    if (err) {
        console.error("Error describing coupons table:", err);
        process.exit(1);
    }
    console.log("Coupons table columns:");
    console.table(results);
    process.exit(0);
});
