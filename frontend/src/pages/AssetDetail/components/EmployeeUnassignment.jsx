import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAssetItemById } from '../../../store/slices/assetItemSlice';
import { unassignAsset } from '../../../store/slices/assignmentHistorySlice';
import logger from '../../../utils/logger';

// Component for unassigning employees from an asset
const EmployeeUnassignment = ({ visible, onHide, assetId, onUnassignmentSuccess }) => {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const [asset, setAsset] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returnNotes, setReturnNotes] = useState('');
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    const fetchAssetAndEmployees = async () => {
      try {
        setLoading(true);
        // Fetch asset details
        const assetData = await dispatch(fetchAssetItemById(assetId)).unwrap();
        setAsset(assetData);
        
        logger.debug('Fetched asset for unassignment', { 
          assetId, 
          assetName: assetData?.name,
          currentAssignmentId: assetData?.current_assignment_id,
          currentAssigneeId: assetData?.current_assignee_id
        });

        // If there's an assigned employee, get their details
        if (assetData?.current_assignee_id) {
          setEmployees([{
            id: assetData.current_assignee_id,
            employee_id: assetData.current_assignee_id,
            first_name: assetData.current_assignee_name ? assetData.current_assignee_name.split(' ')[0] : 'Unknown',
            last_name: assetData.current_assignee_name ? assetData.current_assignee_name.split(' ').slice(1).join(' ') : 'Employee',
            email: 'Unknown',
            department: assetData.department || 'Unknown'
          }]);
        } else {
          setEmployees([]);
        }

        setLoading(false);
      } catch (err) {
        logger.error('Error fetching asset for unassignment', { error: err.message, assetId });
        setError(err.message);
        setLoading(false);
      }
    };

    if (visible) {
      fetchAssetAndEmployees();
    }
  }, [assetId, visible, dispatch]);

  const handleUnassign = async () => {
    try {
      if (!asset?.current_assignment_id) {
        throw new Error('No active assignment found for this asset');
      }

      logger.info('Unassigning asset from employee', {
        assetId: asset.id || asset._id,
        assignmentId: asset.current_assignment_id,
        returnNotes: returnNotes || 'Unassigned via asset management system',
        returnCondition: asset.condition || 'Good'
      });

      const result = await dispatch(unassignAsset({
        assignmentId: asset.current_assignment_id,
        returnNotes: returnNotes || 'Unassigned via asset management system',
        returnDate: new Date().toISOString(),
        returnCondition: asset.condition || 'Good'
      })).unwrap();
      
      logger.info('Unassignment completed successfully', {
        assignmentId: result.assignment_id || asset.current_assignment_id,
        assetId: asset.id || asset._id,
        assetName: asset.name || 'Unknown Asset',
        result
      });

      // Show success message
      if (toast.current) {
        toast.current.show({
          severity: 'success',
          summary: 'Unassignment Successful',
          detail: `Asset ${asset.name || 'Unknown Asset'} has been successfully unassigned`,
          life: 3000,
        });
      }

      // Refresh asset details
      dispatch(fetchAssetItemById(asset.id || asset._id));

      // Reset form
      setReturnNotes('');
      setShowReturnModal(false);
      
      // Notify parent component of success
      if (onUnassignmentSuccess) {
        onUnassignmentSuccess();
      }
      
      // Close modal
      onHide();
    } catch (error) {
      logger.error('Failed to unassign asset', { 
        error: error.message, 
        assetId: asset?.id || asset?._id, 
        assignmentId: asset?.current_assignment_id,
        stack: error.stack
      });
      
      // Show error message
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Unassignment Failed',
          detail: error.message || 'Failed to unassign asset',
          life: 3000,
        });
      }
    }
  };

  const showUnassignModal = (rowData) => {
    setSelectedEmployee(rowData);
    setShowReturnModal(true);
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <Button
        label="Unassign"
        className="p-button-sm p-button-danger"
        onClick={() => showUnassignModal(rowData)}
      />
    );
  };

  const renderReturnModal = () => {
    return (
      <Dialog
        header="Unassign Asset"
        visible={showReturnModal}
        style={{ width: '500px' }}
        modal
        onHide={() => setShowReturnModal(false)}
        footer={
          <div>
            <Button
              label="Cancel"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setShowReturnModal(false)}
            />
            <Button
              label="Unassign"
              icon="pi pi-check"
              className="p-button-danger"
              onClick={handleUnassign}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="p-field">
            <label htmlFor="returnNotes">Return Notes</label>
            <InputTextarea
              id="returnNotes"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              rows={5}
              autoResize
            />
          </div>
        </div>
      </Dialog>
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
      {renderReturnModal()}
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