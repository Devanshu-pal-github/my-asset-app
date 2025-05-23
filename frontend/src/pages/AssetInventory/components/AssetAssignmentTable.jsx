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
  
  // Get the selected assets with details for display
  const selectedAssetsWithDetails = useMemo(() => {
    return selectedAssets.map(assetId => {
      const matchedAsset = assets.find(a => a.id === assetId);
      
      if (!matchedAsset) {
        logger.warn(`Asset not found for ID ${assetId}`, { 
          availableAssetIds: assets.slice(0, 5).map(a => a.id),
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
      const matchedEntity = employees.find(e => e.id === entityId);
      
      if (!matchedEntity) {
        logger.warn(`Employee not found for ID ${entityId}`, { 
          availableEmployeeIds: employees.slice(0, 5).map(e => e.id),
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
    
    // Get category details for assignment policies
    const category = categories.find(cat => cat.id === categoryId);
    const allowMultipleAssignments = category?.assignment_policies?.allow_multiple_assignments || 
                                   category?.allow_multiple_assignments || false;
    
    // Filter out assets that are not assignable
    const assignableAssets = categoryAssets.filter(asset => {
      const isAvailable = asset.status === 'available';
      const isNotAssigned = !asset.has_active_assignment && !asset.current_assignee_id;
      const isNotUnderMaintenance = asset.status !== 'under_maintenance' && asset.status !== 'maintenance_requested';
      const isNotDecommissioned = asset.status !== 'retired' && asset.status !== 'lost';
      
      // An asset is assignable if:
      // 1. It's available and not assigned, OR
      // 2. It's assigned but allows multiple assignments
      const canBeAssigned = (isAvailable && isNotAssigned && isNotUnderMaintenance && isNotDecommissioned) ||
                           (allowMultipleAssignments && !isNotUnderMaintenance && !isNotDecommissioned);
      
      // Log debug info for assets that might be confusing
      if (isAvailable && !canBeAssigned) {
        logger.debug('Asset is available but not assignable', {
          id: asset.id,
          name: asset.name,
          status: asset.status,
          has_active_assignment: asset.has_active_assignment,
          current_assignee_id: asset.current_assignee_id,
          allowMultipleAssignments
        });
      }
      
      return canBeAssigned;
    });
    
    logger.debug('Assignable assets filtered', { 
      count: assignableAssets.length,
      firstItem: assignableAssets[0],
      allowMultipleAssignments
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
  }, [assets, categoryId, searchTerm, categories]);

  // Sort and search related functions
  const searchFilteredAssets = filteredAssets;

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handleAssetSelect = (assetId) => {
    if (!assetId) {
      logger.warn('Attempted to select asset with invalid ID');
      return;
    }
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleAssetDirectAssign = (assetId) => {
    if (!assetId) {
      logger.warn('Attempted to directly assign asset with invalid ID');
      return;
    }
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
    if (!entityId) {
      logger.warn('Attempted to select entity with invalid ID');
      return;
    }
    setSelectedEntities((prev) =>
      prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]
    );
  };

  const handleEntityAssign = (entityId) => {
    if (!entityId) {
      logger.warn('Attempted to assign to entity with invalid ID');
      return;
    }
    
    logger.info('Initiating direct assignment to entity', { entityId });
    
    // Set the selected entity and show confirmation modal
    setSelectedEntities([entityId]);
    setShowEmployeeModal(false);
    setShowConfirmModal(true);
  };

  const handleAssignSelected = () => {
    if (selectedEntities.length === 0) {
      setNotification({
        type: 'error',
        message: 'Please select at least one entity.',
      });
      return;
    }
    
    logger.info('Proceeding with bulk assignment', { 
      selectedEntities,
      selectedAssets
    });
    
    setShowEmployeeModal(false);
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate selected assets and entities
      const validSelectedAssets = selectedAssets.filter(id => id && assets.some(asset => asset._id === id || asset.id === id));
      const validSelectedEntities = selectedEntities.filter(id => id && employees.some(emp => emp._id === id || emp.id === id));
      
      if (validSelectedAssets.length === 0) {
        throw new Error('No valid assets selected for assignment');
      }
      
      // Determine which entities to use (either selected or target)
      const entitiesToAssign = targetEmployeeId 
        ? [targetEmployeeId] 
        : validSelectedEntities;
      
      if (entitiesToAssign.length === 0) {
        throw new Error('No valid employees selected for assignment');
      }
      
      // Log assignment details with validated data
      logger.info('Starting asset assignment process', {
        selectedAssets: validSelectedAssets.length,
        selectedEntities: entitiesToAssign.length,
        targetEmployeeId
      });
      
      // Create an array of promises for parallel processing
      const assignmentPromises = [];
      
      // For each selected asset, assign it to each selected entity
      for (const assetId of validSelectedAssets) {
        const asset = assets.find(item => item._id === assetId || item.id === assetId);
        
        if (!asset) {
          logger.error('Asset not found for assignment', { assetId });
          continue;
        }
        
        // Find asset's category to get department
        const category = categories.find(cat => cat.id === asset.category_id);
        
        for (const entityId of entitiesToAssign) {
          const entity = employees.find(emp => emp._id === entityId || emp.id === entityId);
          
          if (!entity) {
            logger.error('Entity not found for assignment', { entityId });
            continue;
          }
          
          const currentTime = new Date().toISOString();
          
          // Create assignment with explicit field mapping for backend
          assignmentPromises.push(
            dispatch(createAssignment({
              asset_id: asset.id || asset._id,
              asset_name: asset.name || 'Unknown Asset',
              asset_tag: asset.asset_tag || '',
              category_id: category?.id || '',
              category_name: category?.name || '',
              assigned_to: entity.id || entity._id,
              assigned_to_name: `${entity.first_name} ${entity.last_name}`,
              employee_id: entity.id || entity._id,
              employee_name: `${entity.first_name} ${entity.last_name}`,
              assignment_type: 'PERMANENT',
              status: 'active',
              assigned_date: currentTime,
              assignment_notes: `Assigned via Asset Management System to ${entity.first_name} ${entity.last_name}`,
              department: entity.department || category?.name || '',
              location: entity.location || asset.location || '',
              condition_at_assignment: asset.condition || 'Good',
              terms_accepted: true,
              bypass_policy: false
            })).unwrap()
          );
        }
      }
      
      // Wait for all assignment operations to complete
      const results = await Promise.all(assignmentPromises);
      
      if (results.length === 0) {
        throw new Error('No assignments were created');
      }
      
      logger.info('Asset assignment completed successfully', { 
        count: results.length,
        results: results.map(r => ({id: r.id, assetId: r.asset_id, employeeId: r.employee_id}))
      });
      
      // Build notification message
      const entityNames = entitiesToAssign.map(entityId => {
        const entity = employees.find(emp => emp._id === entityId || emp.id === entityId);
        return entity ? `${entity.first_name} ${entity.last_name}` : 'Unknown Employee';
      });
      
      // Refresh asset list to show updated assignments
      await dispatch(fetchAssetItemsByCategory(categoryId));
      
      setNotification({
        type: 'success',
        message: `Successfully assigned ${validSelectedAssets.length} asset(s) to ${entityNames.join(', ')}`,
      });
      
      // Reset selection states
      setSelectedAssets([]);
      setSelectedEntities([]);
      setShowConfirmModal(false);
      
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

  // Update the modal content to display asset and entity details properly
  const renderConfirmModal = () => {
    // Get category details for assignment policies
    const category = categories.find(cat => cat.id === categoryId);
    const allowMultipleAssignments = category?.assignment_policies?.allow_multiple_assignments || 
                                   category?.allow_multiple_assignments || false;
    
    // Get detailed information about the selected assets
    const selectedAssetsList = selectedAssets.map((assetId) => {
      const asset = assets.find((a) => a._id === assetId || a.id === assetId);
      return asset || { name: 'Unknown Asset', asset_tag: 'N/A', status: 'unknown' };
    });

    // Get detailed information about the selected entities
    const selectedEntitiesList = selectedEntities.map((entityId) => {
      const entity = employees.find((e) => e._id === entityId || e.id === entityId);
      return entity || { first_name: 'Unknown', last_name: 'Employee', department: 'N/A' };
    });

    return (
      <div className="fixed z-10 inset-0 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
          <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full p-6 relative z-10">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirm Assignment
              </h3>
              
              {/* Display category assignment policy */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-800">Category Assignment Policy</h4>
                <p className="text-sm text-blue-600">
                  {allowMultipleAssignments 
                    ? 'This category allows multiple assignments per asset.'
                    : 'This category allows only one assignment per asset.'}
                </p>
              </div>
              
              {/* Display selected assets */}
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-800">Selected Assets:</h4>
                <div className="mt-1 max-h-40 overflow-y-auto">
                  {selectedAssetsList.map((asset) => (
                    <div key={asset._id || asset.id} className="mt-1 p-2 border border-gray-200 rounded">
                      <p className="text-gray-800"><strong>Name:</strong> {asset.name}</p>
                      <p className="text-gray-600"><strong>Tag:</strong> {asset.asset_tag}</p>
                      <p className="text-gray-600"><strong>Status:</strong> {asset.status}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Display selected employees */}
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-800">Assigning to:</h4>
                <div className="mt-1 max-h-40 overflow-y-auto">
                  {selectedEntitiesList.map((entity) => (
                    <div key={entity._id || entity.id} className="mt-1 p-2 border border-gray-200 rounded">
                      <p className="text-gray-800">
                        <strong>Name:</strong> {`${entity.first_name} ${entity.last_name}`}
                      </p>
                      <p className="text-gray-600"><strong>Department:</strong> {entity.department || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowEmployeeModal(true);
                }}
                className="bg-gray-400 hover:bg-gray-500 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Back
              </button>
              <button
                onClick={confirmAssignment}
                disabled={isSubmitting}
                className={`${
                  isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white font-medium py-2 px-4 rounded transition-colors flex items-center`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  'Confirm Assignment'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Update the employee modal content
  const renderEmployeeModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Assign Asset{selectedAssets.length > 1 ? 's' : ''} - {currentCategory?.name}
          </h3>
          
          <div className="border rounded-lg p-4 bg-gray-50 mb-4">
            <h4 className="font-medium text-gray-800 mb-2">Selected Assets</h4>
            <div className="mb-4 flex flex-wrap gap-2">
              {selectedAssets.map((assetId) => {
                const asset = assets.find((a) => a._id === assetId || a.id === assetId);
                return (
                  <div key={assetId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {asset?.name} ({asset?.asset_tag})
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search employees..."
              value={employeeSearchTerm}
              onChange={(e) => setEmployeeSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Select</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {employees
                  .filter(emp => 
                    !employeeSearchTerm || 
                    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                    emp.department?.toLowerCase().includes(employeeSearchTerm.toLowerCase())
                  )
                  .map((employee) => (
                    <tr key={employee._id || employee.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedEntities.includes(employee._id || employee.id)}
                          onChange={() => handleEntitySelect(employee._id || employee.id)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="px-6 py-4">{employee.first_name} {employee.last_name}</td>
                      <td className="px-6 py-4">{employee.department || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleEntityAssign(employee._id || employee.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between">
            <button
              onClick={handleAssignSelected}
              disabled={selectedEntities.length === 0}
              className={`${
                selectedEntities.length > 0
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'
              } text-white px-4 py-2 rounded-lg`}
            >
              Assign to Selected ({selectedEntities.length})
            </button>
            <button
              onClick={() => setShowEmployeeModal(false)}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
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
      
      {showConfirmModal && renderConfirmModal()}
      
      {showEmployeeModal && renderEmployeeModal()}
      
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
              <tr key={asset._id || asset.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset._id || asset.id)}
                    onChange={() => handleAssetSelect(asset._id || asset.id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.asset_tag}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleAssetDirectAssign(asset._id || asset.id)}
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