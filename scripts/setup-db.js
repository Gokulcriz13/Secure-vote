const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Create database connection
const db = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE || 'secure_voting'
});

async function setupDatabase() {
  try {
    console.log('Setting up database tables...');
    
    // Read and execute SQL file
    const sqlPath = path.join(__dirname, 'setup-tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL file into individual commands
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    // Execute each command
    for (const command of commands) {
      try {
        await db.query(command);
        console.log('✅ Executed SQL command successfully');
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log('⚠️ Duplicate entry - skipping');
        } else {
          console.error('❌ Error executing command:', err);
        }
      }
    }
    
    console.log('Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

setupDatabase(); 