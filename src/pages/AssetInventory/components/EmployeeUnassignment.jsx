import React, { useEffect, useState, useRef } from 'react'; // Added useRef import
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import logger from '../../../utils/logger';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const EmployeeUnassignment = () => {
  const { categoryId, assetId } = useParams();
  const navigate = useNavigate();
  const toast = useRef(null);
  const [asset, setAsset] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    logger.debug('EmployeeUnassignment useEffect triggered', { categoryId, assetId });

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

    fetchAssetAndEmployees();
  }, [assetId]);

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

      // Navigate back if no employees remain
      if (updatedEmployees.length === 0) {
        navigate(`/asset-inventory/${categoryId}/unassign`);
      }
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
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    logger.error('EmployeeUnassignment error', { error });
    return (
      <div className="p-6 text-error-red">
        {error}{' '}
        <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-primary-blue underline">
          Back to Unassignment
        </Link>
      </div>
    );
  }

  if (!asset) {
    logger.warn('Asset not found', { assetId });
    return (
      <div className="p-6">
        Asset not found.{' '}
        <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-primary-blue underline">
          Back to Unassignment
        </Link>
      </div>
    );
  }

  return (
    <div className="content-container p-6">
      <Toast ref={toast} />
      <h2 className="text-2xl font-bold mb-4">Unassign Employees from {asset.name}</h2>
      {employees.length === 0 ? (
        <div>
          No employees assigned to this asset.{' '}
          <Link to={`/asset-inventory/${categoryId}/unassign`} className="text-primary-blue underline">
            Back to Unassignment
          </Link>
        </div>
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
      <Link to={`/asset-inventory/${categoryId}/unassign`}>
        <Button
          label="Back"
          className="p-button-sm p-button-secondary mt-4"
        />
      </Link>
    </div>
  );
};

export default EmployeeUnassignment;