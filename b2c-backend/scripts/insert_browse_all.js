import { db } from "../config/db.js";

async function run() {
  const name = "Browse all";
  const slug = "browse-all";
  db.query(
    "INSERT IGNORE INTO categories (name, url_slug, type, status) VALUES (?, ?, ?, 1)",
    [name, slug, "catalog"]
  );
  console.log("Browse all category added.");
  process.exit(0);
}

run();
