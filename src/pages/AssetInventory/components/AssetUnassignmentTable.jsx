import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import logger from '../../../utils/logger';
import { paginate, sortData } from './tableUtils';

const AssetUnassignmentTable = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const { items: assets, loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);

  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('AssetUnassignmentTable useEffect triggered', { categoryId });
    dispatch(fetchAssetItemsByCategory(categoryId));
    dispatch(fetchAssetCategories());
  }, [dispatch, categoryId]);

  const filteredAssets = assets.filter((asset) => asset.has_active_assignment === true);

  const currentCategory = categories.find((cat) => cat._id === categoryId || cat.id === categoryId);

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
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
    logger.error('AssetUnassignmentTable error', { error: errorMessage });
    return (
      <div className="p-6 text-red-600">
        {errorMessage}{' '}
        <Link to="/asset-inventory" className="text-blue-600 underline hover:text-blue-800">
          Back to Inventory
        </Link>
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
    logger.info('No assigned assets found for category', { categoryId, categoryName: currentCategory.name });
    return (
      <div className="mt-24 p-6 flex flex-col items-center justify-center">
        <div className="text-gray-600 text-lg mb-4">
          No assets available to unassign in {currentCategory.name}.
        </div>
        <div className="flex gap-3">
          <Link to="/asset-inventory">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Inventory
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-24 p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Unassign Assets - {currentCategory.name}</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Asset Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('asset_tag')}
              >
                Asset Tag {sortField === 'asset_tag' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('serial_number')}
              >
                Serial Number {sortField === 'serial_number' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('department')}
              >
                Department {sortField === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('location')}
              >
                Location {sortField === 'location' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedAssets.map((asset) => (
              <tr key={asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.asset_tag}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.serial_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.location || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link to={`/asset-inventory/${categoryId}/unassign/${asset.id}`}>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                      onClick={() => logger.info('Navigating to EmployeeUnassignment', { assetId: asset.id })}
                    >
                      Unassign
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
      <div className="mt-4">
        <Link to="/asset-inventory">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Back to Inventory
          </button>
        </Link>
      </div>
    </div>
  );
};

export default AssetUnassignmentTable;