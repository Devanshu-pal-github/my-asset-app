import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logger from '../../utils/logger';
import NewRequestModal from './NewRequestModal';

// Mock request data
const mockRequests = [
  {
    id: 'req001',
    type: 'asset_request',
    title: 'New Laptop Request',
    requestor: {
      id: 'emp1',
      name: 'John Doe',
      department: 'Engineering',
      position: 'Senior Developer'
    },
    date_submitted: '2024-09-01T10:15:00Z',
    status: 'pending',
    priority: 'high',
    asset_details: {
      category: 'Laptops',
      specifications: 'MacBook Pro 16" with 32GB RAM',
      purpose: 'Development work requiring multiple VMs'
    },
    approvers: [
      { id: 'mgr1', name: 'Jane Smith', status: 'pending', role: 'Department Manager' }
    ],
    comments: [
      { id: 'cmt1', author: 'John Doe', content: 'Existing laptop is over 3 years old and showing performance issues', date: '2024-09-01T10:15:00Z' }
    ]
  },
  {
    id: 'req002',
    type: 'maintenance_approval',
    title: 'Monitor Repair Approval',
    requestor: {
      id: 'emp2',
      name: 'Jane Smith',
      department: 'Marketing',
      position: 'Marketing Manager'
    },
    date_submitted: '2024-09-05T14:30:00Z',
    status: 'approved',
    priority: 'medium',
    asset_details: {
      asset_id: 'asset3',
      asset_name: 'Dell Monitor',
      asset_tag: 'MN001',
      issue: 'Screen flickering and color issues'
    },
    approvers: [
      { id: 'mgr2', name: 'Robert Johnson', status: 'approved', role: 'IT Manager', date: '2024-09-06T09:45:00Z' }
    ],
    comments: [
      { id: 'cmt2', author: 'Jane Smith', content: 'Monitor is essential for design work', date: '2024-09-05T14:30:00Z' },
      { id: 'cmt3', author: 'Robert Johnson', content: 'Approved. Please coordinate with IT for repair schedule.', date: '2024-09-06T09:45:00Z' }
    ]
  },
  {
    id: 'req003',
    type: 'assignment_approval',
    title: 'Team Equipment Assignment',
    requestor: {
      id: 'emp3',
      name: 'Bob Johnson',
      department: 'Sales',
      position: 'Sales Director'
    },
    date_submitted: '2024-09-10T11:20:00Z',
    status: 'pending',
    priority: 'medium',
    asset_details: {
      category: 'Peripherals',
      items: [
        { asset_id: 'asset4', name: 'Logitech Keyboard', quantity: 5 },
        { asset_id: 'asset7', name: 'Logitech Mouse', quantity: 5 }
      ],
      recipients: 'New sales team members'
    },
    approvers: [
      { id: 'mgr3', name: 'Alice Williams', status: 'pending', role: 'Operations Manager' }
    ],
    comments: [
      { id: 'cmt4', author: 'Bob Johnson', content: 'Equipment needed for new team members starting next week', date: '2024-09-10T11:20:00Z' }
    ]
  },
  {
    id: 'req004',
    type: 'purchase_approval',
    title: 'New Projector Purchase',
    requestor: {
      id: 'emp4',
      name: 'Alice Williams',
      department: 'Engineering',
      position: 'Team Lead'
    },
    date_submitted: '2024-09-03T15:45:00Z',
    status: 'rejected',
    priority: 'low',
    asset_details: {
      category: 'Presentation Equipment',
      specifications: 'HD Projector for conference room',
      estimated_cost: 1200.00,
      vendor: 'AV Solutions'
    },
    approvers: [
      { id: 'mgr4', name: 'Charlie Brown', status: 'rejected', role: 'Finance Manager', date: '2024-09-07T10:30:00Z' }
    ],
    comments: [
      { id: 'cmt5', author: 'Alice Williams', content: 'Current projector has poor image quality', date: '2024-09-03T15:45:00Z' },
      { id: 'cmt6', author: 'Charlie Brown', content: 'Rejected due to budget constraints. Please resubmit in next quarter.', date: '2024-09-07T10:30:00Z' }
    ]
  },
  {
    id: 'req005',
    type: 'asset_return',
    title: 'Laptop Return Approval',
    requestor: {
      id: 'emp5',
      name: 'Charlie Brown',
      department: 'Finance',
      position: 'Financial Analyst'
    },
    date_submitted: '2024-09-08T09:15:00Z',
    status: 'approved',
    priority: 'low',
    asset_details: {
      asset_id: 'asset2',
      asset_name: 'HP Pavilion',
      asset_tag: 'LT002',
      reason: 'Remote work ended, returning to office with desktop'
    },
    approvers: [
      { id: 'mgr1', name: 'Jane Smith', status: 'approved', role: 'Department Manager', date: '2024-09-08T16:20:00Z' }
    ],
    comments: [
      { id: 'cmt7', author: 'Charlie Brown', content: 'No longer need laptop as I\'m back in the office full-time', date: '2024-09-08T09:15:00Z' },
      { id: 'cmt8', author: 'Jane Smith', content: 'Approved. Please return to IT department by end of week.', date: '2024-09-08T16:20:00Z' }
    ]
  },
  {
    id: 'req006',
    type: 'asset_request',
    title: 'Office Chair Request',
    requestor: {
      id: 'emp6',
      name: 'Eve Davis',
      department: 'Human Resources',
      position: 'HR Specialist'
    },
    date_submitted: '2024-09-12T13:10:00Z',
    status: 'pending',
    priority: 'medium',
    asset_details: {
      category: 'Furniture',
      specifications: 'Ergonomic office chair',
      purpose: 'Current chair causing back pain'
    },
    approvers: [
      { id: 'mgr5', name: 'Dave Wilson', status: 'pending', role: 'HR Manager' }
    ],
    comments: [
      { id: 'cmt9', author: 'Eve Davis', content: 'Doctor recommended ergonomic chair due to back issues', date: '2024-09-12T13:10:00Z' }
    ]
  }
];

// Request types
const REQUEST_TYPES = {
  ASSET_REQUEST: 'asset_request',
  MAINTENANCE_APPROVAL: 'maintenance_approval',
  ASSIGNMENT_APPROVAL: 'assignment_approval',
  PURCHASE_APPROVAL: 'purchase_approval',
  ASSET_RETURN: 'asset_return'
};

// Request status
const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// Priority levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

// Status colors
const STATUS_COLORS = {
  [STATUS.PENDING]: 'bg-yellow-100 text-yellow-800',
  [STATUS.APPROVED]: 'bg-green-100 text-green-800',
  [STATUS.REJECTED]: 'bg-red-100 text-red-800'
};

// Priority colors
const PRIORITY_COLORS = {
  [PRIORITY.LOW]: 'bg-blue-100 text-blue-800',
  [PRIORITY.MEDIUM]: 'bg-orange-100 text-orange-800',
  [PRIORITY.HIGH]: 'bg-red-100 text-red-800'
};

// Icons for different request types
const REQUEST_TYPE_ICONS = {
  [REQUEST_TYPES.ASSET_REQUEST]: 'pi pi-desktop',
  [REQUEST_TYPES.MAINTENANCE_APPROVAL]: 'pi pi-wrench',
  [REQUEST_TYPES.ASSIGNMENT_APPROVAL]: 'pi pi-user-plus',
  [REQUEST_TYPES.PURCHASE_APPROVAL]: 'pi pi-shopping-cart',
  [REQUEST_TYPES.ASSET_RETURN]: 'pi pi-reply'
};

// User friendly names for request types
const REQUEST_TYPE_NAMES = {
  [REQUEST_TYPES.ASSET_REQUEST]: 'Asset Request',
  [REQUEST_TYPES.MAINTENANCE_APPROVAL]: 'Maintenance Approval',
  [REQUEST_TYPES.ASSIGNMENT_APPROVAL]: 'Assignment Approval',
  [REQUEST_TYPES.PURCHASE_APPROVAL]: 'Purchase Approval',
  [REQUEST_TYPES.ASSET_RETURN]: 'Asset Return'
};

// Utility functions
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  if (isNaN(date)) return 'Invalid Date';
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

const getRequestTypeLabel = (type) => {
  return REQUEST_TYPE_NAMES[type] || 'Unknown';
};

const getStatusBadge = (status) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const getPriorityBadge = (priority) => {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Tabs configuration
const TABS = {
  MY_REQUESTS: 'my_requests',
  PENDING_APPROVALS: 'pending_approvals',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ALL: 'all'
};

const TAB_CONFIG = [
  { id: TABS.MY_REQUESTS, label: 'My Requests', icon: 'pi pi-file' },
  { id: TABS.PENDING_APPROVALS, label: 'Pending Approvals', icon: 'pi pi-clock' },
  { id: TABS.APPROVED, label: 'Approved', icon: 'pi pi-check-circle' },
  { id: TABS.REJECTED, label: 'Rejected', icon: 'pi pi-times-circle' },
  { id: TABS.ALL, label: 'All Requests', icon: 'pi pi-list' }
];

// Main component
const RequestsApprovals = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS.MY_REQUESTS);
  const [requests, setRequests] = useState(mockRequests);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);

  // Filter requests based on tab, search term, type, and priority
  const filteredRequests = requests.filter(request => {
    // Apply tab filter
    if (activeTab === TABS.PENDING_APPROVALS && request.status !== STATUS.PENDING) return false;
    if (activeTab === TABS.APPROVED && request.status !== STATUS.APPROVED) return false;
    if (activeTab === TABS.REJECTED && request.status !== STATUS.REJECTED) return false;
    if (activeTab === TABS.MY_REQUESTS) {
      // In a real app, you would check if the current user is the requestor
      // For now, we'll just show all for demo purposes
    }

    // Apply type filter
    if (selectedType && request.type !== selectedType) return false;

    // Apply priority filter
    if (selectedPriority && request.priority !== selectedPriority) return false;

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        request.title.toLowerCase().includes(term) ||
        request.requestor.name.toLowerCase().includes(term) ||
        request.id.toLowerCase().includes(term)
      );
    }

    return true;
  });

  // Handle tab change
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
  };

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle type filter change
  const handleTypeChange = (e) => {
    setSelectedType(e.target.value);
  };

  // Handle priority filter change
  const handlePriorityChange = (e) => {
    setSelectedPriority(e.target.value);
  };

  // Handle view request details
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowRequestModal(true);
  };

  // Handle create new request
  const handleCreateRequest = () => {
    setShowNewRequestModal(true);
  };

  // Handle submit new request
  const handleSubmitNewRequest = (newRequest) => {
    // Add requestor info
    const requestWithRequestor = {
      ...newRequest,
      requestor: {
        id: 'current-user', // This would come from auth in a real app
        name: 'Current User',
        department: 'Your Department',
        position: 'Your Position'
      },
      approvers: [
        { 
          id: 'mgr1', 
          name: 'Jane Smith', 
          status: 'pending', 
          role: 'Department Manager' 
        }
      ],
      comments: []
    };
    
    // Add to requests list
    setRequests([requestWithRequestor, ...requests]);
    
    // Show success message
    // In a real app, you would use a toast notification component
    logger.log('New request created successfully:', requestWithRequestor);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedType('');
    setSelectedPriority('');
  };

  // Load requests from API (simulated)
  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch from an API
        // For now, we'll just use the mock data
        setRequests(mockRequests);
      } catch (error) {
        logger.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Render tab navigation
  const renderTabNavigation = () => {
    return (
      <div className="mb-6 border-b border-gray-200">
        <div className="flex flex-wrap -mb-px">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.id}
              className={`mr-8 py-3 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => handleTabChange(tab.id)}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render filters section
  const renderFilters = () => {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="w-full lg:w-auto flex flex-wrap items-center gap-4 mb-4 lg:mb-0">
            {/* Search input */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="pi pi-search text-gray-400"></i>
              </div>
              <input
                type="text"
                className="border border-gray-300 rounded-md pl-10 pr-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>

            {/* Type filter */}
            <div className="w-full sm:w-auto">
              <select
                className="border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedType}
                onChange={handleTypeChange}
              >
                <option value="">All Types</option>
                {Object.entries(REQUEST_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {REQUEST_TYPE_NAMES[value]}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority filter */}
            <div className="w-full sm:w-auto">
              <select
                className="border border-gray-300 rounded-md px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={selectedPriority}
                onChange={handlePriorityChange}
              >
                <option value="">All Priorities</option>
                {Object.entries(PRIORITY).map(([key, value]) => (
                  <option key={key} value={value}>
                    {value.charAt(0).toUpperCase() + value.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear filters button */}
            {(searchTerm || selectedType || selectedPriority) && (
              <button
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                onClick={clearFilters}
              >
                <i className="pi pi-filter-slash mr-1"></i>
                Clear Filters
              </button>
            )}
          </div>

          {/* Create new request button */}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center text-sm font-medium"
            onClick={handleCreateRequest}
          >
            <i className="pi pi-plus mr-2"></i>
            Create New Request
          </button>
        </div>
      </div>
    );
  };

  // Render request card
  const renderRequestCard = (request) => {
    return (
      <div key={request.id} className="bg-white p-4 rounded-lg shadow-sm mb-4 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="rounded-full bg-gray-100 p-2 flex items-center justify-center">
              <i className={`${REQUEST_TYPE_ICONS[request.type]} text-gray-600`}></i>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{request.title}</h3>
              <p className="text-sm text-gray-500">ID: {request.id}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getPriorityBadge(request.priority)}
            {getStatusBadge(request.status)}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Requestor</p>
            <p className="font-medium">{request.requestor.name}</p>
            <p className="text-xs text-gray-500">{request.requestor.department} - {request.requestor.position}</p>
          </div>
          <div>
            <p className="text-gray-500">Type</p>
            <p className="font-medium">{getRequestTypeLabel(request.type)}</p>
          </div>
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="font-medium">{formatDate(request.date_submitted)}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4 flex justify-between items-center">
          <div>
            {request.approvers.length > 0 && (
              <div className="text-sm">
                <span className="text-gray-500 mr-2">Approver:</span>
                <span className="font-medium">{request.approvers[0].name}</span>
                <span className="ml-2 text-xs">
                  {request.approvers[0].status === STATUS.PENDING
                    ? '(Pending)'
                    : request.approvers[0].status === STATUS.APPROVED
                    ? `(Approved on ${formatDate(request.approvers[0].date)})`
                    : `(Rejected on ${formatDate(request.approvers[0].date)})`}
                </span>
              </div>
            )}
          </div>
          <button
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            onClick={() => handleViewRequest(request)}
          >
            View Details
            <i className="pi pi-arrow-right ml-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // Render request detail modal
  const renderRequestDetailModal = () => {
    if (!selectedRequest) return null;

    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${showRequestModal ? 'block' : 'hidden'}`}>
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Modal header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="rounded-full bg-gray-200 p-2 flex items-center justify-center">
                <i className={`${REQUEST_TYPE_ICONS[selectedRequest.type]} text-gray-600`}></i>
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-900">{selectedRequest.title}</h2>
                <p className="text-sm text-gray-500">
                  {getRequestTypeLabel(selectedRequest.type)} • ID: {selectedRequest.id}
                </p>
              </div>
            </div>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={() => setShowRequestModal(false)}
            >
              <i className="pi pi-times text-xl"></i>
            </button>
          </div>

          {/* Modal body */}
          <div className="px-6 py-4 overflow-y-auto flex-grow">
            {/* Request details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Request Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium">{getStatusBadge(selectedRequest.status)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Priority</p>
                      <p className="font-medium">{getPriorityBadge(selectedRequest.priority)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="font-medium">{formatDate(selectedRequest.date_submitted)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Requestor Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Name</p>
                      <p className="font-medium">{selectedRequest.requestor.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Department / Position</p>
                      <p className="font-medium">
                        {selectedRequest.requestor.department} / {selectedRequest.requestor.position}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Asset details */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Asset Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedRequest.type === REQUEST_TYPES.ASSET_REQUEST && (
                  <div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium">{selectedRequest.asset_details.category}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Specifications</p>
                      <p className="font-medium">{selectedRequest.asset_details.specifications}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Purpose</p>
                      <p className="font-medium">{selectedRequest.asset_details.purpose}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.type === REQUEST_TYPES.MAINTENANCE_APPROVAL && (
                  <div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Asset</p>
                      <p className="font-medium">{selectedRequest.asset_details.asset_name} (Tag: {selectedRequest.asset_details.asset_tag})</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Issue</p>
                      <p className="font-medium">{selectedRequest.asset_details.issue}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.type === REQUEST_TYPES.ASSIGNMENT_APPROVAL && (
                  <div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium">{selectedRequest.asset_details.category}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Items</p>
                      <ul className="list-disc pl-5">
                        {selectedRequest.asset_details.items.map((item) => (
                          <li key={item.asset_id} className="font-medium">
                            {item.name} (Qty: {item.quantity})
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Recipients</p>
                      <p className="font-medium">{selectedRequest.asset_details.recipients}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.type === REQUEST_TYPES.PURCHASE_APPROVAL && (
                  <div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium">{selectedRequest.asset_details.category}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Specifications</p>
                      <p className="font-medium">{selectedRequest.asset_details.specifications}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Estimated Cost</p>
                        <p className="font-medium">${selectedRequest.asset_details.estimated_cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Vendor</p>
                        <p className="font-medium">{selectedRequest.asset_details.vendor}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedRequest.type === REQUEST_TYPES.ASSET_RETURN && (
                  <div>
                    <div className="mb-3">
                      <p className="text-xs text-gray-500">Asset</p>
                      <p className="font-medium">{selectedRequest.asset_details.asset_name} (Tag: {selectedRequest.asset_details.asset_tag})</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Reason for Return</p>
                      <p className="font-medium">{selectedRequest.asset_details.reason}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Approval information */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Approval Information</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedRequest.approvers.map((approver) => (
                  <div key={approver.id} className="mb-3 last:mb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs text-gray-500">Approver</p>
                        <p className="font-medium">{approver.name}</p>
                        <p className="text-xs text-gray-500">{approver.role}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="mt-1">{getStatusBadge(approver.status)}</div>
                        {approver.date && (
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(approver.date)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Comments</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {selectedRequest.comments.map((comment) => (
                  <div key={comment.id} className="mb-4 last:mb-0 pb-4 last:pb-0 border-b last:border-b-0 border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">{comment.author}</p>
                      <p className="text-xs text-gray-500">{formatDate(comment.date)}</p>
                    </div>
                    <p className="text-gray-600">{comment.content}</p>
                  </div>
                ))}

                {/* Add comment form - in a real app */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <textarea
                    className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                    placeholder="Add a comment..."
                  ></textarea>
                  <div className="mt-2 flex justify-end">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm rounded-md">
                      Add Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <button
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-md"
              onClick={() => setShowRequestModal(false)}
            >
              Close
            </button>

            {/* Action buttons based on status */}
            {selectedRequest.status === STATUS.PENDING && (
              <div className="flex space-x-2">
                <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md">
                  Reject
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">
                  Approve
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Requests & Approvals</h1>
      
      {renderTabNavigation()}
      {renderFilters()}

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="spinner-border text-blue-500" role="status">
            <i className="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
          </div>
        </div>
      )}

      {/* Request list */}
      {!loading && filteredRequests.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center">
          <i className="pi pi-inbox text-gray-300 text-5xl mb-4"></i>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No requests found</h3>
          <p className="text-gray-500">
            {searchTerm || selectedType || selectedPriority
              ? 'Try adjusting your filters to see more results'
              : 'There are no requests in this category yet'}
          </p>
        </div>
      ) : (
        <div className="mt-4">
          {filteredRequests.map(renderRequestCard)}
        </div>
      )}

      {/* Request detail modal */}
      {renderRequestDetailModal()}

      {/* New Request Modal */}
      <NewRequestModal 
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSubmit={handleSubmitNewRequest}
      />
    </div>
  );
};

export default RequestsApprovals; 