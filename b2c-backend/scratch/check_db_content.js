import { db } from "../config/db.js";

async function checkData() {
    try {
        const [tables] = await db.promise().query("SHOW TABLES");
        console.log("Tables in DB:", tables.map(t => Object.values(t)[0]));

        const [specCount] = await db.promise().query("SELECT COUNT(*) as count FROM specifications");
        console.log("Specifications count:", specCount[0].count);

        const [valCount] = await db.promise().query("SELECT COUNT(*) as count FROM specification_values");
        console.log("Specification Values count:", valCount[0].count);

        if (valCount[0].count > 0) {
            const [rows] = await db.promise().query("SELECT * FROM specification_values LIMIT 5");
            console.log("Sample values:", rows);
        } else {
            console.log("specification_values table is EMPTY.");
        }

    } catch (error) {
        console.error("Database check failed:", error);
    } finally {
        process.exit();
    }
}

checkData();
