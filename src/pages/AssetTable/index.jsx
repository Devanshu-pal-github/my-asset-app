import React, { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetItemsByCategory } from '../../store/slices/assetItemSlice';
import logger from '../../utils/logger';
import AssetTable from './components/AssetTable';

const AssetTablePage = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.assetItems);
  const { categories } = useSelector((state) => state.assetCategories);

  useEffect(() => {
    console.log('Category ID from useParams:', categoryId);
    logger.debug('AssetTablePage useEffect triggered', { categoryId });
    logger.debug('Categories in AssetTablePage:', { categories });
    if (categoryId) {
      dispatch(fetchAssetItemsByCategory(categoryId))
        .then(() => logger.info('Successfully fetched asset items for category', { categoryId }))
        .catch((err) => logger.error('Failed to fetch asset items', { error: err.message }));
    }
  }, [dispatch, categoryId]);

  logger.debug('Rendering AssetTablePage', { categoryId, items, loading, error });

  if (!categoryId) {
    logger.error('No categoryId provided in URL', { url: window.location.href });
    return <Navigate to="/asset-inventory" replace />;
  }

  const category = categories.find((cat) => (cat._id || cat.id) === categoryId) || {};
  logger.debug('Category details', { category });

  const totalUnits = items.length;
  const avgCostPerUnit = items.length
    ? (items.reduce((sum, item) => sum + (item.purchase_cost || 0), 0) / items.length).toFixed(2)
    : 0;
  const inStorage = items.filter((item) => !item.is_assigned).length;

  if (loading) {
    logger.info('AssetTablePage is loading');
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    logger.error('AssetTablePage error', { error });
    return (
      <div className="p-6 text-error-red">
        Error: {error.includes('404') ? 'Asset items endpoint not found. Please contact support.' : error}
        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    );
  }

  if (!items.length) {
    logger.info('No asset items found for category', { categoryId });
    return (
      <div className="p-6">
        No assets found for category: {category.name || 'Unknown'}
        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    );
  }

  const columns = ['asset_tag', 'serial_number', 'assigned_at', 'specifications', 'viewMore'];
  const header = (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="flex justify-between items-center text-gray-600">
        <div>
          <h2 className="text-lg font-semibold">Total Units</h2>
          <p className="text-2xl font-bold text-gray-800">{totalUnits}</p>
          <span className="text-green-600">+0%</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">Avg Cost/Unit</h2>
          <p className="text-2xl font-bold text-gray-800">₹{Number(avgCostPerUnit).toLocaleString()}</p>
          <span className="text-green-600">+0%</span>
        </div>
        <div>
          <h2 className="text-lg font-semibold">In Storage</h2>
          <p className="text-2xl font-bold text-gray-800">{inStorage}</p>
          <span className="text-green-600">+0%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {header}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search items..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/3"
          onChange={(e) => logger.debug('Search input changed', { value: e.target.value })}
        />
        <div className="flex gap-2">
          <button
            className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
            onClick={() => logger.info('Add Item button clicked')}
          >
            Add Item
          </button>
          <button
            className="px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
            onClick={() => logger.info('Bulk Upload button clicked')}
          >
            Bulk Upload
          </button>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow-md p-4">
        <AssetTable
          data={items}
          header={null}
          globalFilter=""
          columns={columns}
          specKeys={[]}
          categoryId={categoryId}
        />
        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
            onClick={() => logger.info('Return to Asset Inventory clicked')}
          >
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AssetTablePage;