// Simple test script to demonstrate enhanced extraction capabilities
// Run with: node test-extraction.js

const { ContentExtractor } = require('./src/lib/scraping/extractors.ts');

// Sample HTML content that might be found on a government permit site
const sampleHTML = `
<html>
<body>
  <h1>City Building Permits</h1>
  
  <div class="contact">
    <h2>Contact Information</h2>
    <p>Phone: (555) 123-4567</p>
    <p>Email: permits@cityname.gov</p>
    <address>
      123 Main Street
      City Hall, Room 201
      Anytown, CA 90210
    </address>
    
    <div class="hours">
      <h3>Office Hours</h3>
      <p>Monday: 8:00 AM - 5:00 PM</p>
      <p>Tuesday: 8:00 AM - 5:00 PM</p>
      <p>Wednesday: 8:00 AM - 5:00 PM</p>
      <p>Thursday: 8:00 AM - 5:00 PM</p>
      <p>Friday: 8:00 AM - 4:00 PM</p>
    </div>
  </div>

  <div class="permit-fees">
    <h2>Permit Fees</h2>
    <table>
      <thead>
        <tr>
          <th>Permit Type</th>
          <th>Fee</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Building Permit</td>
          <td>$125.00</td>
          <td>Base fee for residential construction</td>
        </tr>
        <tr>
          <td>Electrical Permit</td>
          <td>$75.00</td>
          <td>Standard electrical work</td>
        </tr>
        <tr>
          <td>Plumbing Permit</td>
          <td>$65.00</td>
          <td>Plumbing installation and repairs</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="requirements">
    <h2>Required Documents</h2>
    <ul>
      <li>Completed application form</li>
      <li>Site plan showing property boundaries</li>
      <li>Construction plans and specifications</li>
      <li>Structural engineer certification (if required)</li>
      <li>Proof of property ownership</li>
    </ul>
  </div>

  <form name="permit-application">
    <h3>Permit Application Form</h3>
    <label for="applicant-name">Applicant Name (required)*</label>
    <input type="text" id="applicant-name" name="applicant_name" required>
    
    <label for="property-address">Property Address*</label>
    <input type="text" id="property-address" name="property_address" required>
    
    <label for="permit-type">Permit Type*</label>
    <select name="permit_type" required>
      <option>Building</option>
      <option>Electrical</option>
      <option>Plumbing</option>
      <option>Mechanical</option>
    </select>
    
    <label for="project-description">Project Description</label>
    <textarea name="project_description" id="project-description"></textarea>
  </form>

  <div class="processing-info">
    <h3>Processing Times</h3>
    <p>Building permits: 2-4 weeks</p>
    <p>Electrical permits: 1-2 weeks</p>
    <p>Plumbing permits: 1-2 weeks</p>
  </div>

</body>
</html>
`;

console.log('🧪 Testing Advanced Content Extraction...\n');

try {
  const extractor = new ContentExtractor(sampleHTML, 'https://cityname.gov/permits');
  
  // Test table extraction
  const tables = extractor.extractTables();
  console.log('📊 EXTRACTED TABLES:', tables.length);
  tables.forEach((table, i) => {
    console.log(`  Table ${i + 1} (${table.type}):`);
    console.log(`    Headers: ${table.headers.join(', ')}`);
    console.log(`    Rows: ${table.rows.length}`);
  });

  // Test fee extraction
  const fees = extractor.extractFeeSchedule();
  console.log('\n💰 EXTRACTED FEES:', fees.length);
  fees.forEach(fee => {
    console.log(`  - ${fee.type}: $${fee.amount} (${fee.unit})`);
  });

  // Test contact info extraction
  const contact = extractor.extractContactInfo();
  console.log('\n📞 EXTRACTED CONTACT:');
  console.log(`  Phone: ${contact.phone || 'Not found'}`);
  console.log(`  Email: ${contact.email || 'Not found'}`);
  if (contact.address) {
    console.log(`  Address: ${contact.address.street}, ${contact.address.city}, ${contact.address.state} ${contact.address.zipCode}`);
  }
  if (contact.hoursOfOperation) {
    console.log('  Hours:');
    Object.entries(contact.hoursOfOperation).forEach(([day, hours]) => {
      if (hours) {
        console.log(`    ${day}: ${hours.open} - ${hours.close}`);
      }
    });
  }

  // Test requirements extraction
  const requirements = extractor.extractRequirements();
  console.log('\n📋 EXTRACTED REQUIREMENTS:', requirements.length);
  requirements.forEach((req, i) => {
    console.log(`  ${i + 1}. ${req}`);
  });

  // Test form extraction
  const forms = extractor.extractForms();
  console.log('\n📝 EXTRACTED FORMS:', forms.length);
  forms.forEach(form => {
    console.log(`  Form: ${form.formName}`);
    console.log(`    Fields: ${form.fields.length}`);
    form.fields.forEach(field => {
      console.log(`      - ${field.label} (${field.type}${field.required ? ', required' : ''})`);
    });
  });

  // Test processing times
  const processingTimes = extractor.extractProcessingTimes();
  console.log('\n⏱️  EXTRACTED PROCESSING TIMES:');
  Object.entries(processingTimes).forEach(([type, time]) => {
    console.log(`  ${type}: ${time}`);
  });

  console.log('\n✅ Advanced extraction test completed successfully!');
  
} catch (error) {
  console.error('❌ Test failed:', error);
}