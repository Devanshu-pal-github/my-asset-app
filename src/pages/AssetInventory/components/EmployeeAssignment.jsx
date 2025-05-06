import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import logger from '../../../utils/logger';
import { paginate, sortData, filterData } from './tableUtils';

// Mock data
const mockEmployees = [
  { _id: 'emp1', first_name: 'John', last_name: 'Doe', department: 'Engineering', assigned_assets: [] },
  { _id: 'emp2', first_name: 'Jane', last_name: 'Smith', department: 'HR', assigned_assets: [] },
];

const mockCategories = [
  { _id: 'cat1', name: 'Laptops', can_be_assigned_to: 'single_employee' },
  { _id: 'cat2', name: 'Stationery', can_be_assigned_to: 'department' },
];

const mockAssets = [
  { _id: 'asset1', name: 'MacBook Pro', asset_tag: 'LT001', status: 'available', category_id: 'cat1' },
];

const EmployeeAssignment = () => {
  const navigate = useNavigate();
  const { categoryId, assetId } = useParams();
  const location = useLocation();
  const { selectedAssets = [] } = location.state || {};
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('EmployeeAssignment useEffect triggered', { categoryId, assetId, selectedAssets });
    logger.info('Simulating fetch with mock data', { categoryId, assetId });
  }, [categoryId, assetId]);

  const currentCategory = mockCategories.find((cat) => cat._id === categoryId) || {};
  const currentAsset = assetId ? mockAssets.find((asset) => asset._id === assetId) : null;

  const entities = () => {
    switch (currentCategory.can_be_assigned_to) {
      case 'single_employee':
        return mockEmployees;
      case 'team':
        return [{ _id: 'team1', name: 'Dev Team', department: 'Engineering' }];
      case 'department':
        return [{ _id: 'dept1', name: 'Engineering', location: 'Building A' }];
      default:
        return [];
    }
  };

  const entityList = entities();

  const handleEntitySelect = (entityId) => {
    setSelectedEntities((prev) =>
      prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]
    );
  };

  const handleAssignClick = () => {
    if (selectedEntities.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one entity to assign.' });
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    if (selectedEntities.length === 0) {
      setShowConfirmModal(false);
      return;
    }

    try {
      const assetsToAssign = selectedAssets.length > 0 ? selectedAssets : [assetId];
      logger.info('Assigning assets', { assetsToAssign, selectedEntities });
      setNotification({
        type: 'success',
        message: `Asset(s) assigned to ${selectedEntities.length} ${currentCategory.can_be_assigned_to}(s)`,
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
      setSelectedEntities([]);
    }
  };

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const filteredEntities = filterData(entityList, globalFilter, ['name', 'first_name', 'last_name', 'department']);
  const sortedEntities = sortData(filteredEntities, sortField, sortOrder);
  const paginatedEntities = paginate(sortedEntities, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredEntities.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (!currentCategory.name) {
    logger.warn('Category not found', { categoryId });
    return (
      <div className="p-6 text-gray-600">
        Category not found.{' '}
        <Link to="/asset-inventory" className="text-blue-600 underline hover:text-blue-800">
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (!currentAsset && selectedAssets.length === 0) {
    logger.warn('Asset not found', { assetId });
    return (
      <div className="p-6 text-gray-600">
        Asset not found.{' '}
        <Link to={`/asset-inventory/${categoryId}/assign`} className="text-blue-600 underline hover:text-blue-800">
          Back to Asset Assignment
        </Link>
      </div>
    );
  }

  if (!entityList.length) {
    logger.info('No entities found');
    return (
      <div className="p-6 text-gray-600">
        No {currentCategory.can_be_assigned_to}s available for assignment.{' '}
        <Link to={`/asset-inventory/${categoryId}/assign`} className="text-blue-600 underline hover:text-blue-800">
          Back to Asset Assignment
        </Link>
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
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Assignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to assign the following asset(s) to the selected {currentCategory.can_be_assigned_to}(s)?
            </p>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">{currentCategory.can_be_assigned_to} Details</h4>
              {selectedEntities.map((entityId) => {
                const entity = entityList.find((e) => e._id === entityId);
                return (
                  <div key={entity._id} className="mt-2">
                    <p className="text-gray-600">
                      <strong>Name:</strong> {entity.name || `${entity.first_name} ${entity.last_name}`}
                    </p>
                    <p className="text-gray-600">
                      <strong>ID:</strong> {entity._id}
                    </p>
                    <p className="text-gray-600">
                      <strong>Department:</strong> {entity.department || 'N/A'}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Asset Details</h4>
              {selectedAssets.length > 0 ? (
                <p className="text-gray-600">
                  <strong>Assets:</strong> {selectedAssets.length} selected
                </p>
              ) : (
                <>
                  <p className="text-gray-600">
                    <strong>Name:</strong> {currentAsset?.name || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <strong>Category:</strong> {currentCategory.name || 'N/A'}
                  </p>
                  <p className="text-gray-600">
                    <strong>Status:</strong> {currentAsset?.status || 'N/A'}
                  </p>
                </>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEntities([]);
                }}
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
            Assign Asset - {currentCategory.name}
          </h2>
          <span className="text-gray-600 text-sm">
            Assign asset(s) to a {currentCategory.can_be_assigned_to}
          </span>
        </div>
        <div className="flex gap-3">
          <Link to={`/asset-inventory/${categoryId}/assign`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Assign Assets
            </button>
          </Link>
          {selectedEntities.length > 0 && (
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              onClick={handleAssignClick}
            >
              Assign Selected ({selectedEntities.length})
            </button>
          )}
        </div>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={`Search ${currentCategory.can_be_assigned_to}s...`}
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 border border-gray-300 rounded-lg w-full max-w-md text-gray-700"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEntities.map((entity) => (
              <tr key={entity._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedEntities.includes(entity._id)}
                    onChange={() => handleEntitySelect(entity._id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entity.name || `${entity.first_name} ${entity.last_name}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity._id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleEntitySelect(entity._id)}
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
          {Math.min(currentPage * itemsPerPage, filteredEntities.length)} of {filteredEntities.length} {currentCategory.can_be_assigned_to}s
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

export default EmployeeAssignment;