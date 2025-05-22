import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployeeDetails, clearEmployeeDetails } from '../../store/slices/employeeSlice';
import logger from '../../utils/logger';

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
            <td className="px-6 py-4 whitespace-nowrap">{record.notes || record.assignment_notes || 'N/A'}</td>
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
            <td className="px-6 py-4 whitespace-nowrap">{record.maintenance_type || record.service_type || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{record.performed_by || record.technician || 'N/A'}</td>
            <td className="px-6 py-4 whitespace-nowrap">{formatDate(record.next_scheduled_maintenance || record.next_scheduled)}</td>
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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(TABS.CURRENT_ASSETS);
  
  // Get employee details from Redux store
  const { employeeDetails, loading, error } = useSelector((state) => state.employees);

  // Fetch employee details when component mounts
  useEffect(() => {
    logger.debug('EmployeeDetails component mounted', { employeeId: id });
    dispatch(fetchEmployeeDetails(id))
      .unwrap()
      .then((result) => {
        console.log('Employee details fetched successfully:', result);
        logger.info('Employee details loaded successfully', { employeeId: id });
      })
      .catch((error) => {
        console.error('Error fetching employee details:', error);
        logger.error('Failed to load employee details', { error, employeeId: id });
      });
      
    // Cleanup when component unmounts
    return () => {
      dispatch(clearEmployeeDetails());
      logger.debug('EmployeeDetails component unmounted, cleared details');
    };
  }, [dispatch, id]);

  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    logger.debug('Changed active tab', { tab });
  };

  // If loading, show loading indicator
  if (loading) {
    return (
      <div className="p-6 mt-20 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="p-6 mt-20 text-red-500">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Error Loading Employee Profile</h1>
          <Link to="/employee-assets" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <i className="pi pi-arrow-left mr-2"></i> Back to Employees
          </Link>
        </div>
        <p>Error: {error}</p>
        <button 
          onClick={() => dispatch(fetchEmployeeDetails(id))}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // If no employee details are found
  if (!employeeDetails) {
    return (
      <div className="p-6 mt-20 text-gray-500">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Employee Not Found</h1>
          <Link to="/employee-assets" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors">
            <i className="pi pi-arrow-left mr-2"></i> Back to Employees
          </Link>
        </div>
        <p>The employee with ID {id} could not be found.</p>
      </div>
    );
  }

  const { employee, current_assets, assignment_history, maintenance_history } = employeeDetails;
  
  // Log the data for debugging
  logger.debug('Rendering employee details', { 
    employee: { id: employee.id, name: employee.full_name },
    assetsCount: current_assets?.length || 0,
    assignmentHistoryCount: assignment_history?.length || 0,
    maintenanceHistoryCount: maintenance_history?.length || 0
  });

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
              <span className="font-medium">{employee.full_name || `${employee.first_name} ${employee.last_name}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Employee ID:</span>
              <span className="font-medium">{employee.employee_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{employee.contact?.email || employee.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department:</span>
              <span className="font-medium">{employee.department || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Job Title:</span>
              <span className="font-medium">{employee.job_title || employee.metadata?.job_title || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{employee.contact?.phone || employee.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium">{employee.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Joined:</span>
              <span className="font-medium">{formatDate(employee.metadata?.joining_date || employee.created_at)}</span>
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
              <CurrentAssetsTab assets={current_assets || []} />
            </div>
          )}
          
          {activeTab === TABS.ASSIGNMENT_HISTORY && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Assignment History</h2>
              <AssignmentHistoryTab history={assignment_history || []} />
            </div>
          )}
          
          {activeTab === TABS.MAINTENANCE_HISTORY && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Maintenance History</h2>
              <MaintenanceHistoryTab history={maintenance_history || []} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;