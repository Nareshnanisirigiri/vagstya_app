import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const testDb = (host, port, user, password, database) => {
  const connection = mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
    connectTimeout: 5000
  });

  connection.connect((err) => {
    if (err) {
      console.log(`Connection to ${host}:${port} (user:${user}, pass:${password}) failed:`, err.message);
    } else {
      console.log(`Connection to ${host}:${port} (user:${user}, pass:${password}) successful!`);
      connection.end();
    }
  });
};

console.log("Testing current .env config...");
testDb(process.env.DB_HOST, process.env.DB_PORT, process.env.DB_USER, process.env.DB_PASSWORD, process.env.DB_NAME);

console.log("Testing localhost variations...");
testDb("localhost", 3306, "root", "", "sathyavogue_db");
testDb("localhost", 3306, "root", "root", "sathyavogue_db");
testDb("localhost", 3306, "root", "password", "sathyavogue_db");
testDb("localhost", 3306, "root", "admin", "sathyavogue_db");
