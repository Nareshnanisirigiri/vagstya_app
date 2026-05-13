import { db } from "../config/db.js";

const fixCoupons = async () => {
    const alterQueries = [
        "ALTER TABLE coupons ADD COLUMN IF NOT EXISTS discount_type VARCHAR(50) AFTER code",
        "ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_discount DECIMAL(10,2) DEFAULT 0 AFTER min_purchase",
        "ALTER TABLE coupons ADD COLUMN IF NOT EXISTS limit_per_user INT DEFAULT 1 AFTER max_discount",
        "ALTER TABLE coupons ADD COLUMN IF NOT EXISTS shop_ids TEXT AFTER status"
    ];

    for (const sql of alterQueries) {
        try {
            await new Promise((resolve, reject) => {
                db.query(sql, (err) => {
                    if (err) {
                        // If IF NOT EXISTS is not supported by this MySQL version, we ignore already exists errors
                        if (err.code === 'ER_DUP_COLUMN_NAME') {
                            resolve();
                        } else {
                            reject(err);
                        }
                    } else {
                        resolve();
                    }
                });
            });
            console.log("Executed:", sql);
        } catch (e) {
            console.warn("Failed to execute:", sql, e.message);
        }
    }
    console.log("Coupons table schema fix completed.");
    process.exit(0);
};

fixCoupons();
