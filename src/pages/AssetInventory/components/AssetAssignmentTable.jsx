import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import logger from '../../../utils/logger';
import { paginate, sortData } from './tableUtils';

// Mock data
const mockCategories = [
  { _id: 'cat1', name: 'Laptops', allow_multiple_assignments: false, is_consumable: false, can_be_assigned_to: 'single_employee' },
  { _id: 'cat2', name: 'Stationery', allow_multiple_assignments: true, is_consumable: true, can_be_assigned_to: 'department' },
];

const mockAssets = [
  { _id: 'asset1', name: 'MacBook Pro', asset_tag: 'LT001', status: 'available', category_id: 'cat1' },
  { _id: 'asset2', name: 'HP Pavilion', asset_tag: 'LT002', status: 'available', category_id: 'cat1' },
  { _id: 'asset3', name: 'Pen', asset_tag: 'ST001', status: 'available', category_id: 'cat2' },
];

const mockEmployees = [
  { _id: 'emp1', first_name: 'John', last_name: 'Doe', department: 'Engineering', assigned_assets: [] },
];

const AssetAssignmentTable = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('asset_tag');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 10;

  // Check for employeeId in navigation state
  const targetEmployeeId = location.state?.employeeId;
  const targetEmployee = mockEmployees.find((emp) => emp._id === targetEmployeeId);

  useEffect(() => {
    logger.debug('AssetAssignmentTable useEffect triggered', { categoryId, targetEmployeeId });
    logger.info('Simulating fetch with mock data', { categoryId });
  }, [categoryId, targetEmployeeId]);

  const currentCategory = mockCategories.find((cat) => cat._id === categoryId);

  // Filter assets: available, consumable, or allow multiple assignments, not under maintenance
  const filteredAssets = mockAssets.filter((asset) => {
    if (!currentCategory) return false;
    const allowMultipleAssignments = currentCategory.allow_multiple_assignments;
    const isNotAssigned = asset.status === 'available';
    const isConsumable = currentCategory.is_consumable;
    const isNotUnderMaintenance = asset.status !== 'under_maintenance' && asset.status !== 'maintenance_requested';
    return asset.category_id === categoryId && (isNotAssigned || allowMultipleAssignments || isConsumable) && isNotUnderMaintenance;
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

  const handleAssignClick = () => {
    if (selectedAssets.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one asset to assign.' });
      return;
    }
    if (targetEmployeeId) {
      // If employeeId is provided, proceed to confirmation
      setShowConfirmModal(true);
    } else {
      // Navigate to EmployeeAssignment for selecting an employee
      navigate(`/asset-inventory/${categoryId}/assign/${selectedAssets[0]}`, {
        state: { selectedAssets },
      });
    }
  };

  const confirmAssignment = async () => {
    try {
      logger.info('Assigning assets', { assets: selectedAssets, employeeId: targetEmployeeId });
      setNotification({
        type: 'success',
        message: `Asset(s) assigned to ${targetEmployee?.first_name} ${targetEmployee?.last_name}`,
      });

      setTimeout(() => {
        navigate(`/asset-inventory/${categoryId}/assign`);
      }, 1500);
    } catch (error) {
      logger.error('Failed to assign asset', { error: error.message });
      setNotification({
        type: 'error',
        message: 'Failed to assign asset',
      });
    } finally {
      setShowConfirmModal(false);
      setSelectedAssets([]);
    }
  };

  const sortedAssets = sortData(filteredAssets, sortField, sortOrder);
  const paginatedAssets = paginate(sortedAssets, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

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
          <Link to={`/asset-inventory/${categoryId}/add-item`}>
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
      {notification && (
        <div
          className={`fixed top-4 right-4 p-4 rounded-lg text-white ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {notification.message}
          <button className="ml-4 text-white" onClick={() => setNotification(null)}>
            ✕
          </button>
        </div>
      )}
      {showConfirmModal && targetEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Assignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to assign the selected asset(s) to {targetEmployee.first_name} {targetEmployee.last_name}?
            </p>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Employee Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {targetEmployee.first_name} {targetEmployee.last_name}
              </p>
              <p className="text-gray-600">
                <strong>ID:</strong> {targetEmployee._id}
              </p>
              <p className="text-gray-600">
                <strong>Department:</strong> {targetEmployee.department || 'N/A'}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Asset Details</h4>
              {selectedAssets.map((assetId) => {
                const asset = mockAssets.find((a) => a._id === assetId);
                return (
                  <div key={asset._id} className="mt-2">
                    <p className="text-gray-600">
                      <strong>Name:</strong> {asset?.name}
                    </p>
                    <p className="text-gray-600">
                      <strong>Asset Tag:</strong> {asset?.asset_tag}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={confirmAssignment}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Assign Assets - {currentCategory.name}
            {targetEmployee && ` to ${targetEmployee.first_name} ${targetEmployee.last_name}`}
          </h2>
          <span className="text-gray-600 text-sm">
            Select assets to assign
            {targetEmployee && ` to ${targetEmployee.first_name} ${targetEmployee.last_name}`}
          </span>
        </div>
        <div className="flex gap-3">
          <Link to="/asset-inventory">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Inventory
            </button>
          </Link>
          {selectedAssets.length > 0 && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              onClick={handleAssignClick}
            >
              Assign Selected ({selectedAssets.length})
            </button>
          )}
          <Link to={`/asset-inventory/${categoryId}/add-item`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              + Add New Asset
            </button>
          </Link>
        </div>
      </div>
      {targetEmployee && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-800">Assigning to Employee</h3>
          <p className="text-gray-600">
            <strong>Name:</strong> {targetEmployee.first_name} {targetEmployee.last_name}
          </p>
          <p className="text-gray-600">
            <strong>ID:</strong> {targetEmployee._id}
          </p>
          <p className="text-gray-600">
            <strong>Department:</strong> {targetEmployee.department || 'N/A'}
          </p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
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
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleAssetSelect(asset._id)}
                  >
                    Select
                  </button>
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