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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Utility to validate MongoDB ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const EmployeeAssignment = ({ visible, onHide, categoryId, assetId, onAssignmentSuccess }) => {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const hasFetched = useRef(false);
  const { employees, loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
  const { items: assets, loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!visible || !isValidObjectId(categoryId)) {
      logger.error('Invalid categoryId or modal not visible', { categoryId, visible });
      setFetchError('The asset category is invalid. Please contact support.');
      toast.current?.show({
        severity: 'error',
        summary: 'Invalid Category',
        detail: 'The asset category is invalid. Please contact support.',
        life: 5000,
      });
      setIsLoading(false);
      return;
    }

    if (hasFetched.current) {
      logger.debug('Data already fetched, skipping fetchData', { categoryId, assetId });
      return;
    }

    try {
      setIsLoading(true);
      setFetchError(null);
      logger.debug('Fetching data for EmployeeAssignment', { categoryId, assetId });
      await Promise.all([
        dispatch(fetchEmployees()).unwrap(),
        dispatch(fetchAssetItemsByCategory(categoryId)).unwrap(),
        dispatch(fetchAssetCategories()).unwrap(),
      ]);
      hasFetched.current = true;
      logger.info('Data fetched successfully', { categoryId, assetId });
    } catch (error) {
      logger.error('Failed to fetch initial data', { error: error.message });
      setFetchError('Failed to load data. Please try again.');
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load data. Please try again.',
        life: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, categoryId, assetId, visible]);

  useEffect(() => {
    logger.debug('EmployeeAssignment useEffect triggered', { categoryId, assetId, visible, hasFetched: hasFetched.current });
    if (visible) {
      fetchData();
    }

    // Reset hasFetched when modal closes
    return () => {
      if (!visible) {
        hasFetched.current = false;
        setFetchError(null);
        logger.debug('EmployeeAssignment cleanup', { categoryId, assetId });
      }
    };
  }, [fetchData, visible]);

  const currentCategory = categories.find((cat) => cat._id === categoryId || cat.id === categoryId) || {};
  const currentAsset = assets.find((asset) => asset.id === assetId) || {};

  const handleAssignClick = async (employee) => {
    logger.info('Assign button clicked', {
      employeeId: employee.id,
      employeeName: `${employee.first_name} ${employee.last_name}`,
      assetId,
    });

    try {
      const assignmentResponse = await axios.post(`${API_URL}/assignment-history/`, {
        asset_id: assetId,
        assigned_to: [employee.id],
        department: employee.department,
        condition: currentAsset.condition || 'Excellent',
        assignment_date: new Date().toISOString(),
        is_active: 1,
        notes: `Assigned to ${employee.first_name} ${employee.last_name} for ${currentCategory.name || 'Unknown Category'}`,
      });
      logger.info('Assignment history created', { assignmentId: assignmentResponse.data.id });

      toast.current?.show({
        severity: 'success',
        summary: 'Assignment Successful',
        detail: `Asset ${currentAsset.name || 'Unknown Asset'} assigned to ${employee.first_name} ${employee.last_name}`,
        life: 3000,
      });

      // Refresh data and notify parent
      await dispatch(fetchAssetItemsByCategory(categoryId)).unwrap();
      onAssignmentSuccess();
      onHide();
    } catch (error) {
      logger.error('Failed to assign asset', {
        error: error.response?.data?.detail || error.message,
        employeeId: employee.id,
        assetId,
      });
      let errorMessage = 'Failed to assign asset';
      if (error.response?.status === 422) {
        errorMessage = error.response.data.detail.map((err) => `${err.loc.join('.')}: ${err.msg}`).join('; ');
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      toast.current?.show({
        severity: 'error',
        summary: 'Assignment Failed',
        detail: errorMessage,
        life: 3000,
      });
    }
  };

  const assignButton = (rowData) => {
    const isAlreadyAssignedToEmployee = Array.isArray(rowData.assigned_assets) && rowData.assigned_assets.includes(assetId);
    const isAssetAssigned = Array.isArray(currentAsset.current_assignee_id) && currentAsset.current_assignee_id.length > 0;
    const allowMultipleAssignments = currentCategory.allow_multiple_assignments === 1;
    const canAssign = !isAlreadyAssignedToEmployee && (!isAssetAssigned || allowMultipleAssignments);

    logger.debug('Assign button conditions', {
      isAlreadyAssignedToEmployee,
      isAssetAssigned,
      allowMultipleAssignments,
      canAssign,
      employeeId: rowData.id,
      assetId,
    });

    return (
      <Button
        label="Assign"
        className={`p-button-sm ${canAssign ? 'p-button-success' : 'p-button-secondary'}`}
        onClick={() => canAssign && handleAssignClick(rowData)}
        disabled={!canAssign}
      />
    );
  };

  // Check if all required data is available
  const isDataReady = (
    !isLoading &&
    !employeesLoading &&
    !assetsLoading &&
    !categoriesLoading &&
    currentCategory.name &&
    currentAsset.name &&
    employees.length > 0
  );

  if (!visible) return null;

  if (fetchError || employeesError || assetsError || categoriesError) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        <div className="text-red-600">
          {fetchError || employeesError || assetsError || categoriesError}
        </div>
      </div>
    );
  }

  if (!isDataReady) {
    return (
      <div className="p-4">
        <Toast ref={toast} />
        {isLoading || employeesLoading || assetsLoading || categoriesLoading
          ? 'Loading...'
          : (!currentCategory.name && 'Category not found') ||
            (!currentAsset.name && 'Asset not found') ||
            (employees.length === 0 && 'No employees found')}
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