import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

// Hardcoded employee data
const mockEmployeeData = {
  EMP001: {
    employee: {
      id: 'EMP001',
      first_name: 'John',
      last_name: 'Doe',
      employee_id: 'EMP001',
      email: 'john.doe@example.com',
      department: 'Engineering',
      job_title: 'Software Engineer',
      phone: '123-456-7890',
      is_active: true,
      created_at: '2023-01-15',
    },
    current_assets: [
      {
        id: 'ASSET001',
        name: 'Laptop',
        asset_tag: 'LP001',
        category_name: 'Electronics',
        status: 'Assigned',
        condition: 'Good',
        current_assignment_date: '2024-06-01',
      },
      {
        id: 'ASSET002',
        name: 'Monitor',
        asset_tag: 'MN001',
        category_name: 'Electronics',
        status: 'Assigned',
        condition: 'Excellent',
        current_assignment_date: '2024-07-15',
      },
    ],
    assignment_history: [
      {
        id: 'ASSIGN001',
        asset_name: 'Laptop',
        assignment_date: '2024-06-01',
        return_date: null,
        assignment_type: 'Permanent',
        is_active: true,
        notes: 'Assigned for remote work',
      },
      {
        id: 'ASSIGN002',
        asset_name: 'Old Monitor',
        assignment_date: '2023-03-10',
        return_date: '2024-07-14',
        assignment_type: 'Temporary',
        is_active: false,
        notes: 'Returned due to upgrade',
      },
    ],
    maintenance_history: [
      {
        id: 'MAINT001',
        asset_name: 'Laptop',
        maintenance_date: '2024-08-01',
        maintenance_type: 'Repair',
        cost: 150.00,
        performed_by: 'Tech Service Inc.',
        next_scheduled_maintenance: '2025-02-01',
      },
      {
        id: 'MAINT002',
        asset_name: 'Monitor',
        maintenance_date: '2024-09-10',
        maintenance_type: 'Inspection',
        cost: 50.00,
        performed_by: 'IT Crew',
        next_scheduled_maintenance: '2025-03-10',
      },
    ],
  },
};

// Constants for tab names
const TABS = {
  CURRENT_ASSETS: 'currentAssets',
  ASSIGNMENT_HISTORY: 'assignmentHistory',
  MAINTENANCE_HISTORY: 'maintenanceHistory',
};

// Utility function to format dates
const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'N/A';

// TabNavigation component
const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="flex border-b border-gray-200">
    {Object.entries(TABS).map(([key, tab]) => (
      <button
        key={tab}
        className={`px-4 py-3 text-sm font-medium ${
          activeTab === tab
            ? "text-blue-600 border-b-2 border-blue-500"
            : "text-gray-600 hover:text-blue-600"
        } transition-colors`}
        onClick={() => onTabChange(tab)}
      >
        {key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')}
      </button>
    ))}
  </div>
);

// Current Assets Tab
const CurrentAssetsTab = ({ assets }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned On</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {assets.length > 0 ? assets.map(asset => (
          <tr key={asset.id}>
            <td className="px-6 py-4 whitespace-nowrap">{asset.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{asset.asset_tag}</td>
            <td className="px-6 py-4 whitespace-nowrap">{asset.category_name || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{asset.status}</td>
            <td className="px-6 py-4 whitespace-nowrap">{asset.condition}</td>
            <td className="px-6 py-4 whitespace-nowrap">{formatDate(asset.current_assignment_date)}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No assets currently assigned</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Assignment History Tab
const AssignmentHistoryTab = ({ history }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {history.length > 0 ? history.map(record => (
          <tr key={record.id}>
            <td className="px-6 py-4 whitespace-nowrap">{record.asset_name || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.assignment_date)}</td>
            <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.return_date)}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.assignment_type || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.is_active ? 'Active' : 'Inactive'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.notes || 'N/A'}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No assignment history available</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

// Maintenance History Tab
const MaintenanceHistoryTab = ({ history }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Date</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Scheduled</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {history.length > 0 ? history.map(record => (
          <tr key={record.id}>
            <td className="px-6 py-4 whitespace-nowrap">{record.asset_name || 'Unknown'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.maintenance_date)}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.maintenance_type || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.performed_by || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.next_scheduled_maintenance)}</td>
          </tr>
        )) : (
          <tr>
            <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No maintenance history available</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
);

const EmployeeDetails = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState(TABS.CURRENT_ASSETS);

  // Fetch mock data based on employee ID
  const employeeDetails = mockEmployeeData[id] || null;

  if (!employeeDetails) {
    return <div className="p-6 text-gray-500">Employee not found</div>;
  }

  const { employee, current_assets, assignment_history, maintenance_history } = employeeDetails;

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="p-6 bg-background-offwhite min-h-screen mt-20 text-gray-900">
      {/* Header with Back Link */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employee Profile</h1>
        <Link to="/employee-assets" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
          <i className="pi pi-arrow-left mr-2"></i> Back to Employees
        </Link>
      </div>

      {/* Employee Information Card */}
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">{employee.first_name} {employee.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employee ID:</span>
              <span className="font-medium">{employee.employee_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{employee.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium">{employee.department}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Job Title:</span>
              <span className="font-medium">{employee.job_title || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{employee.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{employee.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Joined:</span>
              <span className="font-medium">{formatDate(employee.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabbed Content for Asset Information */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="p-6">
          {activeTab === TABS.CURRENT_ASSETS && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Assigned Assets</h2>
              <CurrentAssetsTab assets={current_assets} />
            </div>
          )}
          
          {activeTab === TABS.ASSIGNMENT_HISTORY && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment History</h2>
              <AssignmentHistoryTab history={assignment_history} />
            </div>
          )}
          
          {activeTab === TABS.MAINTENANCE_HISTORY && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Maintenance History</h2>
              <MaintenanceHistoryTab history={maintenance_history} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;