import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Hardcoded employee data
const mockEmployees = [
  {
    id: 'EMP001',
    first_name: 'John',
    last_name: 'Doe',
    employee_id: 'EMP001',
    department: 'Engineering',
    assigned_assets: ['Laptop', 'Monitor'],
  },
  {
    id: 'EMP002',
    first_name: 'Jane',
    last_name: 'Smith',
    employee_id: 'EMP002',
    department: 'HR',
    assigned_assets: ['Tablet'],
  },
];

const EmployeeAssets = () => {
  // Add state for search and department filter
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Get unique departments for the filter
  const departments = [...new Set(mockEmployees.map(emp => emp.department))];

  // Filter employees based on search term and department
  const filteredEmployees = mockEmployees.filter(employee => {
    const nameMatch = `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = departmentFilter === '' || employee.department === departmentFilter;
    
    return (nameMatch || idMatch) && deptMatch;
  });

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
          {/* Search input */}
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
          
          {/* Department filter */}
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

      {/* Table (keeping existing structure) */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets Assigned</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.length > 0 ? filteredEmployees.map(employee => (
                <tr key={employee.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.first_name} {employee.last_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.employee_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{employee.assigned_assets?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link to={`/employee-profile/${employee.id}`} className="text-blue-600 hover:text-blue-800">View Profile</Link>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No employees found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeAssets;