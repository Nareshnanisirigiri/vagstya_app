import { db } from "./config/db.js";
import { getSqlTableContent } from "./utils/db.js";

async function run() {
  const result = await getSqlTableContent("categories");
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
run();
