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
  { _id: 'emp2', first_name: 'Jane', last_name: 'Smith', department: 'Marketing', assigned_assets: [] },
  { _id: 'emp3', first_name: 'Bob', last_name: 'Johnson', department: 'Sales', assigned_assets: [] },
  { _id: 'emp4', first_name: 'Alice', last_name: 'Williams', department: 'Engineering', assigned_assets: [] },
  { _id: 'emp5', first_name: 'Charlie', last_name: 'Brown', department: 'Finance', assigned_assets: [] },
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
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [selectedEntities, setSelectedEntities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
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

  // Apply search filter to assets
  const searchFilteredAssets = searchTerm 
    ? filteredAssets.filter(asset => 
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()))
    : filteredAssets;

  // Apply search filter to employees
  const filteredEmployees = employeeSearchTerm 
    ? mockEmployees.filter(employee => 
        `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        employee._id.toLowerCase().includes(employeeSearchTerm.toLowerCase()))
    : mockEmployees;

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
      const entitiesToUse = selectedEntities.length > 0 
        ? selectedEntities 
        : targetEmployeeId ? [targetEmployeeId] : [];
      
      logger.info('Assigning assets', { assets: selectedAssets, entities: entitiesToUse });
      
      // Get entity names for notification
      const entityNames = entitiesToUse.map(id => {
        const entity = mockEmployees.find(e => e._id === id);
        return entity ? `${entity.first_name} ${entity.last_name}` : 'Unknown';
      }).join(', ');
      
      setNotification({
        type: 'success',
        message: `Asset(s) assigned to ${entityNames}`,
      });

      setTimeout(() => {
        navigate('/asset-inventory');
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Assignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to assign the selected asset(s) to the selected entity/entities?
            </p>
            
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Selected Assets</h4>
              {selectedAssets.map((assetId) => {
                const asset = mockAssets.find((a) => a._id === assetId);
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
              {(selectedEntities.length > 0 ? selectedEntities : targetEmployeeId ? [targetEmployeeId] : []).map((entityId) => {
                const entity = mockEmployees.find((e) => e._id === entityId);
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
                  setShowEmployeeModal(true);
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
                  const asset = mockAssets.find((a) => a._id === assetId);
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
                    {filteredEmployees.map((employee) => (
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
              {filteredEmployees.length === 0 && (
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