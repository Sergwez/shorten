const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';

// Read short codes from CSV
const csvContent = fs.readFileSync('popular-urls.csv', 'utf8');
const shortCodes = csvContent.split('\n')
  .slice(1) // Skip header
  .filter(line => line.trim()) // Remove empty lines
  .map(line => line.trim());

async function createTestUrls() {
  console.log('Creating test URLs for load testing...');
  
  const results = {
    created: 0,
    errors: 0,
    existing: 0
  };

  for (let i = 0; i < shortCodes.length; i++) {
    const shortCode = shortCodes[i];
    
    try {
      const response = await axios.post(`${BASE_URL}/shorten`, {
        originalUrl: `https://example.com/test-page-${shortCode}`, // Исправлено: originalUrl вместо url
        alias: shortCode
      });
      
      if (response.status === 201) {
        results.created++;
        process.stdout.write(`Created: ${shortCode} (${results.created}/${shortCodes.length})\r`);
      }
    } catch (error) {
      if (error.response?.status === 409) {
        // URL already exists
        results.existing++;
        process.stdout.write(`Exists: ${shortCode} (${results.existing} existing)\r`);
      } else {
        results.errors++;
        console.error(`\nError creating ${shortCode}:`, error.response?.data || error.message);
      }
    }
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
      console.log('\n\nTest Data Creation Results:');
      console.log(`Created: ${results.created}`);
    console.log(`Already existed: ${results.existing}`);
    console.log(`Errors: ${results.errors}`);
      console.log(`Total URLs ready: ${results.created + results.existing}`);
  
  if (results.created + results.existing > 0) {
          console.log('\nReady for load testing! Run: artillery run artillery-advanced.yml');
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
          console.error('Server is not running on http://localhost:3000');
      console.log('Please start the server first: npm run start:dev');
    process.exit(1);
  }
  
        console.log('Server is running');
  await createTestUrls();
}

main().catch(console.error);