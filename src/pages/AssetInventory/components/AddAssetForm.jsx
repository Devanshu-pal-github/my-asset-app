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
      description: formData.description || null,
      status: formData.status || null,
      specifications: formData.hasSpecifications ? Object.fromEntries(formData.specs.map(spec => [spec.key, spec.value])) : null,
      is_reassignable: formData.canReassign ? 1 : 0,
      is_consumable: formData.isConsumable ? 1 : 0,
      requires_maintenance: formData.requiresMaintenance ? 1 : 0,
      maintenance_frequency: formData.isRecurring ? formData.frequency : null,
      maintenance_alert_days: formData.alertBeforeDue ? parseInt(formData.alertBeforeDue) : null,
      cost_per_unit: formData.cost ? parseFloat(formData.cost) : null,
      expected_life: formData.life ? parseInt(formData.life) : null,
      life_unit: formData.lifeUnit,
      depreciation_method: formData.depreciationMethod,
      residual_value: formData.residualValue ? parseFloat(formData.residualValue) : null,
      assignment_duration: formData.duration ? parseInt(formData.duration) : null,
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
    <div className="min-h-screen  w-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-gray-800">AssetHR</h1>
        </div>
        <nav className="text-sm text-gray-500">
          Management > Assets > Create New Type
        </nav>
        <div className="flex items-center gap-2">
          <i className="pi pi-bell text-gray-600"></i>
          <span className="text-sm text-gray-700">HR Manager, Sarah Anderson</span>
          <div className="w-8 h-8 rounded-full bg-gray-300"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mt-6 px-4">
        <div className="bg-white shadow-md rounded-lg p-4">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-800">Create New Asset Type</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Type Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Laptop, Projector, Notebook"
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                  >
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Stationery</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter a brief description of the asset type..."
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <input
                    type="text"
                    placeholder="Allotted, Undermaintenance, not alloted, consumed..."
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Reusability */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Reusability & Consumption</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                  <span className="text-sm text-gray-600">Can this asset be assigned and reassigned?</span>
                  <input
                    type="checkbox"
                    checked={formData.canReassign}
                    onChange={() => handleChange('canReassign', !formData.canReassign)}
                  />
                </div>
                <div className="flex justify-between items-center bg-gray-100 p-4 rounded-lg">
                  <span className="text-sm text-gray-600">Is this a consumable item?</span>
                  <input
                    type="checkbox"
                    checked={formData.isConsumable}
                    onChange={() => handleChange('isConsumable', !formData.isConsumable)}
                  />
                </div>
              </div>
            </section>

            {/* Maintenance */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Maintenance Settings</h2>
              <div className="flex flex-wrap gap-4 mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.requiresMaintenance}
                    onChange={() => handleChange('requiresMaintenance', !formData.requiresMaintenance)}
                  />
                  <span className="text-sm text-gray-600">Requires Maintenance?</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isRecurring}
                    onChange={() => handleChange('isRecurring', !formData.isRecurring)}
                  />
                  <span className="text-sm text-gray-600">Is it Recurring?</span>
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Frequency</label>
                  <select
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.frequency}
                    onChange={(e) => handleChange('frequency', e.target.value)}
                  >
                    <option>1 month</option>
                    <option>3 months</option>
                    <option>6 months</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Before Due (days)</label>
                  <input
                    type="number"
                    placeholder="Alert Before Due (days)"
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.alertBeforeDue}
                    onChange={(e) => handleChange('alertBeforeDue', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Specifications */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Specifications</h2>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.hasSpecifications}
                  onChange={() => handleChange('hasSpecifications', !formData.hasSpecifications)}
                />
                <span className="text-sm text-gray-600">Has Specifications?</span>
              </label>
              {formData.hasSpecifications && formData.specs.map((spec, i) => (
                <div key={i} className="grid grid-cols-2 gap-4 mb-2">
                  <input
                    type="text"
                    placeholder="Key (e.g., RAM)"
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={spec.key}
                    onChange={(e) => handleSpecChange(i, 'key', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g., 16GB)"
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={spec.value}
                    onChange={(e) => handleSpecChange(i, 'value', e.target.value)}
                  />
                </div>
              ))}
              {formData.hasSpecifications && (
                <button type="button" className="text-blue-600 font-medium" onClick={addSpecField}>
                  + Add More
                </button>
              )}
            </section>

            {/* Documentation */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Documentation Requirements</h2>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={formData.requiresDocs}
                  onChange={() => handleChange('requiresDocs', !formData.requiresDocs)}
                />
                <span className="text-sm text-gray-600">Requires Document Uploads</span>
              </label>
              {formData.requiresDocs && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {['purchase', 'warranty', 'insurance'].map((type) => (
                      <label key={type} className="flex gap-2 items-center capitalize">
                        <input
                          type="checkbox"
                          checked={formData.docTypes[type]}
                          onChange={() => handleDocChange(type)}
                        />
                        <span className="text-sm text-gray-600">{type.replace(/^./, (str) => str.toUpperCase())} Document</span>
                      </label>
                    ))}
                  </div>
                  {formData.customDocs.map((doc, index) => (
                    <div key={index} className="flex gap-4 items-center mb-2">
                      <input
                        type="text"
                        placeholder="Custom Doc Name"
                        className="p-3 border border-gray-200 rounded-lg w-full"
                        value={doc.name}
                        onChange={(e) => handleCustomDocChange(index, 'name', e.target.value)}
                      />
                      <label className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={doc.required}
                          onChange={() => handleCustomDocChange(index, 'required', !doc.required)}
                        />
                        <span className="text-sm text-gray-600">Required</span>
                      </label>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-blue-600 font-medium"
                    onClick={addCustomDocField}
                  >
                    + Add Custom Document Type
                  </button>
                </>
              )}
            </section>

            {/* Cost & Depreciation */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Cost & Depreciation</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost Per Unit</label>
                  <input
                    type="number"
                    placeholder="Cost Per Unit"
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.cost}
                    onChange={(e) => handleChange('cost', e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Life</label>
                    <input
                      type="number"
                      placeholder="Expected Life"
                      className="p-3 border border-gray-200 rounded-lg w-full"
                      value={formData.life}
                      onChange={(e) => handleChange('life', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      className="p-3 border border-gray-200 rounded-lg w-full"
                      value={formData.lifeUnit}
                      onChange={(e) => handleChange('lifeUnit', e.target.value)}
                    >
                      <option>Years</option>
                      <option>Months</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Depreciation Method</label>
                  <select
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.depreciationMethod}
                    onChange={(e) => handleChange('depreciationMethod', e.target.value)}
                  >
                    <option>Straight Line</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residual Value</label>
                  <input
                    type="number"
                    placeholder="Residual Value"
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.residualValue}
                    onChange={(e) => handleChange('residualValue', e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Assignment Rules */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Assignment Rules</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Assignment Duration</label>
                    <input
                      type="number"
                      placeholder="Default Assignment Duration"
                      className="p-3 border border-gray-200 rounded-lg w-full"
                      value={formData.duration}
                      onChange={(e) => handleChange('duration', e.target.value)}
                    />
                  </div>
                  <div className="w-32">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      className="p-3 border border-gray-200 rounded-lg w-full"
                      value={formData.durationUnit}
                      onChange={(e) => handleChange('durationUnit', e.target.value)}
                    >
                      <option>Days</option>
                      <option>Weeks</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Can Be Assigned To</label>
                  <select
                    className="p-3 border border-gray-200 rounded-lg w-full"
                    value={formData.assignTo}
                    onChange={(e) => handleChange('assignTo', e.target.value)}
                  >
                    <option>Employee</option>
                    <option>Department</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="flex gap-2 items-center">
                    <input
                      type="checkbox"
                      checked={formData.allowMultiple}
                      onChange={() => handleChange('allowMultiple', !formData.allowMultiple)}
                    />
                    <span className="text-sm text-gray-600">Allow Multiple Assignments?</span>
                  </label>
                </div>
              </div>
            </section>

            {/* Final Options */}
            <section className="bg-gray-50 p-5 rounded-lg">
              <h2 className="text-base font-semibold text-gray-700 mb-4">Final Options</h2>
              <div className="flex gap-4 items-center">
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={formData.enableAssetType}
                    onChange={() => handleChange('enableAssetType', !formData.enableAssetType)}
                  />
                  <span className="text-sm text-gray-600">Enable Asset Type?</span>
                </label>
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={formData.saveAsTemplate}
                    onChange={() => handleChange('saveAsTemplate', !formData.saveAsTemplate)}
                  />
                  <span className="text-sm text-gray-600">Save as Template?</span>
                </label>
              </div>
            </section>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 font-semibold"
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
            {error && (
              <div className="text-red-500 text-xs flex items-center mb-4">
                <i className="pi pi-exclamation-triangle mr-2 text-sm"></i>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddAssetForm;