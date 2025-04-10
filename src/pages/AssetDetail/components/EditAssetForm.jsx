import React, { useState, useEffect } from 'react';

/**
 * Form component to edit an existing asset
 */
const EditAssetForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    deviceId: '',
    assetTag: '',
    serialNumber: '',
    model: '',
    purchaseDate: '',
    status: '',
    condition: '',
    assignedTo: '',
    department: '',
    assignmentDate: '',
    expectedReturn: '',
    specs: '',
    vendor: '',
    purchaseCost: '',
    warrantyExpiration: '',
    currentValue: '',
    notes: '',
    policies: []
  });
  
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    description: ''
  });

  // Load asset data into form when component mounts or asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        ...asset,
        policies: asset.policies || []
      });
    }
  }, [asset]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handlePolicyChange = (e) => {
    const { name, value } = e.target;
    setNewPolicy({
      ...newPolicy,
      [name]: value
    });
  };

  const addPolicy = () => {
    if (!newPolicy.name || !newPolicy.description) {
      alert('Please provide both a name and description for the policy.');
      return;
    }

    const policyToAdd = {
      id: Date.now(), // Use timestamp as a simple id
      name: newPolicy.name,
      description: newPolicy.description
    };

    setFormData({
      ...formData,
      policies: [...(formData.policies || []), policyToAdd]
    });

    // Reset new policy form
    setNewPolicy({ name: '', description: '' });
  };

  const removePolicy = (policyId) => {
    setFormData({
      ...formData,
      policies: formData.policies.filter(policy => policy.id !== policyId)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.assetTag || !formData.model) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Clear assignment data if status is not "Assigned"
    const finalData = { ...formData };
    if (formData.status !== 'Assigned') {
      finalData.assignedTo = '';
      finalData.department = '';
      finalData.assignmentDate = '';
      finalData.expectedReturn = '';
    }
    
    // Update asset through props method
    if (onUpdateAsset) {
      onUpdateAsset(finalData);
    }
    
    // Close the form
    onClose();
  };

  const departments = [
    'IT', 
    'HR', 
    'Finance', 
    'Marketing', 
    'Sales', 
    'Design', 
    'Operations', 
    'Administration', 
    'Legal', 
    'Customer Support'
  ];

  const statusOptions = ['In Storage', 'Assigned', 'In Repair', 'Retired'];
  const conditionOptions = ['Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair'];

  return (
    <div className="bg-white p-6 max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Asset Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="assetTag"
                  value={formData.assetTag}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., LAPTOP001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serialNumber"
                  value={formData.serialNumber || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Device serial number"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dell XPS 15"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Purchase Date
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
          
          {/* Status Information */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Status Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Condition</option>
                  {conditionOptions.map(condition => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Assignment Information */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Assignment Information</h3>
            <div className={formData.status !== 'Assigned' ? 'opacity-50' : ''}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Assigned To
                  </label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Employee name"
                    disabled={formData.status !== 'Assigned'}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Department
                  </label>
                  <select
                    name="department"
                    value={formData.department || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.status !== 'Assigned'}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Assignment Date
                  </label>
                  <input
                    type="date"
                    name="assignmentDate"
                    value={formData.assignmentDate || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.status !== 'Assigned'}
                  />
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">
                    Expected Return
                  </label>
                  <input
                    type="date"
                    name="expectedReturn"
                    value={formData.expectedReturn || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={formData.status !== 'Assigned'}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Hardware Specifications */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Hardware Specifications</h3>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Specifications
              </label>
              <input
                type="text"
                name="specs"
                value={formData.specs || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., i7, 16GB RAM, 512GB SSD"
              />
            </div>
          </div>
          
          {/* Financial Information */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Financial Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Dell"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Purchase Cost
                </label>
                <input
                  type="number"
                  name="purchaseCost"
                  value={formData.purchaseCost || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 89999"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Warranty Until
                </label>
                <input
                  type="date"
                  name="warrantyExpiration"
                  value={formData.warrantyExpiration || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Current Value
                </label>
                <input
                  type="number"
                  name="currentValue"
                  value={formData.currentValue || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 72000"
                />
              </div>
            </div>
          </div>
          
          {/* Policies Section */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Asset Policies</h3>
            
            {/* Current Policies List */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Current Policies</h4>
              {formData.policies && formData.policies.length > 0 ? (
                <div className="space-y-2">
                  {formData.policies.map(policy => (
                    <div 
                      key={policy.id} 
                      className="flex justify-between items-start p-3 border border-gray-200 rounded-md hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{policy.name}</div>
                        <div className="text-sm text-gray-600">{policy.description}</div>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removePolicy(policy.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <i className="pi pi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 text-sm italic">No policies attached to this asset.</div>
              )}
            </div>
            
            {/* Add New Policy */}
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Policy</h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Policy Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newPolicy.name}
                    onChange={handlePolicyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Laptop Usage Policy"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={newPolicy.description}
                    onChange={handlePolicyChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the policy"
                    rows="2"
                  ></textarea>
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={addPolicy}
                    className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
                  >
                    <i className="pi pi-plus mr-1"></i>
                    Add Policy
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          <div className="col-span-2">
            <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">Notes</h3>
            <div>
              <textarea
                name="notes"
                value={formData.notes || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add any additional notes about this asset"
                rows="3"
              ></textarea>
            </div>
          </div>
          
          <div className="col-span-2 flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditAssetForm; 