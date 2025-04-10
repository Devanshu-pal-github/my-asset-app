import React, { useState } from "react";

const AddAssetForm = ({ onClose, onAddAsset }) => {
  const [formData, setFormData] = useState({
    assetType: "",
    category: "Hardware",
    description: "",
    allowedStatus: [],
    selectedAllowedStatus: "",
    isReassignable: false,
    isConsumable: false,
    requiresMaintenance: false,
    isRecurring: false,
    maintenanceFrequency: "1 month",
    maintenanceAlertBeforeDue: 0,
    hasSpecifications: false,
    specifications: [{ key: "", value: "" }],
    requiresDocumentUploads: {
      purchaseInvoice: false,
      warrantyDocument: false,
      insurance: false,
      maintenanceLog: false,
      customUploads: [],
    },
    depreciationRequirements: {
      purchaseInvoice: false,
      warrantyDocument: false,
      insurance: false,
      depreciationSchedule: false,
      customDepreciation: [],
    },
    costPerUnit: 0,
    expectedLife: 0,
    depreciationMethod: "Straight Line",
    residualValue: 0,
    defaultAssignmentDuration: 0,
    canBeAssignedTo: "Employee",
    allowMultipleAssignments: false,
    isDisposable: false,
    hasTemplate: false,
    isTrackable: false,
    trackingMethod: "",
    vendor: "",
    manufacturer: "",
  });

  const [newCustomUpload, setNewCustomUpload] = useState("");
  const [newCustomDepreciation, setNewCustomDepreciation] = useState("");

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      if (
        name.startsWith("requiresDocumentUploads") ||
        name.startsWith("depreciationRequirements")
      ) {
        const [section, field] = name.split(".");
        setFormData((prev) => ({
          ...prev,
          [section]: { ...prev[section], [field]: checked },
        }));
      } else {
        setFormData((prev) => ({ ...prev, [name]: checked }));
      }
    } else if (name === "selectedAllowedStatus") {
      setFormData((prev) => {
        const updatedStatus = prev.allowedStatus.includes(value)
          ? prev.allowedStatus.filter((status) => status !== value)
          : [...prev.allowedStatus, value];
        return {
          ...prev,
          allowedStatus: updatedStatus,
          selectedAllowedStatus: "",
        };
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecifications = [...formData.specifications];
    newSpecifications[index][field] = value;
    setFormData((prev) => ({ ...prev, specifications: newSpecifications }));
  };

  const addCustomUpload = () => {
    if (
      newCustomUpload &&
      !formData.requiresDocumentUploads.customUploads.includes(newCustomUpload)
    ) {
      setFormData((prev) => ({
        ...prev,
        requiresDocumentUploads: {
          ...prev.requiresDocumentUploads,
          customUploads: [
            ...prev.requiresDocumentUploads.customUploads,
            newCustomUpload,
          ],
        },
      }));
      setNewCustomUpload("");
    }
  };

  const removeCustomUpload = (itemToRemove) => {
    setFormData((prev) => ({
      ...prev,
      requiresDocumentUploads: {
        ...prev.requiresDocumentUploads,
        customUploads: prev.requiresDocumentUploads.customUploads.filter(
          (item) => item !== itemToRemove
        ),
      },
    }));
  };

  const addCustomDepreciation = () => {
    if (
      newCustomDepreciation &&
      !formData.depreciationRequirements.customDepreciation.includes(
        newCustomDepreciation
      )
    ) {
      setFormData((prev) => ({
        ...prev,
        depreciationRequirements: {
          ...prev.depreciationRequirements,
          customDepreciation: [
            ...prev.depreciationRequirements.customDepreciation,
            newCustomDepreciation,
          ],
        },
      }));
      setNewCustomDepreciation("");
    }
  };

  const removeCustomDepreciation = (itemToRemove) => {
    setFormData((prev) => ({
      ...prev,
      depreciationRequirements: {
        ...prev.depreciationRequirements,
        customDepreciation:
          prev.depreciationRequirements.customDepreciation.filter(
            (item) => item !== itemToRemove
          ),
      },
    }));
  };

  const handleKeyPress = (e, addFunction) => {
    if (e.key === "Enter" && e.target.value.trim()) {
      e.preventDefault();
      addFunction();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !formData.assetType ||
      !formData.category ||
      formData.allowedStatus.length === 0
    ) {
      alert(
        "Please fill all required fields (Asset Type, Category, and at least one Allowed Status)."
      );
      return;
    }
    onAddAsset(formData);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Basic Information
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Asset Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="assetType"
              value={formData.assetType}
              onChange={handleChange}
              placeholder="e.g., Laptop"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              required
            >
              <option value="Hardware">Hardware</option>
              <option value="Stationery">Stationery</option>
              <option value="Furniture">Furniture</option>
              <option value="Electronics">Electronics</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-600 font-medium mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter a brief description..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            rows="2"
          />
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-600 font-medium mb-1">
            Allowed Status <span className="text-red-500">*</span>
          </label>
          <select
            name="selectedAllowedStatus"
            value={formData.selectedAllowedStatus}
            onChange={handleChange}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
          >
            <option value="">Select Status</option>
            <option value="Allocated">Allocated</option>
            <option value="UnderMaintenance">Under Maintenance</option>
            <option value="MaintenanceRequested">Maintenance Requested</option>
            <option value="NotAllocated">Not Allocated</option>
            <option value="Consumed">Consumed</option>
          </select>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.allowedStatus.map((status, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs flex items-center"
              >
                {status}
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      allowedStatus: prev.allowedStatus.filter(
                        (s) => s !== status
                      ),
                    }))
                  }
                  className="ml-1 text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Reusability & Consumption */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Reusability & Consumption
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isReassignable"
              checked={formData.isReassignable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">
              Is this asset type reassignable?
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isConsumable"
              checked={formData.isConsumable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">
              Is this a consumable item?
            </span>
          </label>
        </div>
      </div>

      {/* Maintenance Settings */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Maintenance Settings
        </h4>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="requiresMaintenance"
            checked={formData.requiresMaintenance}
            onChange={handleChange}
            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
          />
          <span className="text-sm text-gray-600">Requires Maintenance?</span>
        </label>
        {formData.requiresMaintenance && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isRecurring"
                checked={formData.isRecurring}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Is it Recurring?</span>
            </label>
            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Frequency
              </label>
              <select
                name="maintenanceFrequency"
                value={formData.maintenanceFrequency}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                disabled={!formData.isRecurring}
              >
                <option value="1 month">1 month</option>
                <option value="3 months">3 months</option>
                <option value="6 months">6 months</option>
                <option value="1 year">1 year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Alert Before Due
              </label>
              <input
                type="number"
                name="maintenanceAlertBeforeDue"
                value={formData.maintenanceAlertBeforeDue}
                onChange={handleChange}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                placeholder="0 days"
                disabled={!formData.isRecurring}
              />
            </div>
          </div>
        )}
      </div>

      {/* Specifications */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Specifications
        </h4>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="hasSpecifications"
            checked={formData.hasSpecifications}
            onChange={handleChange}
            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
          />
          <span className="text-sm text-gray-600">Has Specifications?</span>
        </label>
        {formData.hasSpecifications && (
          <div className="mt-3 space-y-2">
            {formData.specifications.map((spec, index) => (
              <div key={index} className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={spec.key}
                  onChange={(e) =>
                    handleSpecificationChange(index, "key", e.target.value)
                  }
                  placeholder="Key (e.g., RAM)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) =>
                    handleSpecificationChange(index, "value", e.target.value)
                  }
                  placeholder="Value (e.g., 16GB)"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  specifications: [
                    ...prev.specifications,
                    { key: "", value: "" },
                  ],
                }))
              }
              className="text-blue-500 hover:text-blue-700 text-xs font-medium mt-2"
            >
              + Add More
            </button>
          </div>
        )}
      </div>

      {/* Documentation Requirements */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Documentation Requirements
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="requiresDocumentUploads.all"
              checked={
                formData.requiresDocumentUploads.purchaseInvoice ||
                formData.requiresDocumentUploads.warrantyDocument ||
                formData.requiresDocumentUploads.insurance ||
                formData.requiresDocumentUploads.maintenanceLog ||
                formData.requiresDocumentUploads.customUploads.length > 0
              }
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  requiresDocumentUploads: {
                    ...prev.requiresDocumentUploads,
                    purchaseInvoice: checked,
                    warrantyDocument: checked,
                    insurance: checked,
                    maintenanceLog: checked,
                  },
                }));
              }}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">
              Requires Document Uploads
            </span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresDocumentUploads.purchaseInvoice"
                checked={formData.requiresDocumentUploads.purchaseInvoice}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Purchase Invoice</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresDocumentUploads.warrantyDocument"
                checked={formData.requiresDocumentUploads.warrantyDocument}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Warranty Document</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresDocumentUploads.insurance"
                checked={formData.requiresDocumentUploads.insurance}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Insurance</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="requiresDocumentUploads.maintenanceLog"
                checked={formData.requiresDocumentUploads.maintenanceLog}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Maintenance Log</span>
            </label>
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={newCustomUpload}
              onChange={(e) => setNewCustomUpload(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addCustomUpload)}
              placeholder="Custom document type"
              className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={addCustomUpload}
              className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              + Add Custom Document Type
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.requiresDocumentUploads.customUploads.map(
              (doc, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs flex items-center"
                >
                  {doc}
                  <button
                    type="button"
                    onClick={() => removeCustomUpload(doc)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Depreciation Requirements */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Depreciation Requirements
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="depreciationRequirements.all"
              checked={
                formData.depreciationRequirements.purchaseInvoice ||
                formData.depreciationRequirements.warrantyDocument ||
                formData.depreciationRequirements.insurance ||
                formData.depreciationRequirements.depreciationSchedule ||
                formData.depreciationRequirements.customDepreciation.length > 0
              }
              onChange={(e) => {
                const checked = e.target.checked;
                setFormData((prev) => ({
                  ...prev,
                  depreciationRequirements: {
                    ...prev.depreciationRequirements,
                    purchaseInvoice: checked,
                    warrantyDocument: checked,
                    insurance: checked,
                    depreciationSchedule: checked,
                  },
                }));
              }}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">
              Requires Document Uploads
            </span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="depreciationRequirements.purchaseInvoice"
                checked={formData.depreciationRequirements.purchaseInvoice}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Purchase Invoice</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="depreciationRequirements.warrantyDocument"
                checked={formData.depreciationRequirements.warrantyDocument}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Warranty Document</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="depreciationRequirements.insurance"
                checked={formData.depreciationRequirements.insurance}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">Insurance</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="depreciationRequirements.depreciationSchedule"
                checked={formData.depreciationRequirements.depreciationSchedule}
                onChange={handleChange}
                className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
              />
              <span className="text-sm text-gray-600">
                Depreciation Schedule
              </span>
            </label>
          </div>
          <div className="mt-3">
            <input
              type="text"
              value={newCustomDepreciation}
              onChange={(e) => setNewCustomDepreciation(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, addCustomDepreciation)}
              placeholder="Custom document type"
              className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={addCustomDepreciation}
              className="mt-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              + Add Custom Document Type
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {formData.depreciationRequirements.customDepreciation.map(
              (doc, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md text-xs flex items-center"
                >
                  {doc}
                  <button
                    type="button"
                    onClick={() => removeCustomDepreciation(doc)}
                    className="ml-1 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Cost & Depreciation */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Cost & Depreciation
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Cost Per Unit <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="costPerUnit"
              value={formData.costPerUnit}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="$0.00"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Expected Life <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="expectedLife"
              value={formData.expectedLife}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Depreciation Method
            </label>
            <select
              name="depreciationMethod"
              value={formData.depreciationMethod}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="Straight Line">Straight Line</option>
              <option value="Declining Balance">Declining Balance</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Residual Value
            </label>
            <input
              type="number"
              name="residualValue"
              value={formData.residualValue}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="$0.00"
            />
          </div>
        </div>
      </div>

      {/* Assignment Rules */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Assignment Rules
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Default Assignment Duration
            </label>
            <input
              type="number"
              name="defaultAssignmentDuration"
              value={formData.defaultAssignmentDuration}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              placeholder="0 Days"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 font-medium mb-1">
              Can Be Assigned to
            </label>
            <select
              name="canBeAssignedTo"
              value={formData.canBeAssignedTo}
              onChange={handleChange}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="Employee">Employee</option>
              <option value="Department">Department</option>
              <option value="Team">Team</option>
            </select>
          </div>
        </div>
        <label className="flex items-center space-x-2 mt-3">
          <input
            type="checkbox"
            name="allowMultipleAssignments"
            checked={formData.allowMultipleAssignments}
            onChange={handleChange}
            className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
          />
          <span className="text-sm text-gray-600">
            Allow Multiple Assignments?
          </span>
        </label>
      </div>

      {/* Final Options */}
      <div className="bg-white p-4 rounded-md shadow-sm">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Final Options
        </h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isDisposable"
              checked={formData.isDisposable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">
              Is Disposable Asset Type?
            </span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="hasTemplate"
              checked={formData.hasTemplate}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">Have as Template?</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isTrackable"
              checked={formData.isTrackable}
              onChange={handleChange}
              className="h-4 w-4 text-blue-500 focus:ring-blue-400 border-gray-200 rounded"
            />
            <span className="text-sm text-gray-600">Is Trackable?</span>
          </label>
          {formData.isTrackable && (
            <div className="mt-3">
              <label className="block text-xs text-gray-600 font-medium mb-1">
                Tracking Method
              </label>
              <input
                type="text"
                name="trackingMethod"
                value={formData.trackingMethod}
                onChange={handleChange}
                placeholder="e.g., RFID, GPS"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md text-sm hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors"
        >
          Create Asset Type
        </button>
      </div>
    </form>
  );
};

export default AddAssetForm;
