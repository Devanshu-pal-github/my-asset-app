import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import logger from '../../../utils/logger';
import { paginate, sortData } from './tableUtils';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { unassignAsset } from '../../../store/slices/assignmentHistorySlice';

const AssetUnassignmentTable = () => {
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
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [actionType, setActionType] = useState('unassign'); // 'unassign' or 'unassign_and_reassign'
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entitySearchTerm, setEntitySearchTerm] = useState('');
  const itemsPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for employeeId in navigation state
  const targetEmployeeId = location.state?.employeeId;
  const targetEmployee = employees.find((emp) => emp.id === targetEmployeeId);

  useEffect(() => {
    logger.debug('AssetUnassignmentTable useEffect triggered', { categoryId, targetEmployeeId });
    
    // Fetch assets for the category
    if (categoryId) {
      dispatch(fetchAssetItemsByCategory(categoryId))
        .unwrap()
        .then((result) => {
          logger.info('Assets fetched successfully', { count: result.length });
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
      })
      .catch((error) => {
        logger.error('Failed to fetch employees', { error });
      });
  }, [categoryId, dispatch, targetEmployeeId]);

  const currentCategory = categories.find((cat) => cat.id === categoryId);

  // Filter assets to show only assigned assets that can be unassigned
  const filteredAssets = useMemo(() => {
    logger.debug('Filtering assets for unassignment table', { 
      totalAssets: assets.length,
      categoryId
    });
    
    // First filter by category if provided
    const categoryAssets = categoryId
      ? assets.filter(asset => asset.category_id === categoryId)
      : assets;
    
    logger.debug('Assets in selected category', { 
      count: categoryAssets.length, 
      categoryId 
    });
    
    // Filter to only show assets that are currently assigned
    const assignedAssets = categoryAssets.filter(asset => {
      const isAssigned = asset.status === 'assigned';
      const hasActiveAssignment = asset.has_active_assignment === true;
      const hasAssignee = !!asset.current_assignee_id || 
                          (asset.current_assignment_id && asset.current_assignment_id !== '');
      
      // An asset is eligible for unassignment if it's assigned
      const canBeUnassigned = isAssigned || (hasActiveAssignment && hasAssignee);
      
      // Log debug info for assets that might be confusing
      if (hasAssignee && !canBeUnassigned) {
        logger.debug('Asset has assignee but not eligible for unassignment', {
          id: asset.id,
          name: asset.name,
          status: asset.status,
          has_active_assignment: asset.has_active_assignment,
          current_assignee_id: asset.current_assignee_id
        });
      }
      
      return canBeUnassigned;
    });
    
    logger.debug('Assigned assets filtered', { count: assignedAssets.length });
    
    // Filter by search term if provided
    if (!searchTerm) return assignedAssets;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return assignedAssets.filter(asset => 
      (asset.name && asset.name.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.asset_id && asset.asset_id.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.serial_number && asset.serial_number.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.asset_tag && asset.asset_tag.toLowerCase().includes(lowerSearchTerm)) ||
      (asset.status && asset.status.toLowerCase().includes(lowerSearchTerm))
    );
  }, [assets, categoryId, searchTerm]);

  // Sort and search related functions
  const searchFilteredAssets = filteredAssets;

  // Sort and paginate
  const sortedAssets = sortData(searchFilteredAssets, sortField, sortOrder);
  const paginatedAssets = paginate(sortedAssets, currentPage, itemsPerPage);
  const totalPages = Math.ceil(sortedAssets.length / itemsPerPage);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleAssetSelect = (assetId) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };
  
  const handleAssetDirectUnassign = (assetId) => {
    // Set the selected asset and show the employee modal
    setSelectedAssets([assetId]);
    setShowEmployeeModal(true);
  };
  
  const handleUnassignClick = () => {
    if (selectedAssets.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one asset to unassign.' });
      return;
    }
    
    // Open the employee unassignment modal
    setShowEmployeeModal(true);
  };
  
  const handleCloseEmployeeModal = () => {
    setShowEmployeeModal(false);
    setSelectedEntities([]);
    setEntitySearchTerm('');
  };
  
  const handleEntitySelect = (entityId) => {
    setSelectedEntities((prev) =>
      prev.includes(entityId) ? prev.filter((id) => id !== entityId) : [...prev, entityId]
    );
  };
  
  const handleEntityAction = (entityId, type) => {
    setSelectedEntities([entityId]);
    setActionType(type);
    // Close employee modal and show confirmation modal
    setShowEmployeeModal(false);
    setShowConfirmModal(true);
  };
  
  const handleUnassignSelected = (type) => {
    if (selectedEntities.length === 0) {
      setNotification({ type: 'error', message: 'Please select at least one entity.' });
      return;
    }
    
    setActionType(type);
    // Close employee modal and show confirmation modal
    setShowEmployeeModal(false);
    setShowConfirmModal(true);
  };
  
  const confirmUnassignment = async () => {
    try {
      setIsSubmitting(true);
      
      // Log detailed info about unassignment process
      logger.info('Starting asset unassignment process', {
        selectedAssets: selectedAssets.length,
        actionType
      });
      
      if (!selectedAssets.length) {
        throw new Error('No assets selected for unassignment');
      }
      
      // Create an array of promises for parallel processing
      const unassignmentPromises = [];
      
      // Process each asset
      for (const assetId of selectedAssets) {
        const asset = assets.find(a => a._id === assetId || a.id === assetId);
        
        if (!asset) {
          logger.error('Asset not found', { assetId });
          continue;
        }
        
        logger.debug('Processing asset for unassignment', {
          assetId,
          assetName: asset.name || asset.asset_name || 'Unknown',
          currentAssignmentId: asset.current_assignment_id
        });
        
        if (!asset.current_assignment_id) {
          logger.warn('No active assignment found for asset', { assetId });
          continue;
        }
        
        // Create unassignment with unwrap() to handle errors
        unassignmentPromises.push(
          dispatch(unassignAsset({
            assignmentId: asset.current_assignment_id,
            returnNotes: actionType === 'unassign_and_reassign' 
              ? 'Unassigned for reassignment' 
              : 'Unassigned via asset management system',
            returnDate: new Date().toISOString(),
            returnCondition: asset.condition || 'Good'
          })).unwrap()
        );
      }
      
      // Wait for all unassignment operations to complete
      const results = await Promise.all(unassignmentPromises);
      logger.info('Asset unassignment completed successfully', { 
        count: results.length,
        results: results.map(r => ({
          assignmentId: r.assignment_id,
          returnDate: r.return_date,
          status: r.status
        }))
      });
      
      // Refresh asset list to show updated assignments
      dispatch(fetchAssetItemsByCategory(categoryId));
      
      setNotification({
        type: 'success',
        message: `Asset(s) successfully unassigned${actionType === 'unassign_and_reassign' ? ' and ready for reassignment' : ''}`,
      });
      
      setTimeout(() => {
        // If it's unassign and reassign, navigate to assignment page
        if (actionType === 'unassign_and_reassign') {
          navigate(`/asset-inventory/${categoryId}/assign`, { 
            state: { selectedAssets } 
          });
        } else {
          // Otherwise just go back to inventory
          navigate('/asset-inventory');
        }
      }, 1500);
    } catch (error) {
      logger.error('Failed to unassign assets', { 
        error: error.message || 'Unknown error',
        stack: error.stack,
        selectedAssets, 
        actionType
      });
      
      setNotification({
        type: 'error',
        message: error.message || 'Failed to unassign assets',
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

  const handleEntitySearchChange = (e) => {
    setEntitySearchTerm(e.target.value);
  };

  // Get relevant entities for the selected assets
  const getRelevantEntities = () => {
    if (!selectedAssets.length) return [];
    
    // Filter employees who have any of the selected assets assigned to them
    return employees.filter(emp => 
      emp.assigned_assets.some(asset => selectedAssets.includes(asset.asset_id))
    );
  };

  // Apply search filter to relevant entities
  const filteredEntities = entitySearchTerm
    ? getRelevantEntities().filter(entity => 
        `${entity.first_name} ${entity.last_name}`.toLowerCase().includes(entitySearchTerm.toLowerCase()) ||
        entity.department.toLowerCase().includes(entitySearchTerm.toLowerCase()) ||
        entity._id.toLowerCase().includes(entitySearchTerm.toLowerCase()))
    : getRelevantEntities();

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
      
      {/* Loading states */}
      {(assetsLoading || employeesLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      )}
      
      {/* Employee Unassignment Modal */}
      {showEmployeeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Unassign Asset{selectedAssets.length > 1 ? 's' : ''} - {currentCategory.name}
            </h3>
            <p className="text-gray-600 mb-4">
              Select the entities from which to unassign the asset{selectedAssets.length > 1 ? 's' : ''}.
            </p>
            
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <h4 className="font-medium text-gray-800 mb-2">Selected Assets</h4>
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedAssets.map((assetId) => {
                  const asset = assets.find((a) => a._id === assetId);
                  return (
                    <div key={assetId} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {asset?.name} ({asset?.asset_tag})
                    </div>
                  );
                })}
              </div>
              
              <h4 className="font-medium text-gray-800 mb-2">Assigned Entities</h4>
              
              {/* Entity Search */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, department, or ID..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    value={entitySearchTerm}
                    onChange={handleEntitySearchChange}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <i className="pi pi-search"></i>
                  </div>
                </div>
              </div>
              
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredEntities.map((employee) => (
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                            onClick={() => handleEntityAction(employee._id, 'unassign')}
                          >
                            Unassign
                          </button>
                          <button
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                            onClick={() => handleEntityAction(employee._id, 'unassign_and_reassign')}
                          >
                            Unassign & Reassign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredEntities.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No matching entities found
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <div>
                {selectedEntities.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      onClick={() => handleUnassignSelected('unassign')}
                    >
                      Unassign Selected ({selectedEntities.length})
                    </button>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      onClick={() => handleUnassignSelected('unassign_and_reassign')}
                    >
                      Unassign & Reassign Selected
                    </button>
                  </div>
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
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Unassignment</h3>
            <p className="text-gray-600 mt-2">
              {actionType === 'unassign' 
                ? 'Are you sure you want to unassign the selected asset(s) from the selected entity/entities?' 
                : 'Are you sure you want to unassign the selected asset(s) from the selected entity/entities and reassign them?'}
            </p>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Assets</h4>
              {selectedAssets.map((assetId) => {
                const asset = assets.find((a) => a._id === assetId);
                return (
                  <div key={asset?._id} className="mt-2">
                    <p className="text-gray-600">
                      <strong>Name:</strong> {asset?.name || 'Unknown'}
                    </p>
                    <p className="text-gray-600">
                      <strong>Asset Tag:</strong> {asset?.asset_tag || 'Unknown'}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Entities</h4>
              {selectedEntities.map((entityId) => {
                const entity = employees.find((e) => e._id === entityId);
                return (
                  <div key={entity?._id} className="mt-2">
                    <p className="text-gray-600">
                      <strong>Name:</strong> {entity ? `${entity.first_name} ${entity.last_name}` : 'Unknown'}
                    </p>
                    <p className="text-gray-600">
                      <strong>ID:</strong> {entity?._id || 'Unknown'}
                    </p>
                    <p className="text-gray-600">
                      <strong>Department:</strong> {entity?.department || 'N/A'}
                    </p>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowConfirmModal(false);
                  setShowEmployeeModal(true); // Go back to employee modal
                }}
              >
                Cancel
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={confirmUnassignment}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-bold text-gray-800">Unassign Assets - {currentCategory.name}</h2>
        <div className="flex gap-3">
          <Link to="/asset-inventory">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Inventory
            </button>
          </Link>
          <button
            className={`${
              selectedAssets.length > 0 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-red-300 cursor-not-allowed'
            } text-white font-medium py-2 px-4 rounded-lg transition-colors`}
            onClick={selectedAssets.length > 0 ? handleUnassignClick : undefined}
            disabled={selectedAssets.length === 0}
          >
            Unassign {selectedAssets.length > 0 ? `Selected (${selectedAssets.length})` : ''}
          </button>
        </div>
      </div>
      
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
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.asset_tag}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{asset.status}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                    onClick={() => handleAssetDirectUnassign(asset._id)}
                  >
                    Unassign
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

export default AssetUnassignmentTable;