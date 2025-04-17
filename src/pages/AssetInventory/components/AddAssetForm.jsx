import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addAssetCategory } from '../../../store/slices/assetCategorySlice.jsx';
import logger from '../../../utils/logger.jsx';

const AddAssetForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.assetCategories);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Hardware',
    description: '',
    status: '',
    canReassign: false,
    isConsumable: false,
    requiresMaintenance: false,
    isRecurring: false,
    frequency: '1 month',
    alertBeforeDue: '',
    hasSpecifications: false,
    specs: [{ key: '', value: '' }],
    requiresDocs: false,
    docTypes: { purchase: false, warranty: false, insurance: false },
    customDocs: [],
    cost: '',
    life: '',
    lifeUnit: 'Years',
    depreciationMethod: 'Straight Line',
    residualValue: '',
    duration: '',
    durationUnit: 'Days',
    assignTo: 'Employee',
    allowMultiple: false,
    enableAssetType: true,
    saveAsTemplate: false,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpecChange = (index, key, value) => {
    const updatedSpecs = [...formData.specs];
    updatedSpecs[index][key] = value;
    setFormData((prev) => ({ ...prev, specs: updatedSpecs }));
  };

  const addSpecField = () => {
    setFormData((prev) => ({ ...prev, specs: [...prev.specs, { key: '', value: '' }] }));
  };

  const handleDocChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      docTypes: { ...prev.docTypes, [type]: !prev.docTypes[type] },
    }));
  };

  const handleCustomDocChange = (index, key, value) => {
    const updatedDocs = [...formData.customDocs];
    updatedDocs[index][key] = value;
    setFormData((prev) => ({ ...prev, customDocs: updatedDocs }));
  };

  const addCustomDocField = () => {
    setFormData((prev) => ({
      ...prev,
      customDocs: [...prev.customDocs, { name: '', required: false }],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    logger.debug('Submitting new asset category:', { formData });

    const categoryData = {
      name: formData.name,
      icon: formData.category === 'Hardware' ? 'pi pi-desktop' : formData.category === 'Software' ? 'pi pi-server' : 'pi pi-box',
      count: 0,
      total_value: formData.cost ? parseFloat(formData.cost) || 0.0 : 0.0,
      policies: [formData.description, formData.status].filter(Boolean),
      is_active: formData.enableAssetType ? 1 : 0,
      description: formData.description || None,
      status: formData.status || None,
      specifications: formData.hasSpecifications ? Object.fromEntries(formData.specs.map(spec => [spec.key, spec.value])) : None,
      is_reassignable: formData.canReassign ? 1 : 0,
      is_consumable: formData.isConsumable ? 1 : 0,
      requires_maintenance: formData.requiresMaintenance ? 1 : 0,
      maintenance_frequency: formData.isRecurring ? formData.frequency : None,
      maintenance_alert_days: formData.alertBeforeDue ? parseInt(formData.alertBeforeDue) : None,
      cost_per_unit: formData.cost ? parseFloat(formData.cost) : None,
      expected_life: formData.life ? parseInt(formData.life) : None,
      life_unit: formData.lifeUnit,
      depreciation_method: formData.depreciationMethod,
      residual_value: formData.residualValue ? parseFloat(formData.residualValue) : None,
      assignment_duration: formData.duration ? parseInt(formData.duration) : None,
      duration_unit: formData.durationUnit,
      assignable_to: formData.assignTo,
      allow_multiple_assignments: formData.allowMultiple ? 1 : 0,
      save_as_template: formData.saveAsTemplate ? 1 : 0,
    };

    try {
      await dispatch(addAssetCategory(categoryData)).unwrap();
      logger.info('Asset category created successfully');
      navigate('/asset-inventory');
    } catch (err) {
      logger.error('Failed to create asset category:', { error: err });
    }
  };

  const goBack = () => {
    navigate('/asset-inventory');
  };

  return (
    <div className="bg-white min-h-screen p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Create New Asset Type</h1>
        <button onClick={goBack} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl">
          Back to Inventory
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Basic Info */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="e.g., Laptop, Projector, Notebook"
              className="p-3 border rounded-lg"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
            <div className="flex gap-2">
              <select
                className="p-3 border rounded-lg w-full"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option>Hardware</option>
                <option>Software</option>
                <option>Stationery</option>
              </select>
            </div>
            <textarea
              rows={3}
              placeholder="Enter a brief description of the asset type..."
              className="col-span-2 p-3 border rounded-lg"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
            <input
              type="text"
              placeholder="Allotted, Undermaintenance, not alloted, consumed..."
              className="col-span-2 p-3 border rounded-lg"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
            />
          </div>
        </section>

        {/* Reusability */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Reusability & Consumption</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <span>Can this asset be assigned and reassigned?</span>
              <input
                type="checkbox"
                checked={formData.canReassign}
                onChange={() => handleChange('canReassign', !formData.canReassign)}
              />
            </div>
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
              <span>Is this a consumable item?</span>
              <input
                type="checkbox"
                checked={formData.isConsumable}
                onChange={() => handleChange('isConsumable', !formData.isConsumable)}
              />
            </div>
          </div>
        </section>

        {/* Maintenance */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Maintenance Settings</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.requiresMaintenance}
                onChange={() => handleChange('requiresMaintenance', !formData.requiresMaintenance)}
              />
              Requires Maintenance?
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={() => handleChange('isRecurring', !formData.isRecurring)}
              />
              Is it Recurring?
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <select
              className="p-3 border rounded-lg"
              value={formData.frequency}
              onChange={(e) => handleChange('frequency', e.target.value)}
            >
              <option>1 month</option>
              <option>3 months</option>
              <option>6 months</option>
            </select>
            <input
              type="number"
              placeholder="Alert Before Due (days)"
              className="p-3 border rounded-lg"
              value={formData.alertBeforeDue}
              onChange={(e) => handleChange('alertBeforeDue', e.target.value)}
            />
          </div>
        </section>

        {/* Specifications */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Specifications</h2>
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={formData.hasSpecifications}
              onChange={() => handleChange('hasSpecifications', !formData.hasSpecifications)}
            />
            Has Specifications?
          </label>
          {formData.specs.map((spec, i) => (
            <div key={i} className="grid grid-cols-2 gap-4 mb-2">
              <input
                type="text"
                placeholder="Key (e.g., RAM)"
                className="p-3 border rounded-lg"
                value={spec.key}
                onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
              />
              <input
                type="text"
                placeholder="Value (e.g., 16GB)"
                className="p-3 border rounded-lg"
                value={spec.value}
                onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
              />
            </div>
          ))}
          <button type="button" className="text-blue-600 font-medium" onClick={addSpecField}>
            + Add More
          </button>
        </section>

        {/* Documentation */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Documentation Requirements</h2>
          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={formData.requiresDocs}
              onChange={() => handleChange('requiresDocs', !formData.requiresDocs)}
            />
            Requires Document Uploads
          </label>
          {formData.requiresDocs && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {['purchase', 'warranty', 'insurance'].map((type) => (
                  <label key={type} className="flex gap-2 items-center capitalize">
                    <input
                      type="checkbox"
                      checked={formData.docTypes[type]}
                      onChange={() => handleDocChange(type)}
                    />
                    {type.replace(/^./, (str) => str.toUpperCase())} Document
                  </label>
                ))}
              </div>
              {formData.customDocs.map((doc, index) => (
                <div key={index} className="flex gap-4 items-center mb-2">
                  <input
                    type="text"
                    placeholder="Custom Doc Name"
                    className="p-3 border rounded-lg w-full"
                    value={doc.name}
                    onChange={(e) => handleCustomDocChange(index, 'name', e.target.value)}
                  />
                  <label className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={doc.required}
                      onChange={() => handleCustomDocChange(index, 'required', !doc.required)}
                    />
                    Required
                  </label>
                </div>
              ))}
              <button
                type="button"
                className="text-blue-600 font-medium mt-2"
                onClick={addCustomDocField}
              >
                + Add Custom Document Type
              </button>
            </>
          )}
        </section>

        {/* Cost & Depreciation */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Cost & Depreciation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Cost Per Unit"
              className="p-3 border rounded-lg"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
            />
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Expected Life"
                className="p-3 border rounded-lg w-full"
                value={formData.life}
                onChange={(e) => handleChange('life', e.target.value)}
              />
              <select
                className="p-3 border rounded-lg"
                value={formData.lifeUnit}
                onChange={(e) => handleChange('lifeUnit', e.target.value)}
              >
                <option>Years</option>
                <option>Months</option>
              </select>
            </div>
            <select
              className="p-3 border rounded-lg"
              value={formData.depreciationMethod}
              onChange={(e) => handleChange('depreciationMethod', e.target.value)}
            >
              <option>Straight Line</option>
            </select>
            <input
              type="number"
              placeholder="Residual Value"
              className="p-3 border rounded-lg"
              value={formData.residualValue}
              onChange={(e) => handleChange('residualValue', e.target.value)}
            />
          </div>
        </section>

        {/* Assignment Rules */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Assignment Rules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Default Assignment Duration"
                className="p-3 border rounded-lg w-full"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
              />
              <select
                className="p-3 border rounded-lg"
                value={formData.durationUnit}
                onChange={(e) => handleChange('durationUnit', e.target.value)}
              >
                <option>Days</option>
                <option>Weeks</option>
              </select>
            </div>
            <select
              className="p-3 border rounded-lg"
              value={formData.assignTo}
              onChange={(e) => handleChange('assignTo', e.target.value)}
            >
              <option>Employee</option>
              <option>Department</option>
            </select>
            <label className="flex gap-2 items-center col-span-2">
              <input
                type="checkbox"
                checked={formData.allowMultiple}
                onChange={() => handleChange('allowMultiple', !formData.allowMultiple)}
              />
              Allow Multiple Assignments?
            </label>
          </div>
        </section>

        {/* Final Options */}
        <div className="flex gap-6 items-center">
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={formData.enableAssetType}
              onChange={() => handleChange('enableAssetType', !formData.enableAssetType)}
            />
            Enable Asset Type?
          </label>
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={formData.saveAsTemplate}
              onChange={() => handleChange('saveAsTemplate', !formData.saveAsTemplate)}
            />
            Save as Template?
          </label>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            className="px-6 py-3 border rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200"
            onClick={goBack}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
          >
            {loading ? 'Creating...' : 'Create Asset Type'}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  );
};

export default AddAssetForm;