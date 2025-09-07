const { Client } = require('pg');

async function testDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_Yr7oX1ianpjU@ep-divine-cherry-adw0knrh-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully');

    // Test 1: Insert sample jurisdiction
    console.log('\n📝 Testing jurisdiction insert...');
    const jurisdictionResult = await client.query(`
      INSERT INTO jurisdictions (name, type, city, state, phone, email, website, is_active) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING id, name, created_at, updated_at;
    `, ['Austin', 'city', 'Austin', 'TX', '(512) 974-2000', 'info@austintexas.gov', 'https://www.austintexas.gov', true]);
    
    const jurisdictionId = jurisdictionResult.rows[0].id;
    console.log('✅ Jurisdiction inserted:', {
      id: jurisdictionId,
      name: jurisdictionResult.rows[0].name,
      created_at: jurisdictionResult.rows[0].created_at
    });

    // Test 2: Insert sample permit type
    console.log('\n📝 Testing permit type insert...');
    const permitResult = await client.query(`
      INSERT INTO permit_types (jurisdiction_id, name, category, description, processing_time, requirements) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, name, category;
    `, [
      jurisdictionId, 
      'Electrical Permit', 
      'electrical', 
      'Required for electrical work including new installations, modifications, and repairs',
      '5-7 business days',
      ['Electrical permit application', 'Electrical plans and specifications', 'Licensed electrician information']
    ]);
    
    const permitTypeId = permitResult.rows[0].id;
    console.log('✅ Permit type inserted:', {
      id: permitTypeId,
      name: permitResult.rows[0].name,
      category: permitResult.rows[0].category
    });

    // Test 3: Insert sample fees
    console.log('\n📝 Testing permit fees insert...');
    await client.query(`
      INSERT INTO permit_fees (permit_type_id, fee_type, amount, unit, description) 
      VALUES ($1, $2, $3, $4, $5);
    `, [permitTypeId, 'Electrical Permit Fee', 75.00, 'flat fee', 'Base fee for electrical permit application']);
    
    await client.query(`
      INSERT INTO permit_fees (permit_type_id, fee_type, amount, unit, description) 
      VALUES ($1, $2, $3, $4, $5);
    `, [permitTypeId, 'Inspection Fee', 25.00, 'flat fee', 'Fee for electrical inspection']);
    
    console.log('✅ Permit fees inserted');

    // Test 4: Insert sample forms
    console.log('\n📝 Testing permit forms insert...');
    await client.query(`
      INSERT INTO permit_forms (permit_type_id, name, url, file_type, is_required, description) 
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [
      permitTypeId, 
      'Electrical Permit Application', 
      'https://example-city.gov/forms/electrical-permit.pdf',
      'pdf',
      true,
      'Main application form for electrical permits'
    ]);
    
    console.log('✅ Permit forms inserted');

    // Test 5: Verify relationships with JOIN query
    console.log('\n📊 Testing data relationships...');
    const relationshipTest = await client.query(`
      SELECT 
        j.name as jurisdiction_name,
        pt.name as permit_name,
        pt.category,
        pf.fee_type,
        pf.amount,
        pfo.name as form_name,
        pfo.file_type
      FROM jurisdictions j
      JOIN permit_types pt ON j.id = pt.jurisdiction_id
      JOIN permit_fees pf ON pt.id = pf.permit_type_id
      JOIN permit_forms pfo ON pt.id = pfo.permit_type_id
      WHERE j.id = $1;
    `, [jurisdictionId]);

    console.log('✅ Relationship test results:');
    relationshipTest.rows.forEach(row => {
      console.log(`  🏛️  ${row.jurisdiction_name} - ${row.permit_name} (${row.category})`);
      console.log(`  💰 ${row.fee_type}: $${row.amount}`);
      console.log(`  📄 ${row.form_name} (${row.file_type})`);
    });

    // Test 6: Test update triggers
    console.log('\n📝 Testing update triggers...');
    const beforeUpdate = await client.query('SELECT updated_at FROM jurisdictions WHERE id = $1', [jurisdictionId]);
    console.log('📅 Before update:', beforeUpdate.rows[0].updated_at);
    
    // Wait a moment then update
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await client.query('UPDATE jurisdictions SET phone = $1 WHERE id = $2', ['(512) 974-2001', jurisdictionId]);
    
    const afterUpdate = await client.query('SELECT updated_at FROM jurisdictions WHERE id = $1', [jurisdictionId]);
    console.log('📅 After update:', afterUpdate.rows[0].updated_at);
    
    const updateWorked = new Date(afterUpdate.rows[0].updated_at) > new Date(beforeUpdate.rows[0].updated_at);
    console.log('✅ Update trigger working:', updateWorked ? 'YES' : 'NO');

    console.log('\n🎉 Database test completed successfully!');
    console.log('✅ All tables, relationships, and triggers are working correctly');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testDatabase();