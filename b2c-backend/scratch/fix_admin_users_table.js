const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config();

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'vogstya_jewellery'
    });

    try {
        console.log('Ensuring admin_users table has all necessary columns...');
        
        const [columns] = await connection.query('SHOW COLUMNS FROM admin_users');
        const columnNames = columns.map(c => c.Field);

        const columnsToAdd = [
            { name: 'role', type: "VARCHAR(50) DEFAULT 'staff'" },
            { name: 'gender', type: "VARCHAR(20) DEFAULT 'Other'" },
            { name: 'image', type: "LONGTEXT" },
            { name: 'status', type: "TINYINT DEFAULT 1" }
        ];

        for (const col of columnsToAdd) {
            if (!columnNames.includes(col.name)) {
                console.log(`Adding column: ${col.name}`);
                await connection.query(`ALTER TABLE admin_users ADD COLUMN ${col.name} ${col.type}`);
            }
        }

        console.log('✅ admin_users schema is up to date.');
    } catch (e) {
        console.error('❌ Error fixing schema:', e.message);
    } finally {
        await connection.end();
    }
}

fixSchema();
