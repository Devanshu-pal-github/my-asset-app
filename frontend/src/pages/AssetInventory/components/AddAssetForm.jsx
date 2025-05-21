import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addAssetCategory } from "../../../store/slices/assetCategorySlice";
import logger from "../../../utils/logger";

const AddCategory = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    category_name: "",
    category_type: "hardware",
    description: "",
    can_be_assigned_reassigned: false,
    is_consumable: false,
    is_allotted: false,
    maintenance_required: false,
    is_recurring_maintenance: false,
    maintenance_frequency: "1month",
    alert_before_due: "",
    has_specifications: false,
    specifications: [{ key: "", value: "" }],
    required_documents: false,
    documents: {
      purchase: false,
      warranty: false,
      insurance: false,
      custom: [],
    },
    cost_per_unit: "",
    expected_life: "",
    life_unit: "years",
    depreciation_method: "straight_line",
    residual_value: "",
    default_assignment_duration: "",
    assignment_duration_unit: "days",
    can_be_assigned_to: "single_employee",
    allow_multiple_assignments: false,
    is_enabled: true,
    save_as_template: false,
    total_assets: 0, // Added for card display
    assigned_assets: 0, // Added for card display
    under_maintenance: 0, // Added for card display
    total_cost: 0, // Added for card display
    policies: [] // Add policies array to store policy statements
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData((prev) => ({ ...prev, specifications: newSpecs }));
  };

  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: "", value: "" }],
    }));
  };

  const handleDocumentChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, [field]: value },
    }));
  };

  const addCustomDocument = () => {
    setFormData((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        custom: [...prev.documents.custom, ""],
      },
    }));
  };

  const handleCustomDocumentChange = (index, value) => {
    const newCustomDocs = [...formData.documents.custom];
    newCustomDocs[index] = value;
    setFormData((prev) => ({
      ...prev,
      documents: { ...prev.documents, custom: newCustomDocs },
    }));
  };

  const handlePolicyChange = (index, value) => {
    const newPolicies = [...formData.policies];
    newPolicies[index] = value;
    setFormData(prev => ({
      ...prev,
      policies: newPolicies
    }));
  };

  const addPolicy = () => {
    setFormData(prev => ({
      ...prev,
      policies: [...prev.policies, ""]
    }));
  };

  const removePolicy = (index) => {
    const newPolicies = [...formData.policies];
    newPolicies.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      policies: newPolicies
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Ensure is_consumable and is_allotted are not both true
    if (formData.is_consumable && formData.is_allotted) {
      alert("A category cannot be both consumable and allotted.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      logger.info("Submitting new category", { formData });
      
      // Convert string values to numbers where appropriate
      const preparedData = {
        ...formData,
        cost_per_unit: formData.cost_per_unit ? Number(formData.cost_per_unit) : null,
        expected_life: formData.expected_life ? Number(formData.expected_life) : null,
        residual_value: formData.residual_value ? Number(formData.residual_value) : null,
        default_assignment_duration: formData.default_assignment_duration ? Number(formData.default_assignment_duration) : null,
        alert_before_due: formData.alert_before_due ? Number(formData.alert_before_due) : null,
      };

      // Use Redux to save category to backend
      const result = await dispatch(addAssetCategory(preparedData)).unwrap();
      logger.info("Category added successfully", { result });
      
      // Navigate back to inventory with success
      navigate("/asset-inventory");
    } catch (err) {
      logger.error("Failed to create category", { error: err.message });
      setError(err.message || "Failed to create category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-24 p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Category</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Category Name</label>
              <input
                type="text"
                name="category_name"
                value={formData.category_name}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category Type</label>
              <select
                name="category_type"
                value={formData.category_type}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              >
                <option value="hardware">Hardware</option>
                <option value="software">Software</option>
                <option value="stationery">Stationery</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* Reusability and Consumption */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Reusability and Consumption</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="can_be_assigned_reassigned"
                checked={formData.can_be_assigned_reassigned}
                onChange={handleInputChange}
                className="mr-2"
              />
              Can be assigned and reassigned
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_consumable"
                checked={formData.is_consumable}
                onChange={handleInputChange}
                className="mr-2"
              />
              Is consumable (one-time use with ID tracking)
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_allotted"
                checked={formData.is_allotted}
                onChange={handleInputChange}
                className="mr-2"
              />
              Is allotted (one-time assignment, no asset ID tracking)
            </label>
          </div>
        </div>

        {/* Maintenance Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Maintenance Settings</h3>
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="maintenance_required"
                checked={formData.maintenance_required}
                onChange={handleInputChange}
                className="mr-2"
              />
              Requires Maintenance
            </label>
            {formData.maintenance_required && (
              <>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_recurring_maintenance"
                    checked={formData.is_recurring_maintenance}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Is Recurring
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maintenance Frequency</label>
                  <select
                    name="maintenance_frequency"
                    value={formData.maintenance_frequency}
                    onChange={handleInputChange}
                    className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
                  >
                    <option value="1month">1 Month</option>
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alert Before Due (days)</label>
                  <input
                    type="number"
                    name="alert_before_due"
                    value={formData.alert_before_due}
                    onChange={handleInputChange}
                    className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Specifications</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="has_specifications"
              checked={formData.has_specifications}
              onChange={handleInputChange}
              className="mr-2"
            />
            Has Specifications
          </label>
          {formData.has_specifications && (
            <div className="mt-4 space-y-4">
              {formData.specifications.map((spec, index) => (
                <div key={index} className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Key"
                    value={spec.key}
                    onChange={(e) => handleSpecificationChange(index, "key", e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={spec.value}
                    onChange={(e) => handleSpecificationChange(index, "value", e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg w-full"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={addSpecification}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add Specification
              </button>
            </div>
          )}
        </div>

        {/* Documentation Requirements */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Documentation Requirements</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="required_documents"
              checked={formData.required_documents}
              onChange={handleInputChange}
              className="mr-2"
            />
            Requires Documents
          </label>
          {formData.required_documents && (
            <div className="mt-4 space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.documents.purchase}
                  onChange={(e) => handleDocumentChange("purchase", e.target.checked)}
                  className="mr-2"
                />
                Purchase Documents
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.documents.warranty}
                  onChange={(e) => handleDocumentChange("warranty", e.target.checked)}
                  className="mr-2"
                />
                Warranty Documents
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.documents.insurance}
                  onChange={(e) => handleDocumentChange("insurance", e.target.checked)}
                  className="mr-2"
                />
                Insurance Documents
              </label>
              {formData.documents.custom.map((doc, index) => (
                <input
                  key={index}
                  type="text"
                  placeholder="Custom Document Type"
                  value={doc}
                  onChange={(e) => handleCustomDocumentChange(index, e.target.value)}
                  className="p-2 border border-gray-300 rounded-lg w-full"
                />
              ))}
              <button
                type="button"
                onClick={addCustomDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Add Custom Document
              </button>
            </div>
          )}
        </div>

        {/* Cost and Depreciation */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Cost and Depreciation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Cost per Unit</label>
              <input
                type="number"
                name="cost_per_unit"
                value={formData.cost_per_unit}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Life</label>
              <input
                type="number"
                name="expected_life"
                value={formData.expected_life}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expected Life Unit</label>
              <select
                name="life_unit"
                value={formData.life_unit}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Depreciation Method</label>
              <select
                name="depreciation_method"
                value={formData.depreciation_method}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              >
                <option value="straight_line">Straight Line</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Residual Value</label>
              <input
                type="number"
                name="residual_value"
                value={formData.residual_value}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              />
            </div>
          </div>
        </div>

        {/* Policies */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Policies</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Default Assignment Duration</label>
              <input
                type="number"
                name="default_assignment_duration"
                value={formData.default_assignment_duration}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Assignment Duration Unit</label>
              <select
                name="assignment_duration_unit"
                value={formData.assignment_duration_unit}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              >
                <option value="days">Days</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Can Be Assigned To</label>
              <select
                name="can_be_assigned_to"
                value={formData.can_be_assigned_to}
                onChange={handleInputChange}
                className="mt-1 p-2 border border-gray-300 rounded-lg w-full"
              >
                <option value="single_employee">Single Employee</option>
                <option value="team">Team</option>
                <option value="department">Department</option>
                <option value="floor">Floor</option>
                <option value="section">Section</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="allow_multiple_assignments"
                  checked={formData.allow_multiple_assignments}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                Allow Multiple Assignments
              </label>
            </div>
          </div>
        </div>

        {/* Policy Statements */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Policy Statements</h3>
          <div className="space-y-4">
            {formData.policies.map((policy, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Policy Statement"
                  value={policy}
                  onChange={(e) => handlePolicyChange(index, e.target.value)}
                  className="flex-grow p-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removePolicy(index)}
                  className="p-2 text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addPolicy}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Add Policy Statement</span>
            </button>
            {formData.policies.length === 0 && (
              <p className="text-sm text-gray-500 italic">No policies defined for this category. Add policies to establish usage guidelines.</p>
            )}
          </div>
        </div>

        {/* Final Options */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Final Options</h3>
          <label className="flex items-center">
            <input
              type="checkbox"
              name="is_enabled"
              checked={formData.is_enabled}
              onChange={handleInputChange}
              className="mr-2"
            />
            Enable Asset Category
          </label>
          <label className="flex items-center mt-2">
            <input
              type="checkbox"
              name="save_as_template"
              checked={formData.save_as_template}
              onChange={handleInputChange}
              className="mr-2"
            />
            Save as Template
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <Link to="/asset-inventory">
            <button 
              type="button"
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={`bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Creating...' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;