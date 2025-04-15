import React, { useState } from 'react';

const EditAssetForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    id: asset.id,
    name: asset.name || '',
    icon: asset.icon || 'pi pi-desktop',
    count: asset.count || 0,
    total_value: asset.total_value || 0,
    policies: asset.policies ? [...asset.policies] : [],
    is_active: asset.is_active ?? true,
  });
  const [newPolicy, setNewPolicy] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (formData.count < 0) newErrors.count = 'Count cannot be negative';
    if (formData.total_value < 0) newErrors.total_value = 'Total value cannot be negative';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'count' ? parseInt(value) || 0 : name === 'total_value' ? parseFloat(value) || 0 : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePolicyChange = (e) => {
    setNewPolicy(e.target.value);
  };

  const addPolicy = () => {
    if (newPolicy.trim()) {
      setFormData((prev) => ({
        ...prev,
        policies: [...prev.policies, newPolicy.trim()],
      }));
      setNewPolicy('');
    }
  };

  const removePolicy = (policy) => {
    setFormData((prev) => ({
      ...prev,
      policies: prev.policies.filter((p) => p !== policy),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      console.log('Submitting updated asset category:', formData);
      onUpdateAsset(formData);
    } else {
      setErrors(validationErrors);
      console.error('Validation errors in EditAssetForm:', validationErrors);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Icon</label>
        <select
          name="icon"
          value={formData.icon}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="pi pi-desktop">Desktop</option>
          <option value="pi pi-laptop">Laptop</option>
          <option value="pi pi-tablet">Tablet</option>
          <option value="pi pi-box">Box</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Count</label>
        <input
          type="number"
          name="count"
          value={formData.count}
          onChange={handleChange}
          min="0"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.count ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.count && <p className="text-red-500 text-sm mt-1">{errors.count}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Total Value (₹)</label>
        <input
          type="number"
          name="total_value"
          value={formData.total_value}
          onChange={handleChange}
          min="0"
          step="0.01"
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
            errors.total_value ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        {errors.total_value && <p className="text-red-500 text-sm mt-1">{errors.total_value}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Policies</label>
        <div className="flex space-x-2 mt-1">
          <input
            type="text"
            value={newPolicy}
            onChange={handlePolicyChange}
            placeholder="Add policy"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addPolicy}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {formData.policies.map((policy, index) => (
            <span
              key={index}
              className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-sm flex items-center"
            >
              {policy}
              <button
                type="button"
                onClick={() => removePolicy(policy)}
                className="ml-1 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default EditAssetForm;