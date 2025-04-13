import React, { useState } from "react";

const AddItemForm = ({ categoryId, onClose, onAddItem }) => {
  const [formData, setFormData] = useState({
    assetTag: "",
    serialNumber: "",
    model: "",
    status: "Select status",
    condition: "Select condition",
    assignedTo: "",
    purchaseCost: "",
    currentValue: "",
    vendor: "",
    warrantyUntil: "",
    policies: [],
    notes: "",
  });
  const [newPolicy, setNewPolicy] = useState({ name: "", description: "" });
  const [activeTab, setActiveTab] = useState(1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewPolicyChange = (e) => {
    const { name, value } = e.target;
    setNewPolicy((prev) => ({ ...prev, [name]: value }));
  };

  const addPolicy = () => {
    if (newPolicy.name.trim() && newPolicy.description.trim()) {
      setFormData((prev) => ({
        ...prev,
        policies: [
          ...prev.policies,
          { id: Date.now(), name: newPolicy.name, description: newPolicy.description },
        ],
      }));
      setNewPolicy({ name: "", description: "" });
    }
  };

  const removePolicy = (id) => {
    setFormData((prev) => ({
      ...prev,
      policies: prev.policies.filter((policy) => policy.id !== id),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.assetTag || !formData.serialNumber || !formData.model) {
      alert("Please fill in all required fields in Basic Information");
      return;
    }
    const itemData = {
      ...formData,
      categoryId,
      id: Math.random().toString(36).substring(2, 10),
    };
    onAddItem(itemData);
    onClose();
  };

  const statusOptions = ["Select status", "Active", "Inactive", "In Repair", "Retired"];
  const conditionOptions = ["Select condition", "New", "Used", "Damaged"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[650px] max-h-[90vh] overflow-y-auto shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Edit Asset Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-t-md ${activeTab === 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setActiveTab(1)}
          >
            1. Basic Information
          </button>
          <button
            className={`px-4 py-2 rounded-t-md ${activeTab === 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setActiveTab(2)}
          >
            2. Financial & Policies
          </button>
          <button
            className={`px-4 py-2 rounded-t-md ${activeTab === 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"}`}
            onClick={() => setActiveTab(3)}
          >
            3. Notes & Confirmation
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {activeTab === 1 && (
            <div>
              <h4 className="text-blue-600 font-medium mb-4">Basic Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Asset Tag</label>
                  <input
                    type="text"
                    name="assetTag"
                    value={formData.assetTag}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter asset tag"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    name="serialNumber"
                    value={formData.serialNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter serial number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Model</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter model"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {statusOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    {conditionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <input
                    type="text"
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter assignee name"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div>
              <h4 className="text-blue-600 font-medium mb-4">Financial & Policies</h4>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Cost</label>
                  <input
                    type="number"
                    name="purchaseCost"
                    value={formData.purchaseCost}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter cost"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Value</label>
                  <input
                    type="number"
                    name="currentValue"
                    value={formData.currentValue}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <input
                    type="text"
                    name="vendor"
                    value={formData.vendor}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    placeholder="Enter vendor name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Warranty Until</label>
                  <input
                    type="date"
                    name="warrantyUntil"
                    value={formData.warrantyUntil}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                </div>
              </div>
              <h4 className="text-blue-600 font-medium mb-2">Asset Policies</h4>
              {formData.policies.length > 0 && (
                <div className="space-y-2 mb-4">
                  {formData.policies.map((policy) => (
                    <div
                      key={policy.id}
                      className="p-3 border border-gray-200 rounded-md flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium text-gray-800">{policy.name}</h4>
                        <p className="text-sm text-gray-600">{policy.description}</p>
                      </div>
                      <button
                        onClick={() => removePolicy(policy.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <i className="pi pi-trash"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  name="name"
                  value={newPolicy.name}
                  onChange={handleNewPolicyChange}
                  placeholder="Policy Name"
                  className="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <input
                  type="text"
                  name="description"
                  value={newPolicy.description}
                  onChange={handleNewPolicyChange}
                  placeholder="Description"
                  className="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <button
                  type="button"
                  onClick={addPolicy}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
                >
                  Add Policy
                </button>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div>
              <h4 className="text-blue-600 font-medium mb-4">Notes & Confirmation</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  placeholder="Enter notes here..."
                  rows="4"
                />
              </div>
              <div className="mb-4">
                <h4 className="text-blue-600 font-medium mb-2">Import from Excel</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                  <div className="text-blue-500 mb-2">
                    <i className="pi pi-cloud-upload text-2xl"></i>
                  </div>
                  <p className="text-gray-600">Drop your Excel file here or</p>
                  <button className="text-blue-500 underline">Choose File</button>
                  <p className="text-sm text-gray-500">.xls, .xlsx | Max. 10,000 rows</p>
                </div>
              </div>
              <div className="mb-4">
                <h4 className="text-blue-600 font-medium mb-2">Excel Column Mapping</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Asset Tag</label>
                    <select
                      name="assetTagMap"
                      value={formData.assetTagMap || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select field</option>
                      <option value="field1">Field 1</option>
                      <option value="field2">Field 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                    <select
                      name="serialNumberMap"
                      value={formData.serialNumberMap || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select field</option>
                      <option value="field1">Field 1</option>
                      <option value="field2">Field 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <select
                      name="modelMap"
                      value={formData.modelMap || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select field</option>
                      <option value="field1">Field 1</option>
                      <option value="field2">Field 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="statusMap"
                      value={formData.statusMap || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select field</option>
                      <option value="field1">Field 1</option>
                      <option value="field2">Field 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      name="assignedToMap"
                      value={formData.assignedToMap || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select field</option>
                      <option value="field1">Field 1</option>
                      <option value="field2">Field 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purchase Cost</label>
                    <select
                      name="purchaseCostMap"
                      value={formData.purchaseCostMap || ""}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    >
                      <option value="">Select field</option>
                      <option value="field1">Field 1</option>
                      <option value="field2">Field 2</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemForm;