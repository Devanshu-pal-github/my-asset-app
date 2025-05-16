/**
 * Mock data for Reports & Analytics page
 * In a real application, this would be fetched from an API
 */

// Asset Category Data - for pie chart
export const assetCategoryData = [
  { category: 'Laptops', count: 182, value: 273000 },
  { category: 'Desktops', count: 93, value: 139500 },
  { category: 'Monitors', count: 214, value: 85600 },
  { category: 'Phones', count: 128, value: 128000 },
  { category: 'Tablets', count: 63, value: 63000 },
  { category: 'Printers', count: 34, value: 51000 },
  { category: 'Networking', count: 57, value: 85500 },
  { category: 'Other', count: 41, value: 61500 }
];

// Asset Status Data - for pie chart
export const assetStatusData = [
  { status: 'In Use', count: 546 },
  { status: 'Available', count: 127 },
  { status: 'In Maintenance', count: 42 },
  { status: 'Reserved', count: 65 },
  { status: 'End of Life', count: 32 }
];

// Asset Acquisition Data - for line chart
export const assetAcquisitionData = [
  { month: 'Jan', count: 23, value: 46000 },
  { month: 'Feb', count: 18, value: 36000 },
  { month: 'Mar', count: 22, value: 44000 },
  { month: 'Apr', count: 31, value: 62000 },
  { month: 'May', count: 27, value: 54000 },
  { month: 'Jun', count: 24, value: 48000 },
  { month: 'Jul', count: 36, value: 72000 },
  { month: 'Aug', count: 42, value: 84000 },
  { month: 'Sep', count: 38, value: 76000 },
  { month: 'Oct', count: 29, value: 58000 },
  { month: 'Nov', count: 34, value: 68000 },
  { month: 'Dec', count: 30, value: 60000 }
];

// Department Asset Data - for horizontal bar chart
export const departmentAssetData = [
  { department: 'IT', count: 187, value: 280500 },
  { department: 'Sales', count: 124, value: 186000 },
  { department: 'Marketing', count: 98, value: 147000 },
  { department: 'Finance', count: 76, value: 114000 },
  { department: 'HR', count: 54, value: 81000 },
  { department: 'Operations', count: 143, value: 214500 },
  { department: 'Product', count: 112, value: 168000 },
  { department: 'Customer Support', count: 89, value: 133500 },
  { department: 'Executive', count: 29, value: 87000 }
];

// Maintenance Data - for bar/line chart
export const maintenanceData = [
  { month: 'Jan', cost: 5200, count: 14 },
  { month: 'Feb', cost: 3800, count: 9 },
  { month: 'Mar', cost: 4500, count: 12 },
  { month: 'Apr', cost: 6200, count: 18 },
  { month: 'May', cost: 4900, count: 13 },
  { month: 'Jun', cost: 5600, count: 16 },
  { month: 'Jul', cost: 7300, count: 22 },
  { month: 'Aug', cost: 8100, count: 25 },
  { month: 'Sep', cost: 6800, count: 20 },
  { month: 'Oct', cost: 5500, count: 17 },
  { month: 'Nov', cost: 6100, count: 19 },
  { month: 'Dec', cost: 5900, count: 18 }
];

// Asset Age Data - for doughnut chart
export const assetAgeData = [
  { range: '< 1 year', count: 198 },
  { range: '1-2 years', count: 276 },
  { range: '2-3 years', count: 157 },
  { range: '3-4 years', count: 98 },
  { range: '4+ years', count: 83 }
];

// Top Employees by Asset Value - for table
export const topEmployeeAssetData = [
  { 
    id: 1, 
    name: 'John Smith', 
    department: 'IT', 
    assets: 8, 
    value: 24000 
  },
  { 
    id: 2, 
    name: 'Emma Johnson', 
    department: 'Executive', 
    assets: 5, 
    value: 21500 
  },
  { 
    id: 3, 
    name: 'Michael Brown', 
    department: 'Product', 
    assets: 7, 
    value: 18500 
  },
  { 
    id: 4, 
    name: 'Sarah Davis', 
    department: 'IT', 
    assets: 6, 
    value: 16800 
  },
  { 
    id: 5, 
    name: 'James Wilson', 
    department: 'Marketing', 
    assets: 5, 
    value: 14500 
  },
  { 
    id: 6, 
    name: 'Jennifer Taylor', 
    department: 'Finance', 
    assets: 4, 
    value: 13200 
  },
  { 
    id: 7, 
    name: 'Robert Martinez', 
    department: 'Operations', 
    assets: 5, 
    value: 12800 
  },
  { 
    id: 8, 
    name: 'Lisa Anderson', 
    department: 'Sales', 
    assets: 4, 
    value: 11500 
  },
  { 
    id: 9, 
    name: 'David Thomas', 
    department: 'IT', 
    assets: 4, 
    value: 10800 
  },
  { 
    id: 10, 
    name: 'Karen Jackson', 
    department: 'Customer Support', 
    assets: 3, 
    value: 9600 
  }
]; 