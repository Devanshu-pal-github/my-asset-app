import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import axios from 'axios';
import logger from '../../../utils/logger';
import { createAssignment } from '../../../store/slices/assignmentHistorySlice';
import { fetchAssetItemById } from '../../../store/slices/assetItemSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Utility to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  if (!id) return false;
  
  // Check for standard UUID format (8-4-4-4-12 hex digits)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  
  // Check for prefixed ID format like AST-12345678
  const prefixedIdRegex = /^[A-Z]{3}-[0-9A-Z]{8}$/;
  
  // Check for old MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  return uuidRegex.test(id) || prefixedIdRegex.test(id) || objectIdRegex.test(id);
};

// Retry utility function
const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      logger.error('Retrying API call after failure', { attempt: i + 1, error: error.message }); // Fallback to error if warn is missing
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

const EmployeeAssignment = ({ visible, onHide, categoryId, assetId, onAssignmentSuccess }) => {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const { employees = [], loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
  const { items: assets = [], loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories = [], loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [notification, setNotification] = useState(null);

  const fetchData = useCallback(async () => {
    if (!isValidObjectId(categoryId)) {
      logger.error('Invalid categoryId', { categoryId });
      toast.current?.show({
        severity: 'error',
        summary: 'Invalid Category',
        detail: 'The asset category is invalid. Please contact support.',
        life: 5000,
      });
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all([
        withRetry(() => dispatch(fetchEmployees()).unwrap().catch(() => dispatch(fetchEmployees()).unwrap()), 3, 1000),
        withRetry(() => dispatch(fetchAssetItemsByCategory(categoryId)).unwrap(), 3, 1000),
        withRetry(() => dispatch(fetchAssetCategories()).unwrap(), 3, 1000),
        withRetry(() => axios.get(`${API_URL}/asset-categories/${categoryId}`).then((response) => setCategoryDetails(response.data)), 3, 1000)
          .catch((error) => {
            logger.warn('Failed to fetch category details, continuing without', { error: error.message });
            setCategoryDetails({});
          }),
      ]);
      logger.info('Data fetched successfully', { categoryId, assetId });
    } catch (error) {
      logger.error('Failed to fetch initial data', { error: error.message });
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load data. Please refresh the page.',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, categoryId, assetId]);

  useEffect(() => {
    if (visible) {
      fetchData();
    }
    return () => {
      if (!visible) {
        setCategoryDetails(null);
        logger.debug('EmployeeAssignment cleanup', { categoryId, assetId });
      }
    };
  }, [fetchData, visible]);

  const handleAssign = async () => {
    try {
      if (!selectedEmployee || !assetId) {
        throw new Error('Please select an employee and asset to assign');
      }

      logger.info('Creating new assignment', {
        assetId,
        employeeId: selectedEmployee._id || selectedEmployee.id,
        employeeName: selectedEmployee.name || `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
      });

      // Get category for department
      const categoryDetails = currentCategory || { name: 'Unknown Category' };
      
      // Get full employee name
      const employeeName = selectedEmployee.name || 
        `${selectedEmployee.first_name} ${selectedEmployee.last_name}`;

      // Prepare detailed notes
      const notes = assignmentNotes || 
        `Assigned to ${employeeName} for ${categoryDetails.name}`;
        
      const result = await dispatch(createAssignment({
        assetId,
        employeeId: selectedEmployee._id || selectedEmployee.id,
        assignmentNotes: notes,
        assignmentType: 'PERMANENT',
        startDate: new Date().toISOString(),
        endDate: null,
        department: selectedEmployee.department || currentAsset?.department || 'Unknown',
        condition: currentAsset?.condition || 'Good'
      })).unwrap();
      
      logger.info('Assignment created successfully', {
        assignmentId: result.id,
        employee: employeeName,
        asset: currentAsset?.name || 'Unknown Asset'
      });

      // Show success message
      if (toast.current) {
        toast.current.show({
          severity: 'success',
          summary: 'Assignment Successful',
          detail: `Asset ${currentAsset?.name || 'Unknown Asset'} assigned to ${employeeName}`,
          life: 3000,
        });
      }

      // Refresh asset details
      dispatch(fetchAssetItemById(assetId));

      // Reset form
      setSelectedEmployee(null);
      setAssignmentNotes('');
      
      // Notify parent component of success
      if (onAssignmentSuccess) {
        onAssignmentSuccess();
      }
      
      // Close modal
      onHide();
    } catch (error) {
      logger.error('Failed to assign asset', { 
        error: error.message, 
        assetId, 
        employeeId: selectedEmployee?._id
      });
      
      // Show error message
      if (toast.current) {
        toast.current.show({
          severity: 'error',
          summary: 'Assignment Failed',
          detail: error.message || 'Failed to assign asset to employee',
          life: 3000,
        });
      }
    }
  };

  const currentCategory = categories.find((cat) => cat._id === categoryId || cat.id === categoryId) || {};
  const currentAsset = assets.find((asset) => asset.id === assetId || asset._id === assetId) || {};

  const assignButton = (rowData) => {
    const isAlreadyAssignedToEmployee = rowData.assigned_assets?.includes(assetId);
    const isAssetAssigned = currentAsset.current_assignee_id?.length > 0;
    const allowMultipleAssignments = categoryDetails?.allow_multiple_assignments === 1;
    const canAssign = !isAlreadyAssignedToEmployee && (!isAssetAssigned || allowMultipleAssignments);

    return (
      <Button
        label="Assign"
        className={`p-button-sm ${canAssign ? 'p-button-success' : 'p-button-secondary'}`}
        onClick={() => canAssign && handleAssignClick(rowData)}
        disabled={!canAssign}
      />
    );
  };

  if (!visible) return null;

  if (isLoading || employeesLoading || assetsLoading || categoriesLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (employeesError || assetsError || categoriesError) {
    const errorMessage = employeesError || assetsError || categoriesError;
    logger.error('EmployeeAssignment error', { error: errorMessage });
    return (
      <div className="p-4 text-red-600">
        <span className="flex items-center">
          <i className="pi pi-exclamation-triangle mr-2"></i>
          Error: {errorMessage}
        </span>
        <Button
          label="Retry"
          className="p-button-sm p-button-info mt-2"
          onClick={fetchData}
        />
      </div>
    );
  }

  if (!currentCategory.name && categoryDetails) {
    logger.warn('Category not found', { categoryId });
    return (
      <div className="p-4">
        Category not found. <Button label="Close" className="p-button-sm mt-2" onClick={onHide} />
      </div>
    );
  }

  if (!currentAsset.name) {
    logger.warn('Asset not found', { assetId });
    return (
      <div className="p-4">
        Asset not found. <Button label="Close" className="p-button-sm mt-2" onClick={onHide} />
      </div>
    );
  }

  if (!employees.length) {
    logger.info('No employees found');
    return (
      <div className="p-4">
        No employees available for assignment. Please ensure employees are registered in the system.{' '}
        <Button label="Close" className="p-button-sm mt-2" onClick={onHide} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <h3 className="text-xl font-bold mb-4">Assign Employee to {currentAsset.name}</h3>
      <DataTable
        value={employees}
        className="p-datatable-sm"
        paginator
        rows={10}
        responsiveLayout="scroll"
        filterDisplay="menu"
        filters={{
          employee_id: { value: '', matchMode: 'contains' },
          first_name: { value: '', matchMode: 'contains' },
          last_name: { value: '', matchMode: 'contains' },
          department: { value: '', matchMode: 'contains' },
          job_title: { value: '', matchMode: 'contains' },
        }}
      >
        <Column field="employee_id" header="Employee ID" sortable filter />
        <Column
          field="first_name"
          header="Name"
          body={(rowData) => `${rowData.first_name} ${rowData.last_name}`}
          sortable
          filter
        />
        <Column field="department" header="Department" sortable filter />
        <Column field="job_title" header="Designation" sortable filter />
        <Column
          field="assigned_assets"
          header="Assets Assigned"
          body={(rowData) =>
            Array.isArray(rowData.assigned_assets) && rowData.assigned_assets.length
              ? rowData.assigned_assets.join(', ')
              : 'None'
          }
        />
        <Column header="Action" body={assignButton} />
      </DataTable>
    </div>
  );
};

export default EmployeeAssignment;