import React, { useState, useEffect } from 'react';
import logger from '../../../utils/logger';

/**
 * Form component to edit asset specifications and financial details
 */
const EditAssetSpecsAndFinanceForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    specifications: '',
    notes: '',
    purchase_cost: '',
    current_value: '',
    purchase_date: '',
    warranty_expiration: '',
    vendor: '',
    insurance_policy: '',
    disposal_date: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Load asset data into form when component mounts or asset changes
  useEffect(() => {
    if (asset) {
      setFormData({
        specifications: asset.specifications ? JSON.stringify(asset.specifications) : '',
        notes: asset.notes || '',
        purchase_cost: asset.purchase_cost ? String(asset.purchase_cost) : '',
        current_value: asset.current_value ? String(asset.current_value) : '',
        purchase_date: asset.purchase_date && asset.purchase_date !== 'N/A' ? asset.purchase_date.split('T')[0] : '',
        warranty_expiration: asset.warranty_expiration && asset.warranty_expiration !== 'N/A' ? asset.warranty_expiration.split('T')[0] : '',
        vendor: asset.vendor || '',
        insurance_policy: asset.insurance_policy || '',
        disposal_date: asset.disposal_date && asset.disposal_date !== 'N/A' ? asset.disposal_date.split('T')[0] : '',
      });
      logger.debug('Loaded asset data into form (specs and finance)', { assetId: asset.id });
    }
  }, [asset]);

  const validateForm = () => {
    const newErrors = {};
    if (formData.purchase_cost && isNaN(formData.purchase_cost)) newErrors.purchase_cost = 'Purchase Cost must be a number';
    if (formData.current_value && isNaN(formData.current_value)) newErrors.current_value = 'Current Value must be a number';
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
        specifications: formData.specifications ? JSON.parse(formData.specifications) : {},
        notes: formData.notes || null,
        purchase_cost: formData.purchase_cost ? Number(formData.purchase_cost) : null,
        current_value: formData.current_value ? Number(formData.current_value) : null,
        purchase_date: formData.purchase_date || null,
        warranty_expiration: formData.warranty_expiration || null,
        vendor: formData.vendor || null,
        insurance_policy: formData.insurance_policy || null,
        disposal_date: formData.disposal_date || null,
      };

      logger.debug('Submitting updated asset data (specs and finance)', { finalData });
      await onUpdateAsset(finalData);
      logger.info('Asset specs and finance updated successfully', { assetId: asset.id });
      onClose();
    } catch (error) {
      setApiError(error.message || 'Failed to update asset');
      logger.error('Failed to update asset specs and finance', { error: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 max-w-3xl mx-auto rounded-lg shadow-md border border-gray-200">
      {apiError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 text-sm">
          {apiError}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Specifications */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Specifications
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label htmlFor="specifications" className="block text-sm font-medium text-gray-700">
                  Specifications
                </label>
                <textarea
                  id="specifications"
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder='e.g., {"processor": "Intel i7", "ram": "16GB"}'
                  rows="3"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add any notes"
                  rows="3"
                />
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              Financial Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">
                  Vendor
                </label>
                <input
                  type="text"
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Dell India Pvt Ltd"
                />
              </div>
              <div>
                <label htmlFor="purchase_cost" className="block text-sm font-medium text-gray-700">
                  Purchase Cost
                </label>
                <input
                  type="text"
                  id="purchase_cost"
                  name="purchase_cost"
                  value={formData.purchase_cost}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.purchase_cost ? 'border-red-500' : 'border-gray-300'} p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., 80000"
                />
                {errors.purchase_cost && <p className="text-red-500 text-xs mt-1">{errors.purchase_cost}</p>}
              </div>
              <div>
                <label htmlFor="current_value" className="block text-sm font-medium text-gray-700">
                  Current Value
                </label>
                <input
                  type="text"
                  id="current_value"
                  name="current_value"
                  value={formData.current_value}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md border ${errors.current_value ? 'border-red-500' : 'border-gray-300'} p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., 75000"
                />
                {errors.current_value && <p className="text-red-500 text-xs mt-1">{errors.current_value}</p>}
              </div>
              <div>
                <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-700">
                  Purchase Date
                </label>
                <input
                  type="date"
                  id="purchase_date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="warranty_expiration" className="block text-sm font-medium text-gray-700">
                  Warranty Expiration
                </label>
                <input
                  type="date"
                  id="warranty_expiration"
                  name="warranty_expiration"
                  value={formData.warranty_expiration}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="disposal_date" className="block text-sm font-medium text-gray-700">
                  Disposal Date
                </label>
                <input
                  type="date"
                  id="disposal_date"
                  name="disposal_date"
                  value={formData.disposal_date}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="insurance_policy" className="block text-sm font-medium text-gray-700">
                  Insurance Policy
                </label>
                <input
                  type="text"
                  id="insurance_policy"
                  name="insurance_policy"
                  value={formData.insurance_policy}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Policy #12345"
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

export default EditAssetSpecsAndFinanceForm;