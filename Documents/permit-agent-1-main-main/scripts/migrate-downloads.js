const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrateDownloads() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Yr7oX1ianpjU@ep-divine-cherry-adw0knrh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'lib', 'database', 'migrations', 'add-downloads-tables.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Executing downloads migration...');
    
    // Execute the entire migration as one transaction
    await client.query('BEGIN');
    
    try {
      // Split by semicolon but be smarter about function definitions
      const statements = [];
      let currentStatement = '';
      let inFunction = false;
      
      const lines = migration.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip comments and empty lines
        if (trimmedLine.startsWith('--') || trimmedLine === '') {
          continue;
        }
        
        currentStatement += line + '\n';
        
        // Detect function start
        if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
            trimmedLine.includes('CREATE FUNCTION')) {
          inFunction = true;
        }
        
        // Detect function end
        if (inFunction && trimmedLine.includes('$$ language')) {
          inFunction = false;
          statements.push(currentStatement.trim());
          currentStatement = '';
          continue;
        }
        
        // Regular statement end
        if (!inFunction && trimmedLine.endsWith(';')) {
          statements.push(currentStatement.trim());
          currentStatement = '';
        }
      }
      
      // Add any remaining statement
      if (currentStatement.trim()) {
        statements.push(currentStatement.trim());
      }
      
      // Execute each statement
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.length === 0) continue;
        
        try {
          await client.query(statement);
          console.log(`✅ Executed statement ${i + 1}/${statements.length}`);
        } catch (error) {
          if (error.message.includes('already exists') || 
              error.message.includes('does not exist')) {
            console.log(`⚠️  Statement ${i + 1} skipped: ${error.message.split('\n')[0]}`);
          } else {
            throw error; // Re-throw to trigger rollback
          }
        }
      }
      
      await client.query('COMMIT');
      console.log('✅ Migration committed successfully');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    console.log('🎉 Downloads migration completed!');
    
    // Verify the new tables
    console.log('\n📊 Verifying new tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('downloads', 'download_sessions', 'download_session_items')
      ORDER BY table_name;
    `);
    
    console.log('📋 New download tables:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });
    
    // Check added columns
    console.log('\n📋 Checking added columns...');
    const columnsResult = await client.query(`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name IN ('permit_forms', 'jurisdictions', 'users')
      AND column_name IN ('download_count', 'last_downloaded_at', 'file_size_bytes', 'total_downloads', 'download_preferences')
      ORDER BY table_name, column_name;
    `);
    
    columnsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}.${row.column_name}`);
    });

    // Check views
    console.log('\n📋 Checking new views...');
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('download_analytics', 'popular_forms')
      ORDER BY table_name;
    `);
    
    viewsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name} (view)`);
    });

  } catch (error) {
    console.error('❌ Downloads migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the migration
migrateDownloads();