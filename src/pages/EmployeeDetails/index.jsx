import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import logger from '../../utils/logger';
import { fetchEmployeeDetails } from '../../store/slices/employeeSlice';

const EmployeeDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { employeeDetails, loading, error } = useSelector((state) => state.employees);

  useEffect(() => {
    logger.debug(`Fetching details for employee ID: ${id}`);
    dispatch(fetchEmployeeDetails(id)).catch(err => {
      logger.error(`Failed to fetch employee details for ID: ${id}`, { error: err.message });
    });
  }, [dispatch, id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (!employeeDetails || !employeeDetails.employee) return <div className="p-6">No employee data found</div>;

  const { employee, current_assets, assignment_history, maintenance_history, documents } = employeeDetails;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Employee Details</h1>
        <Link to="/employee-assets" className="text-blue-600 hover:text-blue-800">Back to Employees</Link>
      </div>

      {/* Employee Information */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Employee Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {employee.first_name} {employee.last_name}</p>
            <p><strong>Employee ID:</strong> {employee.employee_id}</p>
            <p><strong>Email:</strong> {employee.email}</p>
            <p><strong>Department:</strong> {employee.department}</p>
          </div>
          <div>
            <p><strong>Job Title:</strong> {employee.job_title || 'N/A'}</p>
            <p><strong>Phone:</strong> {employee.phone || 'N/A'}</p>
            <p><strong>Status:</strong> {employee.is_active ? 'Active' : 'Inactive'}</p>
            <p><strong>Joined:</strong> {new Date(employee.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Current Assets */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Current Assets</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Tag</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned On</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {current_assets.length > 0 ? current_assets.map(asset => (
                <tr key={asset.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{asset.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asset.asset_tag}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asset.category_name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asset.status}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{asset.condition}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {asset.current_assignment_date ? new Date(asset.current_assignment_date).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No assets assigned</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment History */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Assignment History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Return Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {assignment_history.length > 0 ? assignment_history.map(record => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{record.asset_name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.assignment_date ? new Date(record.assignment_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.return_date ? new Date(record.return_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.assignment_type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.is_active ? 'Active' : 'Inactive'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.notes || 'N/A'}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No assignment history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4">Maintenance History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Scheduled</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenance_history.length > 0 ? maintenance_history.map(record => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{record.asset_name || 'Unknown'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.maintenance_date ? new Date(record.maintenance_date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.maintenance_type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.cost ? `$${record.cost.toFixed(2)}` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.performed_by || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{record.next_scheduled_maintenance ? new Date(record.next_scheduled_maintenance).toLocaleDateString() : 'N/A'}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No maintenance history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Documents</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Related To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.length > 0 ? documents.map(doc => (
                <tr key={doc.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.document_name || 'Unnamed'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.document_type || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.asset_name || (doc.employee_id ? 'Employee' : 'N/A')}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {doc.document_url ? (
                      <a href={doc.document_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">View</a>
                    ) : (
                      <span className="text-gray-500">No URL</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No documents found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;