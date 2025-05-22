import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import logger from '../../../utils/logger';
import { paginate, sortData } from './tableUtils';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { createAssignment } from '../../../store/slices/assignmentHistorySlice';

const AssetAssignmentTable = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { categoryId } = useParams();
  
  // Redux state
  const { categories } = useSelector((state) => state.assetCategories);
  const { items: assets, loading: assetsLoading } = useSelector((state) => state.assetItems);
  const { employees, loading: employeesLoading } = useSelector((state) => state.employees);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('asset_tag');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const itemsPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // For debugging

  // Check for employeeId in navigation state
  const targetEmployeeId = location.state?.employeeId;
  const targetEmployee = employees.find((emp) => emp.id === targetEmployeeId || emp._id === targetEmployeeId);

  useEffect(() => {
    logger.debug('AssetAssignmentTable useEffect triggered', { categoryId, targetEmployeeId });
    
    // Fetch assets for the category
    if (categoryId) {
      dispatch(fetchAssetItemsByCategory(categoryId))
        .unwrap()
        .then((result) => {
          logger.info('Assets fetched successfully', { count: result.length });
          console.log('Assets fetched:', result);
        })
        .catch((error) => {
          logger.error('Failed to fetch assets', { error });
          setNotification({
            type: 'error',
            message: 'Failed to fetch assets. Please try again.'
          });
        });
    }
    
    // Fetch employees if needed
    dispatch(fetchEmployees())
      .unwrap()
      .then((result) => {
        logger.info('Employees fetched successfully', { count: result.length });
        console.log('Employees fetched:', result);
      })
      .catch((error) => {
        logger.error('Failed to fetch employees', { error });
      });
  }, [categoryId, dispatch, targetEmployeeId]);

  // Add keyboard shortcut for debug mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+D to toggle debug mode
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        setDebugMode(prev => {
          const newMode = !prev;
          console.log(`Debug mode ${newMode ? 'enabled' : 'disabled'}`);
          return newMode;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentCategory = categories.find((cat) => cat.id === categoryId);
  
  // Helper function to get the normalized ID (handle both id and _id cases)
  const getNormalizedId = (item) => {
    if (!item) return null;
    return item.id || item._id;
  };

  // Get the selected assets with details for display
  const selectedAssetsWithDetails = useMemo(() => {
    return selectedAssets.map(assetId => {
      const matchedAsset = assets.find(a => getNormalizedId(a) === assetId);
      
      if (!matchedAsset) {
        logger.warn(`Asset not found for ID ${assetId}`, { 
          availableAssetIds: assets.map(a => ({ id: a.id, _id: a._id })),
          selectedAssetId: assetId
        });
        return { id: assetId, name: 'Unknown Asset', asset_tag: 'Unknown' };
      }
      
      return matchedAsset;
    });
  }, [selectedAssets, assets]);

  // Get the selected entities with details for display
  const selectedEntitiesWithDetails = useMemo(() => {
    const entityIdsToUse = selectedEntities.length > 0 ? selectedEntities : 
                            targetEmployeeId ? [targetEmployeeId] : [];
                                
    return entityIdsToUse.map(entityId => {
      const matchedEntity = employees.find(e => getNormalizedId(e) === entityId);
      
      if (!matchedEntity) {
        logger.warn(`Employee not found for ID ${entityId}`, { 
          availableEmployeeIds: employees.map(e => ({ id: e.id, _id: e._id })),
          selectedEntityId: entityId
        });
        return { id: entityId, first_name: 'Unknown', last_name: 'Entity', department: 'Unknown' };
      }
      
      return matchedEntity;
    });
  }, [selectedEntities, employees, targetEmployeeId]);

  // Filter assets to show only unassigned assets
  const filteredAssets = useMemo(() => {
    logger.debug('Filtering assets for assignment table', { 
      totalAssets: assets.length,
      categoryId
    });
    
    // First filter by category if provided
    const categoryAssets = categoryId
      ? assets.filter(asset => asset.category_id === categoryId)
      : assets;
    
    logger.debug('Assets in selected category', { 
      count: categoryAssets.length, 
      categoryId,
      firstAsset: categoryAssets[0]
    });
    
    // Filter out assets that are not assignable
    const assignableAssets = categoryAssets.filter(asset => {
      const isAvailable = asset.status === 'available';
      const isNotAssigned = !asset.has_active_assignment && !asset.current_assignee_id;
      const isNotUnderMaintenance = asset.status !== 'under_maintenance' && asset.status !== 'maintenance_requested';
      const isNotDecommissioned = asset.status !== 'retired' && asset.status !== 'lost';
      
      // An asset is assignable if it's available/not assigned and not under maintenance/decommissioned
      const canBeAssigned = isAvailable && isNotAssigned && isNotUnderMaintenance && isNotDecommissioned;
      
      // Log debug info for assets that might be confusing
      if (isAvailable && !canBeAssigned) {
        logger.debug('Asset is available but not assignable', {
          id: asset.id,
          name: asset.name,
          status: asset.status,
          has_active_assignment: asset.has_active_assignment,
          current_assignee_id: asset.current_assignee_id
        });
      }
      
      return canBeAssigned;
    });
    
    logger.debug('Assignable assets filtered', { 
      count: assignableAssets.length,
      firstItem: assignableAssets[0]
    });
    
    // Filter by search term if provided
    if (!searchTerm) return assignableAssets;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return assignableAssets.filter(asset => 
      (asset.name && asset.name.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.asset_id && asset.asset_id.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.asset_tag && asset.asset_tag.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.status && asset.status.toLowerCase().includes(lowerSearchTerm))
    );
  }, [assets, categoryId, searchTerm]);

  // Sort and search related functions
  const searchFilteredAssets = filteredAssets;

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

  const handleAssetDirectAssign = (assetId) => {
    setSelectedAssets([assetId]);
    setShowEmployeeModal(true);
  };

  const handleAssignClick = () => {
    if (selectedAssets.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one asset to assign.' });
      return;
    }
    
    setShowEmployeeModal(true);
  };

  const handleEntitySelect = (entityId) => {
    setSelectedEntities((prev) =>
      prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]
    );
  };

  const handleEntityAssign = (entityId) => {
    setSelectedEntities([entityId]);
    setShowEmployeeModal(false);
    setShowConfirmModal(true);
  };

  const handleAssignSelected = () => {
    if (selectedEntities.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one entity.' });
      return;
    }
    
    setShowEmployeeModal(false);
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    try {
      setIsSubmitting(true);
      
      // Log detailed info about assignment process
      logger.info('Starting asset assignment process', {
        selectedAssets: selectedAssets.length,
        selectedEntities: selectedEntities.length,
        targetEmployeeId: targetEmployeeId
      });
      
      // Determine which entities to use (either selected or target)
      const entitiesToAssign = targetEmployeeId 
        ? [targetEmployeeId] 
        : selectedEntities;
      
      if (!entitiesToAssign.length) {
        throw new Error('No employees selected for assignment');
      }
      
      if (!selectedAssets.length) {
        throw new Error('No assets selected for assignment');
      }
      
      console.log('Assets to assign:', selectedAssetsWithDetails);
      console.log('Entities to assign to:', selectedEntitiesWithDetails);
      
      // Log assignment details
      logger.info('Assigning assets to entities', {
        assets: selectedAssets,
        entities: entitiesToAssign,
        assignmentType: 'bulk-assignment'
      });
      
      // Create an array of promises for parallel processing
      const assignmentPromises = [];
      
      // For each selected asset, assign it to each selected entity
      for (const assetId of selectedAssets) {
        const asset = assets.find(item => getNormalizedId(item) === assetId);
        
        if (!asset) {
          logger.error('Asset not found for assignment', { assetId });
          console.error(`Asset not found for assignment: ${assetId}`);
          continue;
        }
        
        logger.debug('Processing asset for assignment', {
          assetId,
          assetName: asset.name || asset.asset_name || 'Unknown',
          entities: entitiesToAssign
        });
        
        // Find asset's category to get department
        const category = categories.find(cat => cat.id === asset.category_id);
        const department = category?.category_name || 'Unknown Department';
        
        for (const entityId of entitiesToAssign) {
          const entity = employees.find(emp => getNormalizedId(emp) === entityId);
          
          if (!entity) {
            logger.error('Entity not found for assignment', { entityId });
            console.error(`Entity not found for assignment: ${entityId}`);
            continue;
          }
          
          const entityName = entity.name || `${entity.first_name} ${entity.last_name}` || 'Unknown';
          
          logger.debug('Creating assignment for asset-entity pair', {
            assetId: getNormalizedId(asset),
            entityId: getNormalizedId(entity),
            entityName
          });
          
          console.log(`Assigning asset "${asset.name}" to entity "${entityName}"`);
          
          // Create assignment with unwrap() to handle errors
          assignmentPromises.push(
            dispatch(createAssignment({
              assetId: getNormalizedId(asset),
              employeeId: getNormalizedId(entity),
              assignmentNotes: `Assigned via Asset Management System to ${entityName}`,
              department: entity.department || department,
              condition: asset.condition || 'Good',
              assignmentType: 'PERMANENT',
              startDate: new Date().toISOString()
            })).unwrap()
          );
        }
      }
      
      // Wait for all assignment operations to complete
      const results = await Promise.all(assignmentPromises);
      logger.info('Asset assignment completed successfully', { 
        count: results.length,
        results: results.map(r => ({id: r.id, assetId: r.asset_id, employeeId: r.employee_id}))
      });
      
      // Build notification message
      const entityNames = selectedEntitiesWithDetails.map(entity => 
        entity.name || `${entity.first_name} ${entity.last_name}`
      );
      
      // Refresh asset list to show updated assignments
      dispatch(fetchAssetItemsByCategory(categoryId));
      
      setNotification({
        type: 'success',
        message: `Asset(s) successfully assigned to ${entityNames.join(', ')}`,
      });
      
      setTimeout(() => {
        navigate('/asset-inventory');
      }, 1500);
      
    } catch (error) {
      logger.error('Failed to assign assets', { 
        error: error.message || 'Unknown error',
        stack: error.stack,
        selectedAssets, 
        selectedEntities,
        targetEmployeeId
      });
      
      setNotification({
        type: 'error',
        message: error.message || 'Failed to assign assets',
      });
    } finally {
      setIsSubmitting(false);
      setShowConfirmModal(false);
      setSelectedEntities([]);
      setSelectedAssets([]);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleEmployeeSearchChange = (e) => {
    setEmployeeSearchTerm(e.target.value);
  };

  const sortedAssets = sortData(searchFilteredAssets, sortField, sortOrder);
  const paginatedAssets = paginate(sortedAssets, currentPage, itemsPerPage);
  const totalPages = Math.ceil(searchFilteredAssets.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedEntities([]);
    setEmployeeSearchTerm('');
  };

  const handleNavigateToInventory = () => {
    navigate('/asset-inventory');
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
      {/* Loading states */}
      {(assetsLoading || employeesLoading || isSubmitting) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      )}

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
      
      {/* Debug information (toggle with Ctrl+D) */}
      {debugMode && (
        <div className="mb-6 p-4 bg-gray-800 text-white rounded-lg overflow-auto max-h-96">
          <h3 className="text-lg font-semibold">Debug Information</h3>
          <p><strong>Assets Count:</strong> {assets.length}</p>
          <p><strong>Filtered Assets Count:</strong> {filteredAssets.length}</p>
          <p><strong>Employees Count:</strong> {employees.length}</p>
          <p><strong>Selected Assets:</strong> {selectedAssets.join(', ')}</p>
          <p><strong>Selected Entities:</strong> {selectedEntities.join(', ')}</p>
          <pre className="mt-2 text-xs">{JSON.stringify({
            selectedAssetsWithDetails: selectedAssetsWithDetails.map(a => ({ id: a.id, name: a.name })),
            selectedEntitiesWithDetails: selectedEntitiesWithDetails.map(e => ({ id: e.id, name: `${e.first_name} ${e.last_name}` })),
            firstFewAssets: assets.slice(0, 3).map(a => ({ id: a.id, _id: a._id, name: a.name })),
            firstFewEmployees: employees.slice(0, 3).map(e => ({ id: e.id, _id: e._id, name: `${e.first_name} ${e.last_name}` })),
          }, null, 2)}</pre>
        </div>
      )}
      
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Assignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to assign the selected asset(s) to the selected entity/entities?
            </p>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Assets</h4>
              {selectedAssetsWithDetails.map((asset) => (
                <div key={asset.id || asset._id} className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-gray-600">
                    <strong>Name:</strong> {asset.name || 'Unknown'}
                  </p>
                  <p className="text-gray-600">
                    <strong>Asset Tag:</strong> {asset.asset_tag || 'Unknown'}
                  </p>
                  <p className="text-gray-600">
                    <strong>ID:</strong> {getNormalizedId(asset)}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Entities</h4>
              {selectedEntitiesWithDetails.map((entity) => (
                <div key={entity.id || entity._id} className="mt-2 p-2 bg-gray-50 rounded-md">
                  <p className="text-gray-600">
                    <strong>Name:</strong> {entity ? `${entity.first_name} ${entity.last_name}` : 'Unknown'}
                  </p>
                  <p className="text-gray-600">
                    <strong>ID:</strong> {getNormalizedId(entity)}
                  </p>
                  <p className="text-gray-600">
                    <strong>Department:</strong> {entity?.department || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowEmployeeModal(true);
                }}
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                className={`${isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white font-medium py-2 px-4 rounded-lg transition-colors`}
                onClick={confirmAssignment}
              >
                {isSubmitting ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Assign Asset{selectedAssets.length > 1 ? 's' : ''} - {currentCategory.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Select an entity to assign the asset{selectedAssets.length > 1 ? 's' : ''} to.
            </p>
            
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Selected Assets</h4>
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedAssets.map((assetId) => {
                  const asset = assets.find((a) => a.id === assetId);
                  return (
                    <div key={assetId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {asset?.name} ({asset?.asset_tag})
                    </div>
                  );
                })}
              </div>
              
              <h4 className="font-medium text-gray-800 mb-2">Available Entities</h4>
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, department or ID..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    value={employeeSearchTerm}
                    onChange={handleEmployeeSearchChange}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <i className="pi pi-search"></i>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="checkbox"
                            checked={selectedEntities.includes(employee._id)}
                            onChange={() => handleEntitySelect(employee._id)}
                            className="h-4 w-4"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee._id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                            onClick={() => handleEntityAssign(employee._id)}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {employees.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No matching employees found
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <div>
                {selectedEntities.length > 0 && (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    onClick={handleAssignSelected}
                  >
                    Assign to Selected ({selectedEntities.length})
                  </button>
                )}
              </div>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={handleCloseEmployeeModal}
              >
                Cancel
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
          <button
            className={`${
              selectedAssets.length > 0 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-300 cursor-not-allowed'
            } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
            onClick={selectedAssets.length > 0 ? handleAssignClick : undefined}
            disabled={selectedAssets.length === 0}
          >
            Assign {selectedAssets.length > 0 ? `Selected (${selectedAssets.length})` : ''}
          </button>
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
      
      {/* Search Box */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by asset name or tag..."
            className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="pi pi-search"></i>
          </div>
        </div>
      </div>
      
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
                    onClick={() => handleAssetDirectAssign(asset._id)}
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
            {paginatedAssets.length === 0 && (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No matching assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {searchFilteredAssets.length > 0 ? (
            <>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, searchFilteredAssets.length)} of {searchFilteredAssets.length} assets
            </>
          ) : (
            'No assets found matching your search'
          )}
        </div>
        {totalPages > 1 && (
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
        )}
      </div>
    </div>
  );
};

export default AssetAssignmentTable;