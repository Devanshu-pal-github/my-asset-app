import React, { useState } from 'react';
import PropTypes from 'prop-types';

// Request types
const REQUEST_TYPES = {
  ASSET_REQUEST: 'asset_request',
  MAINTENANCE_APPROVAL: 'maintenance_approval',
  ASSIGNMENT_APPROVAL: 'assignment_approval',
  PURCHASE_APPROVAL: 'purchase_approval',
  ASSET_RETURN: 'asset_return'
};

// User friendly names for request types
const REQUEST_TYPE_NAMES = {
  [REQUEST_TYPES.ASSET_REQUEST]: 'Asset Request',
  [REQUEST_TYPES.MAINTENANCE_APPROVAL]: 'Maintenance Approval',
  [REQUEST_TYPES.ASSIGNMENT_APPROVAL]: 'Assignment Approval',
  [REQUEST_TYPES.PURCHASE_APPROVAL]: 'Purchase Approval',
  [REQUEST_TYPES.ASSET_RETURN]: 'Asset Return'
};

// Priority levels
const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Modal component for creating a new request
 */
const NewRequestModal = ({ isOpen, onClose, onSubmit }) => {
  const [requestType, setRequestType] = useState(REQUEST_TYPES.ASSET_REQUEST);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState(PRIORITY.MEDIUM);
  const [description, setDescription] = useState('');

  // Asset request specific fields
  const [category, setCategory] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [purpose, setPurpose] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assetName, setAssetName] = useState('');
  const [issue, setIssue] = useState('');
  const [reason, setReason] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [vendor, setVendor] = useState('');

  const resetForm = () => {
    setRequestType(REQUEST_TYPES.ASSET_REQUEST);
    setTitle('');
    setPriority(PRIORITY.MEDIUM);
    setDescription('');
    setCategory('');
    setSpecifications('');
    setPurpose('');
    setAssetId('');
    setAssetName('');
    setIssue('');
    setReason('');
    setEstimatedCost('');
    setVendor('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    let assetDetails = {};
    
    // Build asset details based on request type
    switch (requestType) {
      case REQUEST_TYPES.ASSET_REQUEST:
        assetDetails = {
          category,
          specifications,
          purpose
        };
        break;
      case REQUEST_TYPES.MAINTENANCE_APPROVAL:
        assetDetails = {
          asset_id: assetId,
          asset_name: assetName,
          issue
        };
        break;
      case REQUEST_TYPES.ASSET_RETURN:
        assetDetails = {
          asset_id: assetId,
          asset_name: assetName,
          reason
        };
        break;
      case REQUEST_TYPES.PURCHASE_APPROVAL:
        assetDetails = {
          category,
          specifications,
          estimated_cost: parseFloat(estimatedCost) || 0,
          vendor
        };
        break;
      default:
        assetDetails = { description };
    }
    
    const newRequest = {
      type: requestType,
      title,
      priority,
      asset_details: assetDetails,
      // These would be determined by the backend in a real app
      status: 'pending',
      date_submitted: new Date().toISOString(),
      id: `req${Math.floor(Math.random() * 1000)}`
    };
    
    onSubmit(newRequest);
    handleClose();
  };

  // Render form fields based on request type
  const renderTypeSpecificFields = () => {
    switch (requestType) {
      case REQUEST_TYPES.ASSET_REQUEST:
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Category*
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Laptop, Monitor, Keyboard"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Specifications*
              </label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the specifications of the asset you need"
                rows="3"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Purpose*
              </label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Why do you need this asset?"
                rows="2"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                required
              ></textarea>
            </div>
          </>
        );
        
      case REQUEST_TYPES.MAINTENANCE_APPROVAL:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Asset ID
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset ID/Tag"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Asset Name*
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset Name"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Issue Description*
              </label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the issue with the asset"
                rows="3"
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                required
              ></textarea>
            </div>
          </>
        );
        
      case REQUEST_TYPES.ASSET_RETURN:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Asset ID
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset ID/Tag"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Asset Name*
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Asset Name"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Reason for Return*
              </label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Why are you returning this asset?"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              ></textarea>
            </div>
          </>
        );
        
      case REQUEST_TYPES.PURCHASE_APPROVAL:
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Category*
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Laptop, Monitor, Keyboard"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Specifications*
              </label>
              <textarea
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the specifications of the item to purchase"
                rows="3"
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Estimated Cost*
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Preferred vendor (if any)"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </div>
            </div>
          </>
        );
        
      case REQUEST_TYPES.ASSIGNMENT_APPROVAL:
      default:
        return (
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Description*
            </label>
            <textarea
              className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Provide details about your request"
              rows="5"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Create New Request</h2>
          <button
            className="text-gray-400 hover:text-gray-500"
            onClick={handleClose}
          >
            <i className="pi pi-times text-xl"></i>
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-4 overflow-y-auto flex-grow">
          <form onSubmit={handleSubmit}>
            {/* Request type */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Request Type*
              </label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={requestType}
                onChange={(e) => setRequestType(e.target.value)}
                required
              >
                {Object.entries(REQUEST_TYPES).map(([key, value]) => (
                  <option key={key} value={value}>
                    {REQUEST_TYPE_NAMES[value]}
                  </option>
                ))}
              </select>
            </div>

            {/* Request title */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Request Title*
              </label>
              <input
                type="text"
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Brief title for your request"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Priority */}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Priority*
              </label>
              <select
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                required
              >
                <option value={PRIORITY.LOW}>Low</option>
                <option value={PRIORITY.MEDIUM}>Medium</option>
                <option value={PRIORITY.HIGH}>High</option>
              </select>
            </div>

            {/* Dynamic fields based on request type */}
            {renderTypeSpecificFields()}
          </form>
        </div>

        {/* Modal footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            className="text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-md mr-2"
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            onClick={handleSubmit}
          >
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

NewRequestModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired
};

export default NewRequestModal; 