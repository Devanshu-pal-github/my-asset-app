import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { fetchAssetItemsByCategory, assignAssetItem } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import logger from '../../../utils/logger';
import { paginate, sortData, filterData } from './tableUtils';

const EmployeeAssignment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { categoryId, assetId } = useParams();
  const location = useLocation();
  const { selectedAssets = [] } = location.state || {};
  const { employees = [], loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
  const { items: assets = [], loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories = [], loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('EmployeeAssignment useEffect triggered', { categoryId, assetId, selectedAssets });
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchEmployees()).unwrap(),
          dispatch(fetchAssetItemsByCategory(categoryId)),
          dispatch(fetchAssetCategories()),
        ]);
      } catch (error) {
        logger.error('Failed to fetch initial data', { error: error.message });
        setNotification({ type: 'error', message: 'Failed to load data. Please refresh the page.' });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch, categoryId, assetId]);

  const currentCategory = categories.find((cat) => cat._id === categoryId) || {};
  const currentAsset = assetId ? assets.find((asset) => asset._id === assetId) : null;

  // Dynamically fetch entities based on assignable_to
  const entities = currentCategory.assignable_to === 'employee' ? employees : []; // TODO: Add teams, departments, etc.

  const handleAssignClick = (entity) => {
    logger.info('Assign button clicked', { entityId: entity._id, assetId, selectedAssets });
    setSelectedEntity(entity);
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    if (!selectedEntity) {
      setShowConfirmModal(false);
      return;
    }

    try {
      const assetsToAssign = selectedAssets.length > 0 ? selectedAssets : [assetId];
      for (const id of assetsToAssign) {
        await dispatch(
          assignAssetItem({
            assetId: id,
            entityId: selectedEntity._id,
            entityType: currentCategory.assignable_to,
          })
        ).unwrap();
      }

      setNotification({
        type: 'success',
        message: `Asset(s) assigned to ${selectedEntity.name || selectedEntity.first_name + ' ' + selectedEntity.last_name}`,
      });

      dispatch(fetchAssetItemsByCategory(categoryId));
      dispatch(fetchEmployees());

      // Navigate back to the assignment table after successful assignment
      setTimeout(() => {
        navigate(`/asset-inventory/${categoryId}/assign`);
      }, 1500);
    } catch (error) {
      logger.error('Failed to assign asset', { error: error.message });
      setNotification({
        type: 'error',
        message: error.message || 'Failed to assign asset',
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

  const filteredEntities = filterData(entities, globalFilter, ['name', 'first_name', 'last_name', 'department', 'role']);
  const sortedEntities = sortData(filteredEntities, sortField, sortOrder);
  const paginatedEntities = paginate(sortedEntities, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredEntities.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const assignButton = (entity) => {
    const isAlreadyAssigned = entity.assigned_assets?.some((asset) =>
      (selectedAssets.length > 0 ? selectedAssets : [assetId]).includes(asset.asset_id)
    );
    const allowMultipleAssignments = currentCategory.allow_multiple_assignments;
    const canAssign = !isAlreadyAssigned || allowMultipleAssignments;

    return (
      <button
        className={`px-4 py-2 rounded text-white ${
          canAssign ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
        onClick={() => canAssign && handleAssignClick(entity)}
        disabled={!canAssign}
      >
        Assign
      </button>
    );
  };

  if (isLoading || employeesLoading || assetsLoading || categoriesLoading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (employeesError || assetsError || categoriesError) {
    const errorMessage = employeesError || assetsError || categoriesError;
    logger.error('EmployeeAssignment error', { error: errorMessage });
    return (
      <div className="p-6 text-red-600">
        <span className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Error: {errorMessage}
        </span>
        <Link to="/asset-inventory" className="text-blue-600 underline hover:text-blue-800 ml-2">
          Back to Inventory
        </Link>
      </div>
    );
  }

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

  if (!entities.length) {
    logger.info('No entities found');
    return (
      <div className="p-6 text-gray-600">
        No {currentCategory.assignable_to}s available for assignment.{' '}
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
              Are you sure you want to assign the following asset(s) to this {currentCategory.assignable_to}?
            </p>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">{currentCategory.assignable_to} Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {selectedEntity?.name || `${selectedEntity?.first_name} ${selectedEntity?.last_name}`}
              </p>
              <p className="text-gray-600">
                <strong>ID:</strong> {selectedEntity?.employee_id || selectedEntity?._id}
              </p>
              <p className="text-gray-600">
                <strong>Department:</strong> {selectedEntity?.department || 'N/A'}
              </p>
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
                  setSelectedEntity(null);
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
            Assign asset(s) to a {currentCategory.assignable_to}
          </span>
        </div>
        <Link to={`/asset-inventory/${categoryId}/assign`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Back to Assign Assets
          </button>
        </Link>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder={`Search ${currentCategory.assignable_to}s...`}
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEntities.map((entity) => (
              <tr key={entity._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entity.name || `${entity.first_name} ${entity.last_name}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entity.employee_id || entity._id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entity.department || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {assignButton(entity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredEntities.length)} of {filteredEntities.length} {currentCategory.assignable_to}s
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