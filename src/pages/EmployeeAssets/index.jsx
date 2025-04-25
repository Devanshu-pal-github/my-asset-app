import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import logger from '../../utils/logger';
import { Link } from 'react-router-dom';

const EmployeeAssets = () => {
  const dispatch = useDispatch();
  const { employees, loading, error } = useSelector((state) => state.employees);

  useEffect(() => {
    logger.debug('Fetching employees data');
    dispatch(fetchEmployees());
  }, [dispatch]);

  // Calculate metrics for info cards
  const totalEmployees = employees.length;
  const employeesWithAssets = employees.filter(emp => emp.assigned_assets && emp.assigned_assets.length > 0).length;
  const totalAssetsAssigned = employees.reduce((sum, emp) => sum + (emp.assigned_assets ? emp.assigned_assets.length : 0), 0);
  const activeDepartments = [...new Set(employees.map(emp => emp.department))].length;

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Employee Assets</h1>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Total Employees</h3>
          <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Employees with Assets</h3>
          <p className="text-2xl font-bold text-gray-900">{employeesWithAssets}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Total Assets Assigned</h3>
          <p className="text-2xl font-bold text-gray-900">{totalAssetsAssigned}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h3 className="text-sm font-medium text-gray-500">Active Departments</h3>
          <p className="text-2xl font-bold text-gray-900">{activeDepartments}</p>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assets Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.first_name} {employee.last_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.employee_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {employee.assigned_assets && employee.assigned_assets.length > 0 
                    ? employee.assigned_assets
                        .map(asset => asset.name || 'Unknown Asset')
                        .filter(name => name !== 'Unknown Asset') // Filter out invalid entries
                        .join(', ') || 'None'
                    : 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/employee-profile/${employee.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeAssets;