import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    logger.debug('EmployeeUnassignment useEffect triggered', { categoryId, assetId });

    const fetchAssetAndEmployees = async () => {
      try {
        setLoading(true);
        logger.info('Fetching asset details', { assetId });
        const assetResponse = await axios.get(`${API_URL}/asset-items/${assetId}`);
        const assetData = assetResponse.data;
        setAsset(assetData);

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

  const handleUnassign = (employee) => {
    logger.info('Unassign button clicked', {
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      assetId,
    });
    setSelectedEmployee(employee);
    setShowConfirmDialog(true);
  };

  const confirmUnassignment = async () => {
    if (!selectedEmployee) {
      setShowConfirmDialog(false);
      return;
    }

    try {
      logger.info('Unassigning employee', { assetId, employeeId: selectedEmployee.id });
      await axios.post(`${API_URL}/assignment-history/unassign`, null, {
        params: { asset_id: assetId, employee_id: selectedEmployee.id },
      });
      logger.info('Successfully unassigned employee', { assetId, employeeId: selectedEmployee.id });
      toast.current.show({
        severity: 'success',
        summary: 'Unassignment Successful',
        detail: `Employee unassigned from ${asset?.name || 'asset'}`,
        life: 3000,
      });

      const updatedEmployees = employees.filter((emp) => emp.id !== selectedEmployee.id);
      setEmployees(updatedEmployees);

      if (updatedEmployees.length === 0) {
        navigate(`/asset-inventory/${categoryId}/unassign`);
      }
    } catch (err) {
      logger.error('Failed to unassign employee', { assetId, employeeId: selectedEmployee.id, error: err.message });
      const errorMessage = err.response?.data?.detail || 'Failed to unassign employee';
      setError(errorMessage);
      toast.current.show({
        severity: 'error',
        summary: 'Unassignment Failed',
        detail: errorMessage,
        life: 3000,
      });
    } finally {
      setShowConfirmDialog(false);
      setSelectedEmployee(null);
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        label="Unassign"
        className="p-button-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
        onClick={() => handleUnassign(rowData)}
      />
    );
  };

  const dialogFooter = (
    <div className="flex justify-end gap-2">
      <Button
        label="Cancel"
        className="p-button-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-1 px-3 rounded-lg transition-colors"
        onClick={() => {
          setShowConfirmDialog(false);
          setSelectedEmployee(null);
        }}
      />
      <Button
        label="Confirm"
        className="p-button-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
        onClick={confirmUnassignment}
      />
    </div>
  );

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
    <div className="content-container mt-24 p-6">
      <Toast ref={toast} />
      <Dialog
        header="Confirm Unassignment"
        visible={showConfirmDialog}
        style={{ width: '30rem' }}
        footer={dialogFooter}
        onHide={() => {
          setShowConfirmDialog(false);
          setSelectedEmployee(null);
        }}
        className="rounded-lg"
      >
        <div className="p-4">
          <p className="text-gray-800 mb-4">
            Are you sure you want to unassign the following employee from this asset?
          </p>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Employee Details</h3>
            <p className="text-gray-600">
              <strong>Name:</strong> {selectedEmployee?.first_name} {selectedEmployee?.last_name}
            </p>
            <p className="text-gray-600">
              <strong>Employee ID:</strong> {selectedEmployee?.employee_id}
            </p>
            <p className="text-gray-600">
              <strong>Department:</strong> {selectedEmployee?.department || 'N/A'}
            </p>
            <p className="text-gray-600">
              <strong>Email:</strong> {selectedEmployee?.email || 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Asset Details</h3>
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
        </div>
      </Dialog>
      <h2 className="text-2xl font-bold mb-4">Unassign Employees from {asset.name || 'asset'}</h2>
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
          className="p-button-sm bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors mt-4"
        />
      </Link>
    </div>
  );
};

export default EmployeeUnassignment;