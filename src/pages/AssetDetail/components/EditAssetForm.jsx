import React, { useState, useEffect } from 'react';
import logger from '../../../utils/logger';

/**
 * Form component to edit basic asset details (Asset Information, Status, and Assignment)
 */
const EditAssetForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    name: '',
    asset_tag: '',
    serial_number: '',
    status: '',
    condition: '',
    is_operational: '',
    department: '',
    location: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Load asset data into form when component mounts or asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        asset_tag: asset.asset_tag || '',
        serial_number: asset.serial_number || '',
        status: asset.status || '',
        condition: asset.condition || '',
        is_operational: asset.is_operational === 1 ? true : false,
        department: asset.department || '',
        location: asset.location || '',
      });
      logger.debug('Loaded asset data into form (basic fields)', { assetId: asset.id });
    }
  }, [asset]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.asset_tag) newErrors.asset_tag = 'Asset Tag is required';
    if (!formData.status) newErrors.status = 'Status is required';
    if (!formData.condition) newErrors.condition = 'Condition is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: null }));
    logger.debug('Form field updated', { fieldName: name, value });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
    logger.debug('Checkbox field updated', { fieldName: name, value: checked });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      logger.warn('Form validation failed', { errors });
      return;
    }

    setIsSubmitting(true);
    try {
      const finalData = {
        name: formData.name,
        asset_tag: formData.asset_tag,
        serial_number: formData.serial_number,
        status: formData.status,
        condition: formData.condition,
        is_operational: formData.is_operational ? 1 : 0,
        department: formData.department || null,
        location: formData.location || null,
      };

      logger.debug('Submitting updated asset data (basic fields)', { finalData });
      await onUpdateAsset(finalData);
      logger.info('Asset basic fields updated successfully', { assetId: asset.id });
      onClose();
    } catch (error) {
      setApiError(error.message || 'Failed to update asset');
      logger.error('Failed to update asset basic fields', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusOptions = ['In Use', 'Under Maintenance', 'Available', 'Retired', 'Lost'];
  const conditionOptions = ['Excellent', 'Good', 'Fair', 'Poor', 'Broken'];
  const departments = [
    'IT', 'HR', 'Finance', 'Marketing', 'Sales',
    'Design', 'Operations', 'Administration', 'Legal', 'Customer Support'
  ];

  return (
    <div className="bg-white p-6 max-w-3xl mx-auto rounded-lg shadow-md border border-gray-200">
      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {apiError}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Asset Information */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Asset Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.name ? 'border-red-500' : 'border-gray-300'} p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., Dell XPS 15"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="asset_tag" className="block text-sm font-medium text-gray-700">
                  Asset Tag <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="asset_tag"
                  name="asset_tag"
                  value={formData.asset_tag}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.asset_tag ? 'border-red-500' : 'border-gray-300'} p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., LAP001"
                />
                {errors.asset_tag && <p className="text-red-500 text-xs mt-1">{errors.asset_tag}</p>}
              </div>
              <div>
                <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700">
                  Serial Number
                </label>
                <input
                  type="text"
                  id="serial_number"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., XPS13-001"
                />
              </div>
            </div>
          </div>

          {/* Asset Status */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Asset Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.status ? 'border-red-500' : 'border-gray-300'} p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="" disabled>Select Status</option>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
                {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
              </div>
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition <span className="text-red-500">*</span>
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.condition ? 'border-red-500' : 'border-gray-300'} p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                >
                  <option value="" disabled>Select Condition</option>
                  {conditionOptions.map((condition) => (
                    <option key={condition} value={condition}>{condition}</option>
                  ))}
                </select>
                {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition}</p>}
              </div>
              <div>
                <label htmlFor="is_operational" className="block text-sm font-medium text-gray-700">
                  Operational Status
                </label>
                <div className="mt-1 flex items-center">
                  <input
                    type="checkbox"
                    id="is_operational"
                    name="is_operational"
                    checked={formData.is_operational}
                    onChange={handleCheckboxChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_operational" className="ml-2 text-sm text-gray-700">
                    Operational
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Details */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Assignment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Mumbai Office"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditAssetForm;