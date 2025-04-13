import React, { useState, useEffect } from "react";

const EditAssetForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    id: asset.id || "",
    name: asset.name || "",
    category: asset.category || "",
    count: asset.count || 0,
    value: asset.value || 0,
    icon: asset.icon || "pi pi-desktop",
    policies: asset.policies || [], // Initialize policies from asset
  });
  const [errors, setErrors] = useState({});
  const [newPolicy, setNewPolicy] = useState({ name: "", description: "" }); // State for new policy input

  useEffect(() => {
    setFormData({
      id: asset.id || "",
      name: asset.name || "",
      category: asset.category || "",
      count: asset.count || 0,
      value: asset.value || 0,
      icon: asset.icon || "pi pi-desktop",
      policies: asset.policies ? [...asset.policies] : [], // Deep copy to avoid mutation
    });
    setNewPolicy({ name: "", description: "" }); // Reset new policy input
  }, [asset]);

  // Prepopulate with sample data to match the image
  useEffect(() => {
    setFormData({
      id: asset.id || "",
      name: "Laptops",
      category: "Electronics",
      count: 50,
      value: 75000,
      icon: "pi pi-laptop",
      policies: [
        { id: 1, name: "Laptop Usage Policy", description: "Guidelines for using company laptops" },
        { id: 2, name: "Maintenance Policy", description: "Regular maintenance and care instructions" },
      ],
    });
  }, [asset]);

  const categoryOptions = [
    { label: "Electronics", value: "Electronics" },
    { label: "Hardware", value: "Hardware" },
    { label: "Stationery", value: "Stationery" },
  ];

  const iconOptions = [
    { label: "Desktop", value: "pi pi-desktop" },
    { label: "Laptop", value: "pi pi-laptop" },
    { label: "Tablet", value: "pi pi-tablet" },
    { label: "Box", value: "pi pi-box" },
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.category) newErrors.category = "Category is required";
    if (formData.count <= 0 || !Number.isInteger(formData.count))
      newErrors.count = "Count must be a positive integer";
    if (formData.value <= 0)
      newErrors.value = "Value must be a positive number";
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "count" || name === "value" ? Number(value) : value,
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
          {
            id: Date.now(),
            name: newPolicy.name,
            description: newPolicy.description,
          },
        ],
      }));
      setNewPolicy({ name: "", description: "" }); // Reset input
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
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length === 0) {
      onUpdateAsset(formData);
      onClose();
    } else {
      setErrors(validationErrors);
    }
  };

  const handleDelete = () => {
    // Add delete logic here, e.g., call a delete function and close
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 min-w-[400px] min-h-[500px] flex flex-col justify-between shadow-lg">
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Edit Asset: {formData.name}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="pi pi-times"></i>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                <option value="">Select a category</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
            </div>

            <div className="flex space-x-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">Count</label>
                <input
                  type="number"
                  name="count"
                  value={formData.count}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  min="0"
                />
                {errors.count && <p className="text-red-500 text-sm">{errors.count}</p>}
              </div>
              <div className="w-1/2">
                <label className="block text-sm font-medium text-gray-700">Value (₹)</label>
                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  min="0"
                  step="0.01"
                />
                {errors.value && <p className="text-red-500 text-sm">{errors.value}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Icon</label>
              <select
                name="icon"
                value={formData.icon}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              >
                {iconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Policies</label>
              {formData.policies.length > 0 && (
                <div className="space-y-2 mt-2">
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
              <div className="mt-4 flex items-center space-x-2">
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
                  placeholder="Policy Description"
                  className="mt-1 block w-1/3 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <button
                  type="button"
                  onClick={addPolicy}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
                >
                  + Add Policy
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 flex items-center"
          >
            <i className="pi pi-trash mr-2"></i> Delete Asset
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAssetForm;