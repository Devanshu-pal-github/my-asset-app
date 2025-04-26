import React, { useState, useEffect } from "react";
import logger from "../../../utils/logger";

const EditAssetForm = ({ asset, onClose, onUpdateAsset }) => {
  const [formData, setFormData] = useState({
    name: asset.name || "",
    icon: asset.icon || "pi pi-desktop",
    description: asset.description || "",
    category_type: asset.category_type || "",
    is_active: asset.is_active !== undefined ? asset.is_active : true,
    is_reassignable:
      asset.is_reassignable !== undefined ? asset.is_reassignable : true,
    is_consumable:
      asset.is_consumable !== undefined ? asset.is_consumable : false,
    requires_maintenance:
      asset.requires_maintenance !== undefined
        ? asset.requires_maintenance
        : false,
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
      allow_multiple_assignments:
        asset.assignment_policies?.allow_multiple_assignments !== undefined
          ? asset.assignment_policies.allow_multiple_assignments
          : false,
    },
    specifications: asset.specifications || {},
    save_as_template:
      asset.save_as_template !== undefined ? asset.save_as_template : false,
  });
  const [specFields, setSpecFields] = useState(
    Object.entries(formData.specifications).map(([key, value]) => ({
      key,
      value,
    }))
  );
  const [errors, setErrors] = useState({});

  useEffect(() => {
    logger.debug("EditAssetForm initialized with asset:", {
      assetId: asset.id,
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

  const handleSpecChange = (index, field, value) => {
    const updatedSpecs = [...specFields];
    updatedSpecs[index][field] = value;
    setSpecFields(updatedSpecs);
    setFormData((prev) => ({
      ...prev,
      specifications: updatedSpecs.reduce(
        (acc, { key, value }) => ({ ...acc, [key]: value }),
        {}
      ),
    }));
  };

  const addSpecField = () => {
    setSpecFields([...specFields, { key: "", value: "" }]);
  };

  const removeSpecField = (index) => {
    const updatedSpecs = specFields.filter((_, i) => i !== index);
    setSpecFields(updatedSpecs);
    setFormData((prev) => ({
      ...prev,
      specifications: updatedSpecs.reduce(
        (acc, { key, value }) => ({ ...acc, [key]: value }),
        {}
      ),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.cost_per_unit && isNaN(formData.cost_per_unit))
      newErrors.cost_per_unit = "Must be a valid number";
    if (formData.expected_life && isNaN(formData.expected_life))
      newErrors.expected_life = "Must be a valid number";
    if (formData.residual_value && isNaN(formData.residual_value))
      newErrors.residual_value = "Must be a valid number";
    if (
      formData.maintenance_alert_days &&
      isNaN(formData.maintenance_alert_days)
    ) {
      newErrors.maintenance_alert_days = "Must be a valid number";
    }
    if (
      formData.assignment_policies.max_assignments &&
      isNaN(formData.assignment_policies.max_assignments)
    ) {
      newErrors["assignment_policies.max_assignments"] =
        "Must be a valid number";
    }
    if (
      formData.assignment_policies.assignment_duration &&
      isNaN(formData.assignment_policies.assignment_duration)
    ) {
      newErrors["assignment_policies.assignment_duration"] =
        "Must be a valid number";
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
    // Only submit fields defined in AssetCategoryCreate
    const submitData = {
      name: formData.name,
      icon: formData.icon,
      description: formData.description,
      category_type: formData.category_type,
      is_active: formData.is_active,
      is_reassignable: formData.is_reassignable,
      is_consumable: formData.is_consumable,
      requires_maintenance: formData.requires_maintenance,
      maintenance_frequency: formData.maintenance_frequency || null,
      maintenance_alert_days: formData.maintenance_alert_days
        ? Number(formData.maintenance_alert_days)
        : null,
      cost_per_unit: formData.cost_per_unit
        ? Number(formData.cost_per_unit)
        : null,
      expected_life: formData.expected_life
        ? Number(formData.expected_life)
        : null,
      life_unit: formData.life_unit || null,
      depreciation_method: formData.depreciation_method || null,
      residual_value: formData.residual_value
        ? Number(formData.residual_value)
        : null,
      assignment_policies: {
        max_assignments:
          Number(formData.assignment_policies.max_assignments) || 1,
        assignable_to: formData.assignment_policies.assignable_to || null,
        assignment_duration: formData.assignment_policies.assignment_duration
          ? Number(formData.assignment_policies.assignment_duration)
          : null,
        duration_unit: formData.assignment_policies.duration_unit || null,
        allow_multiple_assignments:
          formData.assignment_policies.allow_multiple_assignments,
      },
      specifications: formData.specifications,
      save_as_template: formData.save_as_template,
    };
    onUpdateAsset(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Icon</label>
        <input
          type="text"
          name="icon"
          value={formData.icon}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category Type
        </label>
        <input
          type="text"
          name="category_type"
          value={formData.category_type}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Is Active</span>
        </label>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_reassignable"
            checked={formData.is_reassignable}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Is Reassignable
          </span>
        </label>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="is_consumable"
            checked={formData.is_consumable}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Is Consumable
          </span>
        </label>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="requires_maintenance"
            checked={formData.requires_maintenance}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Requires Maintenance
          </span>
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Maintenance Frequency
        </label>
        <input
          type="text"
          name="maintenance_frequency"
          value={formData.maintenance_frequency}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Maintenance Alert Days
        </label>
        <input
          type="number"
          name="maintenance_alert_days"
          value={formData.maintenance_alert_days}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
        {errors.maintenance_alert_days && (
          <p className="text-red-500 text-sm">
            {errors.maintenance_alert_days}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Cost Per Unit
        </label>
        <input
          type="number"
          name="cost_per_unit"
          value={formData.cost_per_unit}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
        {errors.cost_per_unit && (
          <p className="text-red-500 text-sm">{errors.cost_per_unit}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Expected Life
        </label>
        <input
          type="number"
          name="expected_life"
          value={formData.expected_life}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
        {errors.expected_life && (
          <p className="text-red-500 text-sm">{errors.expected_life}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Life Unit
        </label>
        <input
          type="text"
          name="life_unit"
          value={formData.life_unit}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Depreciation Method
        </label>
        <input
          type="text"
          name="depreciation_method"
          value={formData.depreciation_method}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Residual Value
        </label>
        <input
          type="number"
          name="residual_value"
          value={formData.residual_value}
          onChange={handleChange}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        />
        {errors.residual_value && (
          <p className="text-red-500 text-sm">{errors.residual_value}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Assignment Policies
        </label>
        <div className="ml-4 space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Assignments
            </label>
            <input
              type="number"
              name="assignment_policies.max_assignments"
              value={formData.assignment_policies.max_assignments}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            {errors["assignment_policies.max_assignments"] && (
              <p className="text-red-500 text-sm">
                {errors["assignment_policies.max_assignments"]}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assignable To
            </label>
            <input
              type="text"
              name="assignment_policies.assignable_to"
              value={formData.assignment_policies.assignable_to}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assignment Duration
            </label>
            <input
              type="number"
              name="assignment_policies.assignment_duration"
              value={formData.assignment_policies.assignment_duration}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            {errors["assignment_policies.assignment_duration"] && (
              <p className="text-red-500 text-sm">
                {errors["assignment_policies.assignment_duration"]}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration Unit
            </label>
            <input
              type="text"
              name="assignment_policies.duration_unit"
              value={formData.assignment_policies.duration_unit}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="assignment_policies.allow_multiple_assignments"
                checked={
                  formData.assignment_policies.allow_multiple_assignments
                }
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Allow Multiple Assignments
              </span>
            </label>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Specifications
        </label>
        {specFields.map((spec, index) => (
          <div key={index} className="flex space-x-2 mt-2">
            <input
              type="text"
              placeholder="Key"
              value={spec.key}
              onChange={(e) => handleSpecChange(index, "key", e.target.value)}
              className="block w-1/2 p-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Value"
              value={spec.value}
              onChange={(e) => handleSpecChange(index, "value", e.target.value)}
              className="block w-1/2 p-2 border border-gray-300 rounded-md"
            />
            <button
              type="button"
              onClick={() => removeSpecField(index)}
              className="text-red-500 hover:text-red-700"
            >
              <i className="pi pi-trash"></i>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addSpecField}
          className="mt-2 text-blue-500 hover:text-blue-700"
        >
          + Add Specification
        </button>
      </div>
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            name="save_as_template"
            checked={formData.save_as_template}
            onChange={handleChange}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">
            Save as Template
          </span>
        </label>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-700">
          Computed Fields (Read-Only)
        </h4>
        <div className="ml-4 space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Items
            </label>
            <input
              type="text"
              value={asset.count || 0}
              disabled
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Total Value
            </label>
            <input
              type="text"
              value={Number(asset.total_value || 0).toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
              })}
              disabled
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Assigned Count
            </label>
            <input
              type="text"
              value={asset.assigned_count || 0}
              disabled
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maintenance Count
            </label>
            <input
              type="text"
              value={asset.maintenance_count || 0}
              disabled
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Utilization Rate
            </label>
            <input
              type="text"
              value={`${asset.utilization_rate || 0}%`}
              disabled
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#216DCF] text-white rounded-md hover:bg-[#1d4ed8]"
        >
          Save
        </button>
      </div>
    </form>
  );
};

export default EditAssetForm;
