import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { fetchAssetItemsByCategory, assignAssetItem } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import logger from '../../../utils/logger';
import { paginate, sortData, filterData } from './tableUtils';

const EmployeeAssignment = () => {
  const dispatch = useDispatch();
  const { categoryId, assetId } = useParams();
  const { employees = [], loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
  const { items: assets = [], loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories = [], loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('employee_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('EmployeeAssignment useEffect triggered', { categoryId, assetId });
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

  logger.debug('Rendering EmployeeAssignment', {
    employees,
    employeesLoading,
    employeesError,
    assets,
    assetsLoading,
    assetsError,
    categories,
    categoriesLoading,
    categoriesError,
  });

  const currentCategory = categories.find((cat) => cat._id === categoryId || cat.id === categoryId) || {};
  const currentAsset = assets.find((asset) => asset.id === assetId || asset._id === assetId) || {};

  const handleAssignClick = (employee) => {
    logger.info('Assign button clicked', {
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      assetId,
    });
    setSelectedEmployee(employee);
    setShowConfirmModal(true);
  };

  const confirmAssignment = async () => {
    if (!selectedEmployee) {
      setShowConfirmModal(false);
      return;
    }

    try {
      await dispatch(
        assignAssetItem({
          assetId,
          employeeId: selectedEmployee.id,
          department: selectedEmployee.department || null,
        })
      ).unwrap();

      setNotification({
        type: 'success',
        message: `Asset ${currentAsset.name || 'asset'} assigned to ${selectedEmployee.first_name} ${selectedEmployee.last_name}`,
      });

      dispatch(fetchAssetItemsByCategory(categoryId));
      dispatch(fetchEmployees());
    } catch (error) {
      logger.error('Failed to assign asset', {
        error: error.message,
        employeeId: selectedEmployee.id,
        assetId,
      });
      setNotification({
        type: 'error',
        message: error.message || 'Failed to assign asset',
      });
    } finally {
      setShowConfirmModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const filteredEmployees = filterData(employees, globalFilter, ['employee_id', 'first_name', 'last_name', 'department', 'role']);
  const sortedEmployees = sortData(filteredEmployees, sortField, sortOrder);
  const paginatedEmployees = paginate(sortedEmployees, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const assignButton = (employee) => {
    const isAlreadyAssignedToEmployee = employee.assigned_assets?.some((asset) => asset.asset_id === assetId);
    const isAssetAssigned = currentAsset.has_active_assignment;
    const allowMultipleAssignments = currentCategory.allow_multiple_assignments === 1;
    const canAssign = !isAlreadyAssignedToEmployee && (!isAssetAssigned || allowMultipleAssignments);

    return (
      <button
        className={`px-4 py-2 rounded text-white ${
          canAssign ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
        onClick={() => canAssign && handleAssignClick(employee)}
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

  if (!currentAsset.name) {
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

  if (!employees.length) {
    logger.info('No employees found');
    return (
      <div className="p-6 text-gray-600">
        No employees available for assignment. Please ensure employees are registered in the system.{' '}
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
          <button
            className="ml-4 text-white"
            onClick={() => setNotification(null)}
          >
            ✕
          </button>
        </div>
      )}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800">Confirm Assignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to assign the following asset to this employee?
            </p>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Employee Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {selectedEmployee?.first_name || 'N/A'} {selectedEmployee?.last_name || ''}
              </p>
              <p className="text-gray-600">
                <strong>Employee ID:</strong> {selectedEmployee?.employee_id || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Department:</strong> {selectedEmployee?.department || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Designation:</strong> {selectedEmployee?.role || 'N/A'}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Asset Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {currentAsset.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Category:</strong> {currentCategory.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Condition:</strong> {currentAsset.condition || 'Excellent'}
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEmployee(null);
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
          <h2 className="text-2xl font-bold text-gray-800">Assign Employee to Asset</h2>
          <span className="text-gray-600 text-sm">
            Assign an employee to {currentAsset.name || 'asset'} ({currentCategory.name || 'category'})
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search employees..."
            className="p-2 border border-gray-300 rounded-lg text-gray-700"
          />
          <Link to={`/asset-inventory/${categoryId}/assign`}>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              Back to Asset Assignment
            </button>
          </Link>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('employee_id')}
              >
                Employee ID {sortField === 'employee_id' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('first_name')}
              >
                Name {sortField === 'first_name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('department')}
              >
                Department {sortField === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('role')}
              >
                Designation {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assets Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedEmployees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.employee_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{`${employee.first_name} ${employee.last_name}`}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.role || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee.assigned_assets?.length
                    ? employee.assigned_assets.map((asset) => asset.asset_id).join(', ')
                    : 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{assignButton(employee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
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