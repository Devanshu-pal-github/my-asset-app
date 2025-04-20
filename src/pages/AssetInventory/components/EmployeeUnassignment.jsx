import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import logger from '../../../utils/logger';
import axios from 'axios';

const EmployeeUnassignment = () => {
  const { categoryId, assetId } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    logger.debug('EmployeeUnassignment useEffect triggered', { categoryId, assetId });

    const fetchAssetAndEmployees = async () => {
      try {
        setLoading(true);
        // Fetch asset details
        logger.info('Fetching asset details', { assetId });
        const assetResponse = await axios.get(`http://localhost:8000/api/v1/asset-items/${assetId}`);
        const assetData = assetResponse.data;
        setAsset(assetData);

        // Fetch employees (filter by current_assignee_id)
        const employeePromises = assetData.current_assignee_id.map(async (empId) => {
          const empResponse = await axios.get(`http://localhost:8000/api/v1/employees/${empId}`);
          return empResponse.data;
        });
        const employeeData = await Promise.all(employeePromises);
        logger.info('Fetched employees', { employeeData });
        setEmployees(employeeData);
      } catch (err) {
        logger.error('Failed to fetch asset or employees', { error: err.message });
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssetAndEmployees();
  }, [assetId]);

  const handleUnassign = async (employeeId) => {
    try {
      logger.info('Unassigning employee', { assetId, employeeId });
      await axios.post(`http://localhost:8000/api/v1/assignment-history/unassign`, null, {
        params: { asset_id: assetId, employee_id: employeeId }
      });
      logger.info('Successfully unassigned employee', { assetId, employeeId });
      // Refresh employees list
      const updatedEmployees = employees.filter(emp => emp.id !== employeeId);
      setEmployees(updatedEmployees);
      if (updatedEmployees.length === 0) {
        navigate(`/asset-inventory/${categoryId}/unassign`);
      }
    } catch (err) {
      logger.error('Failed to unassign employee', { assetId, employeeId, error: err.message });
      setError('Failed to unassign employee. Please try again.');
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        label="Unassign"
        className="p-button-sm p-button-danger"
        onClick={() => handleUnassign(rowData.id)}
      />
    );
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-error-red">{error}</div>;
  }

  if (!asset) {
    return <div className="p-6">Asset not found</div>;
  }

  return (
    <div className="content-container p-6">
      <h2 className="text-2xl font-bold mb-4">Unassign Employees from {asset.name}</h2>
      {employees.length === 0 ? (
        <div>No employees assigned to this asset</div>
      ) : (
        <DataTable
          value={employees}
          dataKey="id"
          className="p-datatable-gridlines"
          responsiveLayout="scroll"
        >
          <Column field="employee_id" header="Employee ID" sortable />
          <Column
            field="first_name"
            header="Name"
            body={(rowData) => `${rowData.first_name} ${rowData.last_name}`}
            sortable
          />
          <Column field="email" header="Email" sortable />
          <Column field="department" header="Department" sortable />
          <Column header="Action" body={actionBodyTemplate} />
        </DataTable>
      )}
      <Button
        label="Back"
        className="p-button-sm p-button-secondary mt-4"
        onClick={() => navigate(`/asset-inventory/${categoryId}/unassign`)}
      />
    </div>
  );
};

export default EmployeeUnassignment;