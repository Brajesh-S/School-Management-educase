// config/db.js
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database');
    
    // Call the function to ensure the table exists
    createTableIfNotExists();
});

function createTableIfNotExists() {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS schools (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            address VARCHAR(255) NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL
        );
    `;

    db.query(createTableSQL, (err, results) => {
        if (err) {
            console.error('Error creating table: ' + err.stack);
            return;
        }
        console.log('Table created/exist');
    });
}

module.exports = db;
