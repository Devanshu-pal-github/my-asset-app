import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import logger from '../../../utils/logger';

const AssetAssignmentTable = () => {
  const dispatch = useDispatch();
  const { categoryId } = useParams();
  const { items: assets, loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);

  useEffect(() => {
    logger.debug('AssetAssignmentTable useEffect triggered', { categoryId });
    dispatch(fetchAssetItemsByCategory(categoryId));
    dispatch(fetchAssetCategories());
  }, [dispatch, categoryId]);

  logger.debug('Rendering AssetAssignmentTable', { assets, assetsLoading, assetsError, categories, categoriesLoading, categoriesError });

  const handleAssignClick = (asset) => {
    logger.info('Assign button clicked', { assetId: asset.id, assetName: asset.name });
  };

  const handleAddAssetClick = () => {
    logger.info('Add New Asset button clicked');
  };

  const currentCategory = categories.find((cat) => cat._id === categoryId || cat.id === categoryId);

  // Filter assets: Show unassigned assets or those allowing multiple assignments
  const filteredAssets = assets.filter((asset) => {
    if (!currentCategory) return false;
    const allowMultipleAssignments = currentCategory.allow_multiple_assignments === 1;
    const isNotAssigned = asset.has_active_assignment === 0;
    return isNotAssigned || allowMultipleAssignments;
  });

  const assignButton = (rowData) => {
    return (
      <Link to={`/asset-inventory/${categoryId}/assign/${rowData.id}`}>
        <button
          className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => handleAssignClick(rowData)}
        >
          Assign
        </button>
      </Link>
    );
  };

  if (assetsLoading || categoriesLoading) {
    return <div className="p-6">Loading assets...</div>;
  }

  if (assetsError || categoriesError) {
    const errorMessage = assetsError || categoriesError;
    logger.error('AssetAssignmentTable error', { error: errorMessage });
    return (
      <div className="p-6 text-red-600">
        <span className="flex items-center">
          <i className="pi pi-exclamation-triangle mr-2"></i>
          Error: {errorMessage}
        </span>
      </div>
    );
  }

  if (!currentCategory) {
    logger.warn('Category not found', { categoryId });
    return (
      <div className="p-6">
        Category not found.{' '}
        <Link to="/asset-inventory" className="text-primary-blue underline">
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (!filteredAssets.length) {
    logger.info('No assignable assets found for category', { categoryId, categoryName: currentCategory.name });
    return (
      <div className="p-6">
        No assignable assets found for category {currentCategory.name}.{' '}
        <Link to="/asset-inventory" className="text-primary-blue underline">
          Back to Inventory
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-5">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Asset Assignment</h2>
          <span className="text-gray-600 text-sm">Manage and assign assets for {currentCategory.name}</span>
        </div>
        <div className="flex gap-3">
          <Link to="/asset-inventory">
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back to Inventory
            </button>
          </Link>
          <button
            className="bg-primary-blue text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={handleAddAssetClick}
          >
            + Add New Asset
          </button>
        </div>
      </div>
      <DataTable value={filteredAssets} className="asset-table" paginator rows={10} tableStyle={{ minWidth: '50rem' }}>
        <Column field="asset_tag" header="Asset Tag" sortable />
        <Column field="name" header="Asset Name" sortable />
        <Column
          field="specifications"
          header="Specifications"
          body={(rowData) =>
            rowData.specifications && Object.keys(rowData.specifications).length
              ? Object.entries(rowData.specifications)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(', ')
              : 'N/A'
          }
        />
        <Column header="Assign" body={assignButton} />
      </DataTable>
    </div>
  );
};

export default AssetAssignmentTable;