import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import logger from '../../../utils/logger';
import { paginate, sortData, filterData } from './tableUtils';

// Mock data
const mockEmployees = [
  { _id: 'emp1', first_name: 'John', last_name: 'Doe', department: 'Engineering', assigned_assets: [{ asset_id: 'asset1' }] },
];

const mockCategories = [
  { _id: 'cat1', name: 'Laptops', can_be_assigned_to: 'single_employee' },
];

const mockAssets = [
  { _id: 'asset1', name: 'MacBook Pro', asset_tag: 'LT001', status: 'assigned', category_id: 'cat1' },
];

const EmployeeUnassignment = () => {
  const navigate = useNavigate();
  const { categoryId, assetId } = useParams();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [actionType, setActionType] = useState('unassign');
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('EmployeeUnassignment useEffect triggered', { categoryId, assetId });
    logger.info('Simulating fetch with mock data', { categoryId, assetId });
  }, [categoryId, assetId]);

  const currentCategory = mockCategories.find((cat) => cat._id === categoryId) || {};
  const currentAsset = mockAssets.find((asset) => asset._id === assetId) || null;

  const assignedEntities = mockEmployees.filter((entity) =>
    entity.assigned_assets?.some((asset) => asset.asset_id === assetId)
  );

  const handleUnassignClick = (entity, type) => {
    logger.info('Unassign button clicked', { entityId: entity._id, assetId, type });
    setSelectedEntity(entity);
    setActionType(type);
    setShowConfirmModal(true);
  };

  const confirmUnassignment = async () => {
    if (!selectedEntity) {
      setShowConfirmModal(false);
      return;
    }

    try {
      logger.info('Unassigning asset', { assetId, entityId: selectedEntity._id });
      setNotification({
        type: 'success',
        message: `Asset unassigned from ${selectedEntity.name || selectedEntity.first_name + ' ' + selectedEntity.last_name}`,
      });

      if (actionType === 'unassign_and_reassign') {
        // Navigate to AssetAssignmentTable with employeeId in state
        navigate(`/asset-inventory/${categoryId}/assign`, {
          state: { employeeId: selectedEntity._id },
        });
      } else {
        setTimeout(() => {
          navigate(`/asset-inventory/${categoryId}/unassign`);
        }, 1500);
      }
    } catch (error) {
      logger.error('Failed to unassign asset', { error: error.message });
      setNotification({
        type: 'error',
        message: 'Failed to unassign asset',
      });
    } finally {
      setShowConfirmModal(false);
      setSelectedEntity(null);
    }
  };

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const filteredEntities = filterData(assignedEntities, globalFilter, ['name', 'first_name', 'last_name', 'department']);
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

  if (!currentAsset) {
    logger.warn('Asset not found', { assetId });
    return (
      <div className="p-6 text-gray-600">
        Asset not found.{' '}
        <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-blue-600 underline hover:text-blue-800">
          Back to Unassign Assets
        </Link>
      </div>
    );
  }

  if (!assignedEntities.length) {
    logger.info('No entities with this asset assigned');
    return (
      <div className="p-6 text-gray-600">
        No {currentCategory.can_be_assigned_to}s currently assigned to this asset.{' '}
        <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-blue-600 underline hover:text-blue-800">
          Back to Unassign Assets
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
            <h3 className="text-lg font-semibold text-gray-800">Confirm Unassignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to unassign this asset from the {currentCategory.can_be_assigned_to}?
            </p>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">{currentCategory.can_be_assigned_to} Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {selectedEntity?.name || `${selectedEntity?.first_name} ${selectedEntity?.last_name}`}
              </p>
              <p className="text-gray-600">
                <strong>ID:</strong> {selectedEntity?._id}
              </p>
              <p className="text-gray-600">
                <strong>Department:</strong> {selectedEntity?.department || 'N/A'}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Asset Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {currentAsset?.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Category:</strong> {currentCategory.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Status:</strong> {currentAsset?.status || 'N/A'}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEntity(null);
                }}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setActionType('unassign');
                  confirmUnassignment();
                }}
              >
                Unassign
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setActionType('unassign_and_reassign');
                  confirmUnassignment();
                }}
              >
                Unassign & Reassign
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            Unassign Asset - {currentCategory.name}
          </h2>
          <span className="text-gray-600 text-sm">
            Unassign asset from a {currentCategory.can_be_assigned_to}
          </span>
        </div>
        <Link to={`/asset-inventory/${categoryId}/unassign`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Back to Unassign Assets
          </button>
        </Link>
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
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('name')}
              >
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEntities.map((entity) => (
              <tr key={entity._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entity.name || `${entity.first_name} ${entity.last_name}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity._id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleUnassignClick(entity, 'unassign')}
                  >
                    Unassign
                  </button>
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleUnassignClick(entity, 'unassign_and_reassign')}
                  >
                    Unassign & Reassign
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

export default EmployeeUnassignment;