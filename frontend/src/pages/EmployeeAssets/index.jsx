import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEmployees } from '../../store/slices/employeeSlice';
import logger from '../../utils/logger';

const EmployeeAssets = () => {
  const dispatch = useDispatch();
  const { employees, loading, error } = useSelector((state) => state.employees);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Fetch employees on component mount
  useEffect(() => {
    logger.debug('EmployeeAssets component mounted');
    dispatch(fetchEmployees())
      .unwrap()
      .then((result) => {
        console.log('Employees fetched successfully:', result);
        logger.info('Employees loaded successfully', { count: result.length });
      })
      .catch((error) => {
        console.error('Error fetching employees:', error);
        logger.error('Failed to load employees', { error });
      });
  }, [dispatch]);

  // Get unique departments from actual employee data
  const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
  
  // Filter employees based on search term and department
  const filteredEmployees = employees.filter(employee => {
    const nameMatch = `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = departmentFilter === '' || employee.department === departmentFilter;
    
    return (nameMatch || idMatch) && deptMatch;
  });

  // Log filtered results for debugging
  console.log('Filtered employees:', filteredEmployees);
  logger.debug('Filtered employees count:', filteredEmployees.length);

  return (
    <div className="p-6 mt-20">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Employee Assets</h1>
          <p className="text-gray-600">Manage and track assets assigned to employees</p>
        </div>
        <Link
          to="/add-employee"
          className="mt-4 md:mt-0 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <i className="pi pi-plus mr-2"></i>
          Add Employee
        </Link>
      </div>

      {/* Search and Filter section */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="pi pi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              placeholder="Search by name or ID..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full md:w-64">
            <select
              className="w-full py-2 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        {loading ? (
          <div className="text-center py-4">Loading employees...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-4">
            Error loading employees: {error}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets Assigned</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.length > 0 ? filteredEmployees.map(employee => (
                  <tr key={employee.id || employee.employee_id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.full_name || `${employee.first_name} ${employee.last_name}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{employee.assigned_assets_count || employee.total_assigned_assets || 0}</span>
                        {employee.total_asset_value > 0 && (
                          <span className="text-sm text-gray-500">
                            (${employee.total_asset_value.toLocaleString()})
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        employee.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
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
                )) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No employees found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAssets;