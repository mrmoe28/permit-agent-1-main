const { Client } = require('pg');

async function setupTriggers() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Yr7oX1ianpjU@ep-divine-cherry-adw0knrh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Create the update function
    console.log('📄 Creating update function...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Update function created');

    // Create triggers
    const triggers = [
      'CREATE TRIGGER update_jurisdictions_updated_at BEFORE UPDATE ON jurisdictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_permit_types_updated_at BEFORE UPDATE ON permit_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      'CREATE TRIGGER update_user_projects_updated_at BEFORE UPDATE ON user_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()'
    ];

    for (let i = 0; i < triggers.length; i++) {
      try {
        await client.query(triggers[i]);
        console.log(`✅ Created trigger ${i + 1}/${triggers.length}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Trigger ${i + 1} already exists`);
        } else {
          console.error(`❌ Error creating trigger ${i + 1}:`, error.message);
        }
      }
    }

    console.log('🎉 Triggers setup completed!');

  } catch (error) {
    console.error('❌ Triggers setup failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupTriggers();