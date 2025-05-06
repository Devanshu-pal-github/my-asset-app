import React, { useState, useEffect } from "react";
import logger from "../../../utils/logger";

const EditAssetForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    category_name: asset.category_name || "",
    description: asset.description || "",
    category_type: asset.category_type || "",
    is_active: asset.is_active !== undefined ? asset.is_active : true,
    is_reassignable: asset.is_reassignable !== undefined ? asset.is_reassignable : true,
    is_allotable: asset.is_allotted !== undefined ? asset.is_allotted : false,
    is_consumable: asset.is_consumable !== undefined ? asset.is_consumable : false,
    requires_maintenance: asset.requires_maintenance !== undefined ? asset.requires_maintenance : false,
    maintenance_frequency: asset.maintenance_frequency || "",
    maintenance_alert_days: asset.maintenance_alert_days || "",
    cost_per_unit: asset.cost_per_unit || "",
    expected_life: asset.expected_life || "",
    life_unit: asset.life_unit || "",
    depreciation_method: asset.depreciation_method || "",
    residual_value: asset.residual_value || "",
    assignment_policies: {
      max_assignments: asset.assignment_policies?.max_assignments || 1,
      assignable_to: asset.assignment_policies?.assignable_to || "",
      assignment_duration: asset.assignment_policies?.assignment_duration || "",
      duration_unit: asset.assignment_policies?.duration_unit || "",
      allow_multiple_assignments: asset.assignment_policies?.allow_multiple_assignments !== undefined ? asset.assignment_policies.allow_multiple_assignments : false,
    },
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    logger.debug("EditAssetForm initialized with asset:", {
      assetId: asset._id,
    });
  }, [asset]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("assignment_policies.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        assignment_policies: {
          ...prev.assignment_policies,
          [field]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.category_name.trim()) newErrors.category_name = "Category name is required";
    if (formData.cost_per_unit && isNaN(formData.cost_per_unit))
      newErrors.cost_per_unit = "Must be a valid number";
    if (formData.expected_life && isNaN(formData.expected_life))
      newErrors.expected_life = "Must be a valid number";
    if (formData.residual_value && isNaN(formData.residual_value))
      newErrors.residual_value = "Must be a valid number";
    if (formData.maintenance_alert_days && isNaN(formData.maintenance_alert_days)) {
      newErrors.maintenance_alert_days = "Must be a valid number";
    }
    if (
      formData.assignment_policies.max_assignments &&
      isNaN(formData.assignment_policies.max_assignments)
    ) {
      newErrors["assignment_policies.max_assignments"] = "Must be a valid number";
    }
    if (
      formData.assignment_policies.assignment_duration &&
      isNaN(formData.assignment_policies.assignment_duration)
    ) {
      newErrors["assignment_policies.assignment_duration"] = "Must be a valid number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    logger.debug("Submitting EditAssetForm:", { formData });
    if (!validateForm()) {
      logger.warn("Form validation failed:", { errors });
      return;
    }
    const submitData = {
      category_name: formData.category_name,
      description: formData.description,
      category_type: formData.category_type,
      is_active: formData.is_active,
      is_reassignable: formData.is_reassignable,
      is_allotted: formData.is_allotable,
      is_consumable: formData.is_consumable,
      requires_maintenance: formData.requires_maintenance,
      maintenance_frequency: formData.maintenance_frequency || null,
      maintenance_alert_days: formData.maintenance_alert_days ? Number(formData.maintenance_alert_days) : null,
      cost_per_unit: formData.cost_per_unit ? Number(formData.cost_per_unit) : null,
      expected_life: formData.expected_life ? Number(formData.expected_life) : null,
      life_unit: formData.life_unit || null,
      depreciation_method: formData.depreciation_method || null,
      residual_value: formData.residual_value ? Number(formData.residual_value) : null,
      assignment_policies: {
        max_assignments: Number(formData.assignment_policies.max_assignments) || 1,
        assignable_to: formData.assignment_policies.assignable_to || null,
        assignment_duration: formData.assignment_policies.assignment_duration ? Number(formData.assignment_policies.assignment_duration) : null,
        duration_unit: formData.assignment_policies.duration_unit || null,
        allow_multiple_assignments: formData.assignment_policies.allow_multiple_assignments,
      },
    };
    onUpdateAsset(submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
      <div className="bg-gray-50 rounded-xl p-8 w-full max-w-4xl z-50 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header */}
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-900">Edit Category</h3>
          </div>

          {/* Basic Information Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  name="category_name"
                  value={formData.category_name}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.category_name && <p className="text-red-500 text-sm mt-1">{errors.category_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Type</label>
                <input
                  type="text"
                  name="category_type"
                  value={formData.category_type}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="4"
                />
              </div>
            </div>
          </div>

          {/* Asset Properties Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Asset Properties</h4>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Is Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_reassignable"
                  checked={formData.is_reassignable}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Is Reassignable</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_allotable"
                  checked={formData.is_allotable}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Is Allotable</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_consumable"
                  checked={formData.is_consumable}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4"
                />
                <span className="text-sm font-medium text-gray-700">Is Consumable</span>
              </label>
            </div>
          </div>

          {/* Maintenance Settings Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Maintenance Settings</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requires_maintenance"
                    checked={formData.requires_maintenance}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Requires Maintenance</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Frequency</label>
                <input
                  type="text"
                  name="maintenance_frequency"
                  value={formData.maintenance_frequency}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Alert Days</label>
                <input
                  type="number"
                  name="maintenance_alert_days"
                  value={formData.maintenance_alert_days}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.maintenance_alert_days && (
                  <p className="text-red-500 text-sm mt-1">{errors.maintenance_alert_days}</p>
                )}
              </div>
            </div>
          </div>

          {/* Financial Details Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Financial Details</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Unit</label>
                <input
                  type="number"
                  name="cost_per_unit"
                  value={formData.cost_per_unit}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.cost_per_unit && (
                  <p className="text-red-500 text-sm mt-1">{errors.cost_per_unit}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Life</label>
                <input
                  type="number"
                  name="expected_life"
                  value={formData.expected_life}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.expected_life && (
                  <p className="text-red-500 text-sm mt-1">{errors.expected_life}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Life Unit</label>
                <input
                  type="text"
                  name="life_unit"
                  value={formData.life_unit}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Method</label>
                <input
                  type="text"
                  name="depreciation_method"
                  value={formData.depreciation_method}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Residual Value</label>
                <input
                  type="number"
                  name="residual_value"
                  value={formData.residual_value}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors.residual_value && (
                  <p className="text-red-500 text-sm mt-1">{errors.residual_value}</p>
                )}
              </div>
            </div>
          </div>

          {/* Assignment Policies Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Assignment Policies</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Assignments</label>
                <input
                  type="number"
                  name="assignment_policies.max_assignments"
                  value={formData.assignment_policies.max_assignments}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors["assignment_policies.max_assignments"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["assignment_policies.max_assignments"]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignable To</label>
                <input
                  type="text"
                  name="assignment_policies.assignable_to"
                  value={formData.assignment_policies.assignable_to}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Duration</label>
                <input
                  type="number"
                  name="assignment_policies.assignment_duration"
                  value={formData.assignment_policies.assignment_duration}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {errors["assignment_policies.assignment_duration"] && (
                  <p className="text-red-500 text-sm mt-1">{errors["assignment_policies.assignment_duration"]}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration Unit</label>
                <input
                  type="text"
                  name="assignment_policies.duration_unit"
                  value={formData.assignment_policies.duration_unit}
                  onChange={handleChange}
                  className="block w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="assignment_policies.allow_multiple_assignments"
                    checked={formData.assignment_policies.allow_multiple_assignments}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Multiple Assignments</span>
                </label>
              </div>
            </div>
          </div>

          {/* Computed Fields Section */}
          <div className="border-b pb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Computed Fields (Read-Only)</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Total Items</span>
                <span className="text-sm font-semibold text-gray-900">{asset.total_assets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Total Value</span>
                <span className="text-sm font-semibold text-gray-900">
                  {asset.total_cost?.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) || '₹0'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Assigned Count</span>
                <span className="text-sm font-semibold text-gray-900">{asset.assigned_assets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Maintenance Count</span>
                <span className="text-sm font-semibold text-gray-900">{asset.under_maintenance || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Utilization Rate</span>
                <span className="text-sm font-semibold text-gray-900">
                  {asset.total_assets ? ((asset.assigned_assets || 0) / asset.total_assets * 100).toFixed(0) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-6 rounded-md transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-6 rounded-md transition-all duration-200"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAssetForm;