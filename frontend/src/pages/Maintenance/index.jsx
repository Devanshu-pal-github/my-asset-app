import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMaintenanceHistory } from '../../store/slices/maintenanceHistorySlice';
import logger from '../../utils/logger';

// Mock maintenance data
const mockMaintenanceData = [
  {
    id: 'maint001',
    asset_id: 'asset1',
    asset_name: 'MacBook Pro',
    asset_tag: 'LP001',
    category_name: 'Laptops',
    maintenance_type: 'Repair',
    technician: 'Tech Service Inc.',
    condition_before: 'Poor',
    condition_after: 'Good',
    maintenance_date: '2024-08-01T10:30:00Z',
    completed_date: '2024-08-04T15:45:00Z',
    next_scheduled_maintenance: '2025-02-01T10:30:00Z',
    status: 'Completed',
    cost: 150.0,
    notes: 'Fixed keyboard and trackpad issues',
  },
  {
    id: 'maint002',
    asset_id: 'asset2',
    asset_name: 'HP Pavilion',
    asset_tag: 'LP002',
    category_name: 'Laptops',
    maintenance_type: 'Inspection',
    technician: 'IT Crew',
    condition_before: 'Fair',
    maintenance_date: '2024-09-10T08:15:00Z',
    status: 'In Progress',
    notes: 'Checking for system issues and general health',
  },
  {
    id: 'maint003',
    asset_id: 'asset3',
    asset_name: 'Dell Monitor',
    asset_tag: 'MN001',
    category_name: 'Monitors',
    maintenance_type: 'Repair',
    technician: 'Display Fixers',
    condition_before: 'Poor',
    maintenance_date: '2024-09-15T13:45:00Z',
    status: 'Requested',
    notes: 'Screen flickering and color issues',
  },
  {
    id: 'maint004',
    asset_id: 'asset4',
    asset_name: 'Logitech Keyboard',
    asset_tag: 'KB001',
    category_name: 'Peripherals',
    maintenance_type: 'Replacement',
    technician: 'IT Department',
    condition_before: 'Poor',
    condition_after: 'Excellent',
    maintenance_date: '2024-07-20T09:00:00Z',
    completed_date: '2024-07-22T16:30:00Z',
    status: 'Completed',
    cost: 50.0,
    notes: 'Replaced with new keyboard due to worn keys',
  },
  {
    id: 'maint005',
    asset_id: 'asset5',
    asset_name: 'Acer Projector',
    asset_tag: 'PJ001',
    category_name: 'Presentation Equipment',
    maintenance_type: 'Cleaning',
    technician: 'AV Solutions',
    condition_before: 'Fair',
    maintenance_date: '2024-09-18T11:00:00Z',
    status: 'Requested',
    notes: 'Dust accumulation affecting image quality',
  },
  {
    id: 'maint006',
    asset_id: 'asset6',
    asset_name: 'Conference Table',
    asset_tag: 'FN001',
    category_name: 'Furniture',
    maintenance_type: 'Repair',
    technician: 'Furniture Repairs Inc.',
    condition_before: 'Poor',
    maintenance_date: '2024-09-05T14:30:00Z',
    status: 'Cancelled',
    notes: 'Table leg is loose and unstable',
  },
];

// Maintenance status options from enum
const MAINTENANCE_STATUS = {
  REQUESTED: 'requested',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  OVERDUE: 'overdue'
};

// Constants for tag colors
const STATUS_COLORS = {
  [MAINTENANCE_STATUS.REQUESTED]: 'bg-yellow-100 text-yellow-800',
  [MAINTENANCE_STATUS.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [MAINTENANCE_STATUS.COMPLETED]: 'bg-green-100 text-green-800',
  [MAINTENANCE_STATUS.CANCELLED]: 'bg-gray-100 text-gray-800',
  [MAINTENANCE_STATUS.PENDING]: 'bg-orange-100 text-orange-800',
  [MAINTENANCE_STATUS.SCHEDULED]: 'bg-purple-100 text-purple-800',
  [MAINTENANCE_STATUS.OVERDUE]: 'bg-red-100 text-red-800'
};

// Maintenance type options from backend
const MAINTENANCE_TYPES = [
  'preventive',
  'corrective',
  'condition_based',
  'breakdown',
  'emergency',
  'routine',
  'scheduled',
  'repair',
  'inspection',
  'cleaning',
  'replacement',
  'upgrade'
];

const Maintenance = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // Get maintenance data from Redux store
  const { history: maintenanceItems, loading, error: reduxError } = useSelector(
    (state) => state.maintenanceHistory
  );
  
  const [filteredItems, setFilteredItems] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Fetch maintenance data
  useEffect(() => {
    const fetchMaintenanceData = async () => {
      try {
        logger.debug('Fetching all maintenance records');
        // Fetch all maintenance records by passing no assetId
        const result = await dispatch(fetchMaintenanceHistory()).unwrap();
        logger.info('Maintenance data loaded successfully', { 
          count: result?.length || 0,
          firstRecord: result?.[0]?.id || null
        });
      } catch (err) {
        logger.error('Failed to fetch maintenance data', { 
          error: err,
          message: err?.message || 'Unknown error'
        });
        setError('Failed to load maintenance data. Please try again later.');
      }
    };

    fetchMaintenanceData();
  }, [dispatch]);

  // Filter and sort data when filters change or when maintenanceItems updates
  useEffect(() => {
    if (!maintenanceItems?.length) return;

    logger.debug('Applying filters and sort', { searchTerm, statusFilter, typeFilter, sortBy });
    
    let result = [...maintenanceItems];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.asset_name || '').toLowerCase().includes(term) ||
        (item.asset_tag || '').toLowerCase().includes(term) ||
        (item.category_name || '').toLowerCase().includes(term) ||
        (item.technician || '').toLowerCase().includes(term) ||
        (item.notes || '').toLowerCase().includes(term) ||
        (item.description || '').toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(item => item.status === statusFilter);
    }
    
    // Apply type filter
    if (typeFilter !== 'all') {
      result = result.filter(item => 
        item.maintenance_type === typeFilter || 
        item.service_type === typeFilter
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date_asc':
        result.sort((a, b) => new Date(a.request_date || a.maintenance_date) - new Date(b.request_date || b.maintenance_date));
        break;
      case 'date_desc':
        result.sort((a, b) => new Date(b.request_date || b.maintenance_date) - new Date(a.request_date || a.maintenance_date));
        break;
      case 'status':
        result.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
      case 'asset_name':
        result.sort((a, b) => (a.asset_name || '').localeCompare(b.asset_name || ''));
        break;
      default:
        break;
    }
    
    setFilteredItems(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [maintenanceItems, searchTerm, statusFilter, typeFilter, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const currentItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Format status for display
  const formatStatus = (status) => {
    if (!status) return 'Unknown';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase().replace('_', ' ');
  };

  // Get appropriate icon for status
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case MAINTENANCE_STATUS.REQUESTED:
        return 'pi pi-clock';
      case MAINTENANCE_STATUS.IN_PROGRESS:
        return 'pi pi-spin pi-spinner';
      case MAINTENANCE_STATUS.COMPLETED:
        return 'pi pi-check';
      case MAINTENANCE_STATUS.CANCELLED:
        return 'pi pi-times';
      case MAINTENANCE_STATUS.PENDING:
        return 'pi pi-exclamation-circle';
      case MAINTENANCE_STATUS.SCHEDULED:
        return 'pi pi-calendar';
      case MAINTENANCE_STATUS.OVERDUE:
        return 'pi pi-exclamation-triangle';
      default:
        return 'pi pi-question';
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle creating new maintenance request
  const handleNewRequest = () => {
    navigate('/asset-inventory'); // Navigate to inventory to select asset
  };

  // Handle view maintenance details
  const handleViewDetails = (id) => {
    // Navigate to maintenance details page (for future implementation)
    logger.debug('View maintenance details', { id });
    // navigate(`/maintenance/${id}`);
  };

  // Handle maintenance update 
  const handleUpdateRequest = (id) => {
    // Navigate to update page (for future implementation)
    logger.debug('Update maintenance', { id });
    // navigate(`/maintenance/${id}/update`);
  };

  if (loading) {
    return (
      <div className="mt-24 p-6 flex justify-center">
        <div className="animate-pulse text-gray-600">Loading maintenance data...</div>
      </div>
    );
  }

  if (error || reduxError) {
    return (
      <div className="mt-24 p-6 flex justify-center">
        <div className="text-red-600">{error || reduxError}</div>
      </div>
    );
  }

  // Keep existing JSX for the component UI, but update the stats calculation
  const maintenanceStats = Object.values(MAINTENANCE_STATUS).reduce((acc, status) => {
    acc[status] = maintenanceItems?.filter(item => item.status === status)?.length || 0;
    return acc;
  }, {});

  return (
    <div className="mt-24 p-6 bg-background-offwhite min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Asset Maintenance</h1>
        <p className="text-gray-600">Manage and track all asset maintenance activities</p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search assets, technicians, categories..."
                className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <i className="pi pi-search"></i>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap md:flex-nowrap gap-4">
            <select
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.values(MAINTENANCE_STATUS).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              {MAINTENANCE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="status">By Status</option>
              <option value="asset_name">By Asset Name</option>
            </select>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              onClick={handleNewRequest}
            >
              <i className="pi pi-plus mr-2"></i>
              New Request
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.values(MAINTENANCE_STATUS).map(status => (
          <div 
            key={status} 
            className={`bg-white p-4 rounded-lg shadow flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow ${statusFilter === status ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setStatusFilter(status === statusFilter ? 'all' : status)}
          >
            <div>
              <h3 className="text-gray-500 text-sm font-medium">{formatStatus(status)}</h3>
              <p className="text-2xl font-bold">{maintenanceStats[status]}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${STATUS_COLORS[status] || STATUS_COLORS[MAINTENANCE_STATUS.PENDING]}`}>
              <i className={getStatusIcon(status)}></i>
            </div>
          </div>
        ))}
      </div>

      {/* Maintenance Cards */}
      {currentItems.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <div className="text-gray-500 mb-2">No maintenance records found</div>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={handleNewRequest}
          >
            Create New Maintenance Request
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800">{item.asset_name}</h3>
                  <p className="text-sm text-gray-600">{item.asset_tag} • {item.category_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || STATUS_COLORS[MAINTENANCE_STATUS.PENDING]}`}>
                  {formatStatus(item.status)}
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Maintenance Type</p>
                    <p className="text-sm font-medium">{item.maintenance_type || item.service_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Technician</p>
                    <p className="text-sm font-medium">{item.technician || item.performed_by || 'Not Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Request Date</p>
                    <p className="text-sm">{formatDate(item.request_date || item.maintenance_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">
                      {item.status === MAINTENANCE_STATUS.COMPLETED ? 'Completed Date' : 'Condition'}
                    </p>
                    <p className="text-sm">
                      {item.status === MAINTENANCE_STATUS.COMPLETED 
                        ? formatDate(item.completed_date || item.completion_date) 
                        : (item.condition_before || 'Not Specified')}
                    </p>
                  </div>
                </div>
                
                {item.notes && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{item.notes || item.description}</p>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t">
                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    onClick={() => handleViewDetails(item.id)}
                  >
                    <i className="pi pi-eye mr-1"></i> Details
                  </button>
                  
                  {item.status !== MAINTENANCE_STATUS.COMPLETED && 
                   item.status !== MAINTENANCE_STATUS.CANCELLED && (
                    <button
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center"
                      onClick={() => handleUpdateRequest(item.id)}
                    >
                      <i className="pi pi-pencil mr-1"></i> Update
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </button>
            ))}
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Maintenance; 