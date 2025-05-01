import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import logger from '../../../utils/logger';
import { paginate, sortData } from './tableUtils';

const AssetAssignmentTable = () => {
  const dispatch = useDispatch();
  const { categoryId } = useParams();
  const { items: assets, loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('asset_tag');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('AssetAssignmentTable useEffect triggered', { categoryId });
    dispatch(fetchAssetItemsByCategory(categoryId));
    dispatch(fetchAssetCategories());
  }, [dispatch, categoryId]);

  const currentCategory = categories.find((cat) => cat._id === categoryId);

  const filteredAssets = assets.filter((asset) => {
    if (!currentCategory) return false;
    const allowMultipleAssignments = currentCategory.allow_multiple_assignments;
    const isNotAssigned = asset.status === 'available';
    const isConsumable = currentCategory.is_consumable;
    const isNotUnderMaintenance = asset.status !== 'under_maintenance';
    return (isNotAssigned || allowMultipleAssignments || isConsumable) && isNotUnderMaintenance;
  });

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handleAssetSelect = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const sortedAssets = sortData(filteredAssets, sortField, sortOrder);
  const paginatedAssets = paginate(sortedAssets, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (assetsLoading || categoriesLoading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (assetsError || categoriesError) {
    const errorMessage = assetsError || categoriesError;
    logger.error('AssetAssignmentTable error', { error: errorMessage });
    return (
      <div className="p-6 text-red-600">
        <span className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Error: {errorMessage}
        </span>
      </div>
    );
  }

  if (!currentCategory) {
    logger.info('Category not found', { categoryId });
    return (
      <div className="p-6 text-gray-600">
        Category not found.{' '}
        <Link to="/asset-inventory" className="text-blue-600 underline hover:text-blue-800">
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (!filteredAssets.length) {
    logger.info('No assignable assets found for category', { categoryId, categoryName: currentCategory.name });
    return (
      <div className="mt-24 p-6 flex flex-col items-center justify-center">
        <div className="text-gray-600 text-lg mb-4">
          No current assets available for assignment in {currentCategory.name}.
        </div>
        <div className="flex gap-3">
          <Link to="/asset-inventory">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Inventory
            </button>
          </Link>
          <Link to={`/asset-inventory/${categoryId}/add-asset`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              + Add New Asset
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-24 p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Asset Assignment - {currentCategory.name}</h2>
          <span className="text-gray-600 text-sm">Manage and assign assets for {currentCategory.name}</span>
        </div>
        <div className="flex gap-3">
          <Link to="/asset-inventory">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Inventory
            </button>
          </Link>
          {selectedAssets.length > 0 && (
            <Link to={`/asset-inventory/${categoryId}/assign-multiple`} state={{ selectedAssets }}>
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                Assign Selected
              </button>
            </Link>
          )}
          <Link to={`/asset-inventory/${categoryId}/add-asset`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              + Add New Asset
            </button>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Select
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('asset_tag')}
              >
                Asset Tag {sortField === 'asset_tag' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Asset Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assign
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedAssets.map((asset) => (
              <tr key={asset._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset._id)}
                    onChange={() => handleAssetSelect(asset._id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.asset_tag}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link to={`/asset-inventory/${categoryId}/assign/${asset._id}`}>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                      onClick={() => logger.info('Navigating to EmployeeAssignment', { assetId: asset._id })}
                    >
                      Assign
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredAssets.length)} of {filteredAssets.length} assets
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`px-3 py-1 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetAssignmentTable;