import React, { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import axios from 'axios';
import logger from '../../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const EmployeeUnassignment = ({ visible, onHide, assetId, onUnassignmentSuccess }) => {
  const toast = useRef(null);
  const [asset, setAsset] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    logger.debug('EmployeeUnassignment useEffect triggered', { assetId });

    const fetchAssetAndEmployees = async () => {
      try {
        setLoading(true);
        logger.info('Fetching asset details', { assetId });
        const assetResponse = await axios.get(`${API_URL}/asset-items/${assetId}`);
        const assetData = assetResponse.data;
        setAsset(assetData);

        // Fetch employees assigned to the asset
        const employeePromises = assetData.current_assignee_id?.map(async (empId) => {
          const empResponse = await axios.get(`${API_URL}/employees/${empId}`);
          return empResponse.data;
        }) || [];
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

    if (visible) {
      fetchAssetAndEmployees();
    }
  }, [assetId, visible]);

  const handleUnassign = async (employeeId) => {
    try {
      logger.info('Unassigning employee', { assetId, employeeId });
      await axios.post(`${API_URL}/assignment-history/unassign`, null, {
        params: { asset_id: assetId, employee_id: employeeId },
      });
      logger.info('Successfully unassigned employee', { assetId, employeeId });
      toast.current.show({
        severity: 'success',
        summary: 'Unassignment Successful',
        detail: `Employee unassigned from ${asset?.name || 'asset'}`,
        life: 3000,
      });

      // Refresh employees list
      const updatedEmployees = employees.filter((emp) => emp.id !== employeeId);
      setEmployees(updatedEmployees);
      onUnassignmentSuccess();
    } catch (err) {
      logger.error('Failed to unassign employee', { assetId, employeeId, error: err.message });
      const errorMessage = err.response?.data?.detail || 'Failed to unassign employee';
      setError(errorMessage);
      toast.current.show({
        severity: 'error',
        summary: 'Unassignment Failed',
        detail: errorMessage,
        life: 3000,
      });
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
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!asset) {
    return <div>Asset not found.</div>;
  }

  return (
    <div>
      <Toast ref={toast} />
      <h3 className="text-xl font-bold mb-4">Unassign Employees from {asset.name}</h3>
      {employees.length === 0 ? (
        <div>No employees assigned to this asset.</div>
      ) : (
        <DataTable
          value={employees}
          dataKey="id"
          className="p-datatable-sm"
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
    </div>
  );
};

export default EmployeeUnassignment;