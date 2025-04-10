import React, { useState } from 'react';

/**
 * Form component to add a new asset item
 */
const AddItemForm = ({ categoryId, onClose, onAddItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    count: 1,
    status: 'Active'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'count') {
      setFormData({
        ...formData,
        [name]: value === '' ? 1 : Number(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Create the asset item with a generated ID
    const itemData = {
      ...formData,
      categoryId,
      id: Math.random().toString(36).substring(2, 10),
    };
    
    // Add item through prop method
    onAddItem(itemData);
    
    // Close the form
    onClose();
  };

  const statusOptions = [
    'Active',
    'Inactive',
    'In Repair',
    'Retired'
  ];

  return (
    <div className="bg-white p-6 max-w-2xl mx-auto">      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Item Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Dell XPS 15, iPhone 13, etc."
              required
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Count <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="count"
              value={formData.count}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              required
            />
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
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
              Add Item
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddItemForm; 