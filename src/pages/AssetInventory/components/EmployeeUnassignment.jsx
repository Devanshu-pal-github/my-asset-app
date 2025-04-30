import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetItemsByCategory, unassignAssetItem } from '../../../store/slices/assetItemSlice';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import logger from '../../../utils/logger';
import { paginate, sortData } from './tableUtils';

const EmployeeUnassignment = () => {
  const { categoryId, assetId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: assets, loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { employees, loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [notification, setNotification] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState('employee_id');
  const [sortOrder, setSortOrder] = useState('asc');
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug('EmployeeUnassignment useEffect triggered', { categoryId, assetId });
    const fetchData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          dispatch(fetchAssetItemsByCategory(categoryId)).unwrap(),
          dispatch(fetchEmployees()).unwrap(),
        ]);
      } catch (err) {
        logger.error('Failed to fetch asset or employees', { error: err.message });
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dispatch, categoryId, assetId]);

  const asset = assets.find((a) => a.id === assetId || a._id === assetId);
  const assignedEmployees = employees.filter((emp) => {
    if (!asset?.current_assignee_id) return false;
    const assigneeIds = Array.isArray(asset.current_assignee_id)
      ? asset.current_assignee_id
      : [asset.current_assignee_id];
    return assigneeIds.includes(emp.id);
  });

  if (asset && !assignedEmployees.length && asset.has_active_assignment) {
    logger.warn('No matching employees found for asset assignment', {
      assetId,
      current_assignee_id: asset.current_assignee_id,
    });
  }

  const handleUnassign = (employee) => {
    logger.info('Unassign button clicked', {
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      assetId,
    });
    setSelectedEmployee(employee);
    setShowConfirmModal(true);
  };

  const confirmUnassignment = async () => {
    if (!selectedEmployee) {
      setShowConfirmModal(false);
      return;
    }

    try {
      logger.info('Unassigning asset', { assetId });
      await dispatch(unassignAssetItem(assetId)).unwrap();
      logger.info('Successfully unassigned asset', { assetId });
      setNotification({
        type: 'success',
        message: `Employee unassigned from ${asset?.name || 'asset'}`,
      });

      await dispatch(fetchAssetItemsByCategory(categoryId)).unwrap();
      navigate(`/asset-inventory/${categoryId}/unassign`);
    } catch (err) {
      logger.error('Failed to unassign asset', { assetId, error: err.message });
      setNotification({
        type: 'error',
        message: err.message || 'Failed to unassign employee',
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

  const sortedEmployees = sortData(assignedEmployees, sortField, sortOrder);
  const paginatedEmployees = paginate(sortedEmployees, currentPage, itemsPerPage);
  const totalPages = Math.ceil(assignedEmployees.length / itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading || assetsLoading || employeesLoading) {
    return <div className="p-6 text-gray-600">Loading...</div>;
  }

  if (error || assetsError || employeesError) {
    const errorMessage = error || assetsError || employeesError;
    logger.error('EmployeeUnassignment error', { error: errorMessage });
    return (
      <div className="p-6 text-red-600">
        {errorMessage}{' '}
        <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-blue-600 underline hover:text-blue-800">
          Back to Unassignment
        </Link>
      </div>
    );
  }

  if (!asset) {
    logger.warn('Asset not found', { assetId });
    return (
      <div className="p-6 text-gray-600">
        Asset not found.{' '}
        <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-blue-600 underline hover:text-blue-800">
          Back to Unassignment
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
            <h3 className="text-lg font-semibold text-gray-800">Confirm Unassignment</h3>
            <p className="text-gray-600 mt-2">
              Are you sure you want to unassign the following employee from this asset?
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
                <strong>Email:</strong> {selectedEmployee?.email || 'N/A'}
              </p>
            </div>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">Asset Details</h4>
              <p className="text-gray-600">
                <strong>Name:</strong> {asset?.name || 'N/A'}
              </p>
              <p className="text-gray-600">
                <strong>Category ID:</strong> {categoryId}
              </p>
              <p className="text-gray-600">
                <strong>Condition:</strong> {asset?.condition || 'Unknown'}
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
                onClick={confirmUnassignment}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Unassign Employees from {asset.name || 'asset'}</h2>
      {assignedEmployees.length === 0 ? (
        <div className="text-gray-600">
          No employees assigned to this asset.{' '}
          <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-blue-600 underline hover:text-blue-800">
            Back to Unassignment
          </Link>
        </div>
      ) : (
        <>
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
                    onClick={() => handleSort('email')}
                  >
                    Email {sortField === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('department')}
                  >
                    Department {sortField === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.email || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{employee.department || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                        onClick={() => handleUnassign(employee)}
                      >
                        Unassign
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
              {Math.min(currentPage * itemsPerPage, assignedEmployees.length)} of {assignedEmployees.length} employees
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
        </>
      )}
      <div className="mt-4">
        <Link to={`/asset-inventory/${categoryId}/unassign`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Back
          </button>
        </Link>
      </div>
    </div>
  );
};

export default EmployeeUnassignment;