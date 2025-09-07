const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_YKoMuNeOt31g@ep-broad-fire-adrrd7v6-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executing database schema...');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement.length === 0) continue;
      
      try {
        await client.query(statement);
        console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists): ${error.message.split('\n')[0]}`);
        } else {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Don't throw here, continue with other statements
        }
      }
    }

    console.log('🎉 Database setup completed!');
    
    // Test the setup by checking tables
    console.log('\n📊 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupDatabase();