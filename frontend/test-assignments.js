// Test script for asset assignment and unassignment
const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:8000/api'; // Adjust if your API uses a different URL
const TEST_ASSET_ID = 'REPLACE_WITH_ACTUAL_ASSET_ID'; // Replace with an actual asset ID from your database
const TEST_EMPLOYEE_ID = 'REPLACE_WITH_ACTUAL_EMPLOYEE_ID'; // Replace with an actual employee ID

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to log with colors
const log = {
  info: (message) => console.log(`${COLORS.blue}[INFO]${COLORS.reset} ${message}`),
  success: (message) => console.log(`${COLORS.green}[SUCCESS]${COLORS.reset} ${message}`),
  error: (message) => console.log(`${COLORS.red}[ERROR]${COLORS.reset} ${message}`),
  warning: (message) => console.log(`${COLORS.yellow}[WARNING]${COLORS.reset} ${message}`),
  title: (message) => console.log(`\n${COLORS.bright}${COLORS.cyan}=== ${message} ===${COLORS.reset}\n`)
};

// Test 1: Fetch the asset's current state
async function testGetAsset() {
  log.title('TEST 1: Fetching Asset Current State');
  
  try {
    log.info(`Fetching asset with ID: ${TEST_ASSET_ID}`);
    const response = await axios.get(`${API_URL}/asset-items/${TEST_ASSET_ID}`);
    
    const asset = response.data;
    log.success('Asset fetch successful!');
    log.info(`Asset Name: ${asset.name}`);
    log.info(`Status: ${asset.status}`);
    log.info(`Active Assignment: ${asset.has_active_assignment ? 'Yes' : 'No'}`);
    log.info(`Current Assignment ID: ${asset.current_assignment_id || 'None'}`);
    log.info(`Current Assignee ID: ${asset.current_assignee_id || 'None'}`);
    
    return asset;
  } catch (error) {
    log.error(`Failed to fetch asset: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Test 2: Assign the asset
async function testAssignAsset(asset) {
  log.title('TEST 2: Assigning Asset to Employee');
  
  try {
    if (asset.has_active_assignment) {
      log.warning('Asset is already assigned! Unassign it first to test assignment.');
      return null;
    }
    
    log.info(`Assigning asset ${TEST_ASSET_ID} to employee ${TEST_EMPLOYEE_ID}`);
    
    const payload = {
      asset_id: TEST_ASSET_ID,
      assigned_to: TEST_EMPLOYEE_ID,
      assignment_notes: 'Test assignment from API test script',
      assignment_type: 'PERMANENT',
      assignment_date: new Date().toISOString(),
      condition: 'Good'
    };
    
    const response = await axios.post(`${API_URL}/assignment-history/`, payload);
    
    log.success('Assignment successful!');
    log.info(`Assignment ID: ${response.data.id}`);
    log.info(`Timestamp: ${response.data.assignment_date || response.data.created_at}`);
    
    return response.data;
  } catch (error) {
    log.error(`Failed to assign asset: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Test 3: Verify the asset is now assigned
async function testVerifyAssignment() {
  log.title('TEST 3: Verifying Asset Assignment');
  
  try {
    log.info(`Fetching asset ${TEST_ASSET_ID} to verify assignment`);
    const response = await axios.get(`${API_URL}/asset-items/${TEST_ASSET_ID}`);
    
    const asset = response.data;
    if (asset.has_active_assignment && 
        asset.status === 'assigned' && 
        asset.current_assignee_id === TEST_EMPLOYEE_ID) {
      log.success('Asset successfully assigned!');
      log.info(`Current Assignment ID: ${asset.current_assignment_id}`);
      return asset;
    } else {
      log.error('Asset assignment verification failed!');
      log.info(`Status: ${asset.status}`);
      log.info(`Active Assignment: ${asset.has_active_assignment ? 'Yes' : 'No'}`);
      log.info(`Current Assignee ID: ${asset.current_assignee_id || 'None'}`);
      return asset;
    }
  } catch (error) {
    log.error(`Failed to verify assignment: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Test 4: Unassign the asset
async function testUnassignAsset(asset) {
  log.title('TEST 4: Unassigning Asset');
  
  try {
    if (!asset.has_active_assignment || !asset.current_assignment_id) {
      log.warning('Asset is not assigned! Assign it first to test unassignment.');
      return null;
    }
    
    log.info(`Unassigning asset with assignment ID: ${asset.current_assignment_id}`);
    
    const payload = {
      assignment_id: asset.current_assignment_id,
      returned_date: new Date().toISOString(),
      return_notes: 'Test unassignment from API test script',
      return_condition: 'Good'
    };
    
    const response = await axios.post(`${API_URL}/assignment-history/unassign`, payload);
    
    log.success('Unassignment successful!');
    log.info(`Status: ${response.data.status}`);
    
    return response.data;
  } catch (error) {
    log.error(`Failed to unassign asset: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Test 5: Verify the asset is now unassigned
async function testVerifyUnassignment() {
  log.title('TEST 5: Verifying Asset Unassignment');
  
  try {
    log.info(`Fetching asset ${TEST_ASSET_ID} to verify unassignment`);
    const response = await axios.get(`${API_URL}/asset-items/${TEST_ASSET_ID}`);
    
    const asset = response.data;
    if (!asset.has_active_assignment && 
        asset.status === 'available' && 
        !asset.current_assignee_id) {
      log.success('Asset successfully unassigned!');
      return asset;
    } else {
      log.error('Asset unassignment verification failed!');
      log.info(`Status: ${asset.status}`);
      log.info(`Active Assignment: ${asset.has_active_assignment ? 'Yes' : 'No'}`);
      log.info(`Current Assignee ID: ${asset.current_assignee_id || 'None'}`);
      return asset;
    }
  } catch (error) {
    log.error(`Failed to verify unassignment: ${error.message}`);
    if (error.response) {
      log.error(`Status: ${error.response.status}`);
      log.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return null;
  }
}

// Run all tests in sequence
async function runTests() {
  console.log(`${COLORS.bright}ASSET ASSIGNMENT/UNASSIGNMENT TEST SCRIPT${COLORS.reset}`);
  console.log(`API URL: ${API_URL}`);
  console.log(`Asset ID: ${TEST_ASSET_ID}`);
  console.log(`Employee ID: ${TEST_EMPLOYEE_ID}`);
  console.log('=====================================================\n');
  
  // Run the tests
  const asset = await testGetAsset();
  if (!asset) return;
  
  // If the asset is already assigned, test unassignment first
  if (asset.has_active_assignment) {
    const unassignResult = await testUnassignAsset(asset);
    if (unassignResult) {
      await testVerifyUnassignment();
      // Now we can test assignment
      const assignedAsset = await testGetAsset();
      const assignmentResult = await testAssignAsset(assignedAsset);
      if (assignmentResult) {
        await testVerifyAssignment();
      }
    }
  } else {
    // Asset is not assigned, test assignment first
    const assignmentResult = await testAssignAsset(asset);
    if (assignmentResult) {
      const assignedAsset = await testVerifyAssignment();
      if (assignedAsset) {
        const unassignResult = await testUnassignAsset(assignedAsset);
        if (unassignResult) {
          await testVerifyUnassignment();
        }
      }
    }
  }
  
  log.title('TEST SEQUENCE COMPLETED');
}

// Execute the tests
runTests().catch(error => {
  log.error(`Test execution failed: ${error.message}`);
  console.error(error);
}); 