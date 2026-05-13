import { synchronizeAllAdminData } from "../utils/adminDataSeeder.js";

async function run() {
  console.log("Running admin data seeder...");
  try {
    await synchronizeAllAdminData();
    console.log("Seeding complete! You should now have 221 specification records in your database.");
  } catch (error) {
    console.error("Error running seeder:", error);
  }
  process.exit(0);
}

run();
