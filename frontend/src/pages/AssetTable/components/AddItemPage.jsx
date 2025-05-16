import React, { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";
import { createAssetItem } from "../../../store/slices/assetItemSlice";
import logger from "../../../utils/logger";

const AddItemPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const from = location.state?.from || "table";

  const [formData, setFormData] = useState({
    asset_id: "", // Changed from asset_tag to asset_id
    serial_number: "",
    model: "",
    status: "available",
    condition: "",
    assigned_to: "",
    purchase_cost: "",
    current_value: "",
    vendor: "",
    warranty_until: "",
    notes: "",
    category_id: categoryId,
    name: "",
    purchase_date: "",
    department: "",
    location: "",
    maintenance_due_date: "",
    insurance_policy: "",
    disposal_date: "",
    is_operational: true,
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: name === "is_operational" ? value === "true" : value,
    };
    setFormData(updatedFormData);
    logger.debug("Form input changed", { field: name, value, updatedFormData });
  };

  const validateForm = () => {
    if (!formData.asset_id) {
      logger.warn("Validation failed: Asset ID is required", { formData });
      return "Asset ID is required.";
    }
    if (!formData.name) {
      logger.warn("Validation failed: Asset Name is required", { formData });
      return "Asset Name is required.";
    }
    if (!formData.purchase_cost || Number(formData.purchase_cost) <= 0) {
      logger.warn("Validation failed: Purchase Cost must be a positive number", { formData });
      return "Purchase Cost must be a positive number.";
    }
    if (!formData.purchase_date) {
      logger.warn("Validation failed: Purchase Date is required", { formData });
      return "Purchase Date is required.";
    }
    logger.info("Form validation passed", { formData });
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    logger.debug("Form submission initiated", { formData });

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      logger.error("Form submission aborted due to validation error", { validationError });
      return;
    }

    try {
      // Prepare the form data for submission
      const assetData = {
        asset_id: formData.asset_id, // Changed from asset_tag to asset_id
        serial_number: formData.serial_number || undefined,
        model: formData.model || undefined,
        status: formData.status,
        condition: formData.condition || undefined,
        assigned_to: formData.assigned_to || undefined,
        purchase_cost: Number(formData.purchase_cost),
        current_value: formData.current_value ? Number(formData.current_value) : undefined,
        vendor: formData.vendor || undefined,
        warranty_until: formData.warranty_until || undefined,
        notes: formData.notes || undefined,
        category_id: formData.category_id,
        name: formData.name,
        purchase_date: formData.purchase_date,
        department: formData.department || undefined,
        location: formData.location || undefined,
        maintenance_due_date: formData.maintenance_due_date || undefined,
        insurance_policy: formData.insurance_policy || undefined,
        disposal_date: formData.disposal_date || undefined,
        is_operational: Boolean(formData.is_operational),
      };

      logger.info("Submitting new asset item to Redux action", { assetData });
      const result = await dispatch(createAssetItem(assetData)).unwrap();
      logger.info("Successfully created asset item", { result });

      setSuccessMessage("Asset created successfully!");
      setErrorMessage("");

      // Navigate with a flag to indicate a new asset was added
      logger.debug("Navigating after successful asset creation", { from, categoryId });
      setTimeout(() => {
        navigate(
          from === "assign" ? `/asset-inventory/${categoryId}/assign` : `/asset-inventory/${categoryId}`,
          { state: { from: "add-item", assetAdded: true } }
        );
      }, 1500);
    } catch (error) {
      const errorDetails = error.message || "Unknown error occurred";
      logger.error("Failed to create asset item", { error: errorDetails, stack: error.stack });
      setErrorMessage(`Failed to create asset: ${errorDetails}. Please try again.`);
      setSuccessMessage("");
    }
  };

  const handleCancel = () => {
    logger.info("Cancel button clicked, navigating back", { from, categoryId });
    navigate(from === "assign" ? `/asset-inventory/${categoryId}/assign` : `/asset-inventory/${categoryId}`);
  };

  logger.debug("Rendering AddItemPage", { formData, categoryId, from });

  return (
    <div className="p-6 bg-background-offwhite min-h-screen text-gray-900">
      <div className="mb-6 mt-20">
        <h1 className="text-xl font-semibold text-black">Add New Asset</h1>
        <p className="text-sm text-gray-400">
          Asset Management > Add New Asset
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {errorMessage}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter asset name"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  name="asset_id"
                  value={formData.asset_id}
                  onChange={handleInputChange}
                  placeholder="Enter asset ID"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Serial Number
                </label>
                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleInputChange}
                  placeholder="Enter serial number"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  placeholder="Enter model"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="under_maintenance">Under Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Condition
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select condition</option>
                  <option value="new">New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                  <option value="poor">Poor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned To
                </label>
                <input
                  type="text"
                  name="assigned_to"
                  value={formData.assigned_to}
                  onChange={handleInputChange}
                  placeholder="Enter assignee name"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  placeholder="Enter department"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Enter location"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Cost <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  name="purchase_cost"
                  value={formData.purchase_cost}
                  onChange={handleInputChange}
                  placeholder="Enter cost"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Date <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  name="purchase_date"
                  value={formData.purchase_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Value
                </label>
                <input
                  type="number"
                  name="current_value"
                  value={formData.current_value}
                  onChange={handleInputChange}
                  placeholder="Enter value"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <input
                  type="text"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  placeholder="Enter vendor name"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warranty Until
                </label>
                <input
                  type="date"
                  name="warranty_until"
                  value={formData.warranty_until}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Policy
                </label>
                <input
                  type="text"
                  name="insurance_policy"
                  value={formData.insurance_policy}
                  onChange={handleInputChange}
                  placeholder="Enter insurance policy"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Maintenance Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maintenance Due Date
                </label>
                <input
                  type="date"
                  name="maintenance_due_date"
                  value={formData.maintenance_due_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Is Operational
                </label>
                <select
                  name="is_operational"
                  value={formData.is_operational.toString()}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Disposal Date
                </label>
                <input
                  type="date"
                  name="disposal_date"
                  value={formData.disposal_date}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Notes</h2>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              placeholder="Enter notes here..."
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemPage;