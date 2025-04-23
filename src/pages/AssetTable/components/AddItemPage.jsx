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

  const from = location.state?.from || "table"; // Default to "table" if no state is provided

  const [formData, setFormData] = useState({
    asset_tag: "",
    serial_number: "",
    model: "",
    status: "",
    condition: "",
    assigned_to: "",
    purchase_cost: "",
    current_value: "",
    vendor: "",
    warranty_until: "",
    notes: "",
    category_id: categoryId,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      logger.info("Submitting new asset item", { formData });
      await dispatch(createAssetItem(formData)).unwrap();
      logger.info("Successfully created asset item");
      navigate(from === "assign" ? `/asset-inventory/${categoryId}/assign` : `/asset-inventory/${categoryId}`);
    } catch (error) {
      logger.error("Failed to create asset item", { error });
    }
  };

  const handleCancel = () => {
    logger.info("Cancel button clicked");
    navigate(from === "assign" ? `/asset-inventory/${categoryId}/assign` : `/asset-inventory/${categoryId}`);
  };

  return (
    <div className="p-6 bg-background-offwhite min-h-screen text-gray-900">
      <div className="mb-6 mt-20">
        <h1 className="text-xl font-semibold text-black">Add New Asset</h1>
        <p className="text-sm text-gray-400">
          Asset Management > Add New Asset
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Tag
                </label>
                <input
                  type="text"
                  name="asset_tag"
                  value={formData.asset_tag}
                  onChange={handleInputChange}
                  placeholder="Enter asset tag"
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
                  <option value="">Select status</option>
                  <option value="In Use">In Use</option>
                  <option value="In Storage">In Storage</option>
                  <option value="Under Repair">Under Repair</option>
                  <option value="Retired">Retired</option>
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
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
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
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-4">
              Financial Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purchase Cost
                </label>
                <input
                  type="number"
                  name="purchase_cost"
                  value={formData.purchase_cost}
                  onChange={handleInputChange}
                  placeholder="Enter cost"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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