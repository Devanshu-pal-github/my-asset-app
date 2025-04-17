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
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Cost & Depreciation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Cost Per Unit"
              className="p-3 border rounded-lg"
              value={formData.cost}
              onChange={(e) => handleChange('cost', e.target.value)}
            />
          </div>
        </section>
        <div className="flex gap-6 items-center">
          <label className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={formData.enableAssetType}
              onChange={() => handleChange('enableAssetType', !formData.enableAssetType)}
            />
            Enable Asset Type?
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