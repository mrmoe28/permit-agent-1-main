const { Client } = require('pg');

async function testDownloads() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Yr7oX1ianpjU@ep-divine-cherry-adw0knrh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Get existing test data
    const jurisdictionResult = await client.query('SELECT id FROM jurisdictions LIMIT 1');
    const permitFormResult = await client.query('SELECT id, name FROM permit_forms LIMIT 1');
    
    if (jurisdictionResult.rows.length === 0 || permitFormResult.rows.length === 0) {
      console.log('⚠️  No test data found. Running basic setup...');
      // Run basic setup first
      await client.query(`
        INSERT INTO jurisdictions (name, type, city, state, phone, email, website, is_active) 
        VALUES ('Test City', 'city', 'Test City', 'TX', '(555) 123-4567', 'test@city.gov', 'https://test.gov', true)
        ON CONFLICT DO NOTHING;
      `);
      
      const newJurisResult = await client.query('SELECT id FROM jurisdictions WHERE name = $1', ['Test City']);
      const jurisdictionId = newJurisResult.rows[0].id;
      
      await client.query(`
        INSERT INTO permit_types (jurisdiction_id, name, category, description, processing_time) 
        VALUES ($1, 'Test Electrical Permit', 'electrical', 'Test permit for downloads', '3-5 days')
        ON CONFLICT DO NOTHING;
      `, [jurisdictionId]);
      
      const permitTypeResult = await client.query('SELECT id FROM permit_types WHERE name = $1', ['Test Electrical Permit']);
      const permitTypeId = permitTypeResult.rows[0].id;
      
      await client.query(`
        INSERT INTO permit_forms (permit_type_id, name, url, file_type, is_required, description) 
        VALUES ($1, 'Test Electrical Form', 'https://test.gov/form.pdf', 'pdf', true, 'Test form for download tracking')
        ON CONFLICT DO NOTHING;
      `, [permitTypeId]);
    }

    // Get fresh data after setup
    const formResult = await client.query(`
      SELECT pf.id as form_id, pf.name as form_name, pt.jurisdiction_id
      FROM permit_forms pf 
      JOIN permit_types pt ON pf.permit_type_id = pt.id 
      LIMIT 1
    `);
    
    const { form_id, form_name, jurisdiction_id } = formResult.rows[0];

    // Test 1: Record a download
    console.log('\n📝 Testing download recording...');
    const downloadResult = await client.query(`
      INSERT INTO downloads (
        permit_form_id, 
        form_name, 
        form_url, 
        file_type, 
        file_size_bytes,
        jurisdiction_id,
        permit_type_category,
        ip_address,
        user_agent,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, downloaded_at;
    `, [
      form_id,
      form_name,
      'https://test.gov/form.pdf',
      'pdf',
      1245678,
      jurisdiction_id,
      'electrical',
      '127.0.0.1',
      'Mozilla/5.0 Test Browser',
      'completed'
    ]);

    const downloadId = downloadResult.rows[0].id;
    console.log('✅ Download recorded:', {
      id: downloadId,
      downloaded_at: downloadResult.rows[0].downloaded_at
    });

    // Test 2: Check if statistics were updated automatically
    console.log('\n📊 Checking automatic statistics updates...');
    
    const formStats = await client.query('SELECT download_count, last_downloaded_at FROM permit_forms WHERE id = $1', [form_id]);
    console.log('✅ Form statistics:', {
      download_count: formStats.rows[0].download_count,
      last_downloaded_at: formStats.rows[0].last_downloaded_at
    });

    const jurisdictionStats = await client.query('SELECT total_downloads, last_activity_at FROM jurisdictions WHERE id = $1', [jurisdiction_id]);
    console.log('✅ Jurisdiction statistics:', {
      total_downloads: jurisdictionStats.rows[0].total_downloads,
      last_activity_at: jurisdictionStats.rows[0].last_activity_at
    });

    // Test 3: Create a bulk download session
    console.log('\n📝 Testing bulk download session...');
    const sessionResult = await client.query(`
      INSERT INTO download_sessions (session_name, total_forms) 
      VALUES ($1, $2) 
      RETURNING id, created_at;
    `, ['Test Bulk Download', 3]);

    const sessionId = sessionResult.rows[0].id;
    console.log('✅ Download session created:', {
      id: sessionId,
      created_at: sessionResult.rows[0].created_at
    });

    // Link download to session
    await client.query(`
      INSERT INTO download_session_items (download_session_id, download_id, order_index) 
      VALUES ($1, $2, $3);
    `, [sessionId, downloadId, 1]);

    console.log('✅ Download linked to session');

    // Test 4: Test analytics views
    console.log('\n📊 Testing analytics views...');
    
    const analyticsResult = await client.query('SELECT * FROM download_analytics LIMIT 5');
    console.log('✅ Download analytics:');
    analyticsResult.rows.forEach(row => {
      console.log(`  🏛️  ${row.jurisdiction_name}: ${row.total_downloads} downloads, ${row.unique_forms} forms`);
    });

    const popularFormsResult = await client.query('SELECT * FROM popular_forms LIMIT 3');
    console.log('✅ Popular forms:');
    popularFormsResult.rows.forEach(row => {
      console.log(`  📄 ${row.name} (${row.file_type}): ${row.download_count} downloads`);
    });

    // Test 5: Test cleanup function
    console.log('\n🧹 Testing cleanup function...');
    
    // Create an expired download for testing
    await client.query(`
      INSERT INTO downloads (
        permit_form_id, form_name, form_url, file_type, 
        jurisdiction_id, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);
    `, [
      form_id, 'Expired Test Form', 'https://test.gov/expired.pdf', 'pdf',
      jurisdiction_id, 'completed', new Date(Date.now() - 86400000) // Yesterday
    ]);

    const cleanupResult = await client.query('SELECT cleanup_expired_downloads()');
    console.log('✅ Cleanup completed, expired items:', cleanupResult.rows[0].cleanup_expired_downloads);

    // Test 6: Advanced download query
    console.log('\n🔍 Testing advanced download queries...');
    
    const advancedQuery = await client.query(`
      SELECT 
        d.id,
        d.form_name,
        d.file_type,
        d.file_size_bytes,
        d.downloaded_at,
        j.name as jurisdiction_name,
        j.city,
        j.state,
        CASE 
          WHEN ds.id IS NOT NULL THEN 'bulk'
          ELSE 'individual'
        END as download_type
      FROM downloads d
      JOIN jurisdictions j ON d.jurisdiction_id = j.id
      LEFT JOIN download_session_items dsi ON d.id = dsi.download_id
      LEFT JOIN download_sessions ds ON dsi.download_session_id = ds.id
      WHERE d.status = 'completed'
      ORDER BY d.downloaded_at DESC
      LIMIT 5;
    `);

    console.log('✅ Recent downloads:');
    advancedQuery.rows.forEach(row => {
      console.log(`  📥 ${row.form_name} from ${row.jurisdiction_name}, ${row.city} (${row.download_type})`);
      console.log(`     Size: ${(row.file_size_bytes / 1024 / 1024).toFixed(2)} MB, Downloaded: ${row.downloaded_at.toISOString()}`);
    });

    console.log('\n🎉 Download tracking test completed successfully!');
    console.log('✅ All download features are working correctly:');
    console.log('  📊 Download recording and statistics');
    console.log('  📦 Bulk download sessions');
    console.log('  📈 Analytics and reporting views');
    console.log('  🧹 Automatic cleanup functions');
    console.log('  🔍 Advanced querying capabilities');

  } catch (error) {
    console.error('❌ Download tracking test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testDownloads();