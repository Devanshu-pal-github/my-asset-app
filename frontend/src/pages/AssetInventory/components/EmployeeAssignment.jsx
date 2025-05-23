import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import logger from '../../../utils/logger';
import { paginate, sortData, filterData } from './tableUtils';
import { fetchAssetItemById, fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import { createAssignment } from '../../../store/slices/assignmentHistorySlice';

const EmployeeAssignment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { categoryId, assetId } = useParams();
  const location = useLocation();
  const { selectedAssets = [] } = location.state || {};
  
  // State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const itemsPerPage = 10;

  // Get data from Redux store
  const { categories } = useSelector(state => state.assetCategories);
  const { items: assets, currentItem: assetItem } = useSelector(state => state.assetItems);
  const { employees } = useSelector(state => state.employees);
  
  // Fetch data on component mount
  useEffect(() => {
    logger.debug('EmployeeAssignment useEffect triggered', { categoryId, assetId, selectedAssets });
    
    // Fetch asset categories if not already loaded
    if (categories.length === 0) {
      dispatch(fetchAssetCategories())
        .unwrap()
        .then(() => logger.info('Categories fetched successfully'))
        .catch(err => logger.error('Error fetching categories', { error: err }));
    }
    
    // Fetch employees
    dispatch(fetchEmployees())
      .unwrap()
      .then(result => logger.info('Employees fetched successfully', { count: result.length }))
      .catch(err => logger.error('Error fetching employees', { error: err }));
    
    // If specific asset ID provided, fetch that asset
    if (assetId) {
      dispatch(fetchAssetItemById(assetId))
        .unwrap()
        .then(result => logger.info('Asset fetched successfully', { id: result.id, name: result.name }))
        .catch(err => logger.error('Error fetching asset', { error: err }));
    }
    
    // If category ID provided, fetch assets for that category
    if (categoryId) {
      dispatch(fetchAssetItemsByCategory(categoryId))
        .unwrap()
        .then(result => logger.info('Category assets fetched successfully', { count: result.length }))
        .catch(err => logger.error('Error fetching category assets', { error: err }));
    }
  }, [dispatch, categoryId, assetId, selectedAssets, categories.length]);

  const currentCategory = categories.find((cat) => cat.id === categoryId) || {};
  const currentAsset = assetId ? (assetItem || assets.find((asset) => asset.id === assetId)) : null;

  // Get appropriate entities based on category assignment settings
  const entities = () => {
    logger.debug('Getting entities based on category settings', { 
      categoryId, 
      categoryName: currentCategory.name || 'Unknown',
      assignableTo: currentCategory.assignment_policies?.assignable_to || currentCategory.can_be_assigned_to
    });
    
    const assignableTo = currentCategory.assignment_policies?.assignable_to || 
                        currentCategory.can_be_assigned_to || 'single_employee';
    
    // Filter employees based on assignment policy
    let filteredEmployees = employees;
    
    switch (assignableTo) {
      case 'department':
        // Only show employees from specific departments if defined
        if (currentCategory.assignment_policies?.assignable_to_departments?.length > 0) {
          filteredEmployees = employees.filter(emp => 
            currentCategory.assignment_policies.assignable_to_departments.includes(emp.department)
          );
        }
        break;
      case 'team':
        // Only show employees from specific teams if defined
        if (currentCategory.assignment_policies?.assignable_to_teams?.length > 0) {
          filteredEmployees = employees.filter(emp => 
            currentCategory.assignment_policies.assignable_to_teams.includes(emp.team)
          );
        }
        break;
      case 'single_employee':
      case 'employee':
      default:
        // Return all employees by default
        break;
    }
    
    return filteredEmployees;
  };

  const entityList = entities();
  
  // Check if multiple employee selection is allowed
  const allowMultipleEmployees = useMemo(() => {
    const assignmentType = currentCategory.assignment_policies?.assignable_to || 
                          currentCategory.can_be_assigned_to;
    return assignmentType === 'team' || assignmentType === 'department';
  }, [currentCategory]);

  // Handle entity selection
  const handleEntitySelect = (entityId) => {
    if (!allowMultipleEmployees) {
      // If multiple selection is not allowed, replace the selection
      setSelectedEntities([entityId]);
    } else {
      // If multiple selection is allowed, toggle the selection
      setSelectedEntities((prev) =>
        prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]
      );
    }
    logger.debug('Entity selection changed', { 
      entityId, 
      selectedEntities, 
      allowMultipleEmployees 
    });
  };

  // Show confirmation modal when Assign button clicked
  const handleAssignClick = () => {
    if (selectedEntities.length === 0) {
      setNotification({ 
        type: 'error', 
        message: 'Please select at least one employee to assign.' 
      });
      return;
    }
    logger.debug('Opening confirm modal for assignment', { 
      selectedEntities, 
      selectedAssets,
      allowMultipleEmployees
    });
    setShowConfirmModal(true);
  };

  // Process the assignment when confirmed
  const confirmAssignment = async () => {
    if (selectedEntities.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please select at least one employee to assign.'
      });
      setShowConfirmModal(false);
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Determine which assets to assign
      const assetsToAssign = selectedAssets.length > 0 
        ? selectedAssets 
        : [assetId];
      
      if (assetsToAssign.length === 0) {
        throw new Error('No assets selected for assignment');
      }
      
      logger.info('Starting asset assignment process', { 
        assetCount: assetsToAssign.length,
        entityCount: selectedEntities.length,
        categoryId
      });
      
      // Create an array of promises for parallel processing
      const assignmentPromises = [];
      
      // For each selected asset, assign it to each selected entity
      for (const assetId of assetsToAssign) {
        const asset = assets.find(item => item.id === assetId);
        
        if (!asset) {
          logger.error('Asset not found for assignment', { assetId });
          continue;
        }
        
        // Find asset's category
        const category = categories.find(cat => cat.id === asset.category_id);
        
        for (const entityId of selectedEntities) {
          const entity = employees.find(emp => emp.id === entityId);
          
          if (!entity) {
            logger.error('Entity not found for assignment', { entityId });
            continue;
          }
          
          const entityName = `${entity.first_name} ${entity.last_name}`;
          
          logger.debug('Creating assignment for asset-entity pair', {
            assetId: asset.id,
            assetName: asset.name,
            entityId: entity.id,
            entityName
          });
          
          // Create the assignment through Redux
          assignmentPromises.push(
            dispatch(createAssignment({
              assetId: asset.id,
              employeeId: entity.id,
              assignmentNotes: `Assigned ${asset.name || 'Asset'} to ${entityName}`,
              assignmentType: 'PERMANENT',
              department: entity.department,
              location: entity.location || asset.location,
              condition: asset.condition || 'Good',
              assignedBy: 'system',
              assignedByName: 'System'
            })).unwrap()
          );
        }
      }
      
      // Wait for all assignment operations to complete
      const results = await Promise.all(assignmentPromises.map(p => p.catch(e => e)));
      
      // Check for errors
      const errors = results.filter(r => r instanceof Error);
      if (errors.length > 0) {
        logger.error('Some assignments failed', { 
          errorCount: errors.length,
          errors: errors.map(e => e.message)
        });
        throw new Error(`Failed to assign some assets: ${errors[0].message}`);
      }
      
      const successfulAssignments = results.filter(r => !(r instanceof Error));
      
      logger.info('Asset assignments completed successfully', { 
        count: successfulAssignments.length,
        results: successfulAssignments.map(r => ({
          id: r.id,
          assetId: r.asset_id,
          employeeId: r.employee_id
        }))
      });
      
      // Build success notification
      const entityNames = selectedEntities.map(entityId => {
        const entity = employees.find(emp => emp.id === entityId);
        return entity 
          ? `${entity.first_name} ${entity.last_name}`
          : 'Unknown';
      });
      
      // Set success notification
      setNotification({
        type: 'success',
        message: `Asset(s) successfully assigned to ${entityNames.join(', ')}`,
      });
      
      // Refresh asset list and categories
      if (categoryId) {
        dispatch(fetchAssetItemsByCategory(categoryId));
        dispatch(fetchAssetCategories());
      }
      
      // Navigate back after a short delay
      setTimeout(() => {
        navigate(`/asset-inventory/${categoryId}/assign`);
      }, 1500);
      
    } catch (error) {
      logger.error('Failed to assign assets', { 
        error: error.message || 'Unknown error',
        stack: error.stack,
        selectedAssets, 
        selectedEntities
      });
      
      setNotification({
        type: 'error',
        message: error.message || 'Failed to assign assets',
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
    }
  };

  // Handle sorting
  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  // Filter, sort and paginate entities
  const filteredEntities = filterData(entityList || [], globalFilter, ['name', 'first_name', 'last_name', 'department', 'employee_id']);
  const sortedEntities = sortData(filteredEntities, sortField, sortOrder);
  const paginatedEntities = paginate(sortedEntities, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredEntities.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Loading or error states
  if (!currentCategory || !currentCategory.name) {
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

  if (!entityList || entityList.length === 0) {
    logger.info('No entities found');
    return (
      <div className="p-6 text-gray-600">
        No employees available for assignment.{' '}
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
            
            {/* Assignment Policy Info */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800">Assignment Policy</h4>
              <p className="text-sm text-blue-600">
                {allowMultipleEmployees 
                  ? 'Multiple employees can be selected for assignment.'
                  : 'Only one employee can be selected for assignment.'}
              </p>
              {currentCategory.assignment_policies?.assignable_to_departments?.length > 0 && (
                <p className="text-sm text-blue-600 mt-1">
                  Restricted to departments: {currentCategory.assignment_policies.assignable_to_departments.join(', ')}
                </p>
              )}
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Assets</h4>
              {selectedAssets.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {selectedAssets.map((assetId) => {
                    const asset = assets.find((a) => a.id === assetId);
                    return asset ? (
                      <div key={asset.id} className="p-2 bg-gray-50 rounded-lg">
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-gray-600">Tag: {asset.asset_tag}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-gray-600 mt-2">No assets selected</p>
              )}
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Employees</h4>
              <div className="mt-2 space-y-2">
                {selectedEntities.map((entityId) => {
                  const entity = entityList.find((e) => e.id === entityId);
                  return entity ? (
                    <div key={entity.id} className="p-2 bg-gray-50 rounded-lg">
                      <p className="font-medium">
                        {entity.full_name || `${entity.first_name} ${entity.last_name}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        Department: {entity.department || 'N/A'}
                      </p>
                    </div>
                  ) : null;
                })}
              </div>
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
                Confirm Assignment
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
            {allowMultipleEmployees 
              ? 'Select one or more employees to assign assets to'
              : 'Select an employee to assign assets to'}
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
              Assign to {selectedEntities.length} Selected
            </button>
          )}
        </div>
      </div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search employees..."
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
              <tr key={entity.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedEntities.includes(entity.id)}
                    onChange={() => handleEntitySelect(entity.id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {entity.full_name || `${entity.first_name} ${entity.last_name}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entity.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleEntitySelect(entity.id)}
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
          {Math.min(currentPage * itemsPerPage, filteredEntities.length)} of {filteredEntities.length} employees
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