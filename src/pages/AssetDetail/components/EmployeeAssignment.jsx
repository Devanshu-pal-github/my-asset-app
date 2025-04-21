import React, { useEffect, useRef, useState } from 'react';
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

const EmployeeAssignment = ({ visible, onHide, categoryId, assetId, onAssignmentSuccess }) => {
  const dispatch = useDispatch();
  const toast = useRef(null);
  const { employees, loading: employeesLoading, error: employeesError } = useSelector((state) => state.employees);
  const { items: assets, loading: assetsLoading, error: assetsError } = useSelector((state) => state.assetItems);
  const { categories, loading: categoriesLoading, error: categoriesError } = useSelector((state) => state.assetCategories);
  const [categoryDetails, setCategoryDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logger.debug('EmployeeAssignment useEffect triggered', { categoryId, assetId });
    const fetchData = async () => {
      try {
        setIsLoading(true);
        await Promise.all([
          dispatch(fetchEmployees()),
          dispatch(fetchAssetItemsByCategory(categoryId)),
          dispatch(fetchAssetCategories()),
          axios.get(`${API_URL}/asset-categories/${categoryId}`).then((response) => {
            setCategoryDetails(response.data);
          }),
        ]);
      } catch (error) {
        logger.error('Failed to fetch initial data', { error: error.message });
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load data',
          life: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    };
    if (visible) {
      fetchData();
    }
  }, [dispatch, categoryId, assetId, visible]);

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
        notes: `Assigned to ${employee.first_name} ${employee.last_name} for ${currentCategory.name}`,
      });
      logger.info('Assignment history created', { assignmentId: assignmentResponse.data.id });

      toast.current.show({
        severity: 'success',
        summary: 'Assignment Successful',
        detail: `Asset ${currentAsset.name} assigned to ${employee.first_name} ${employee.last_name}`,
        life: 3000,
      });

      // Refresh data and notify parent
      await dispatch(fetchAssetItemsByCategory(categoryId));
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
      toast.current.show({
        severity: 'error',
        summary: 'Assignment Failed',
        detail: errorMessage,
        life: 3000,
      });
    }
  };

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

  if (isLoading || employeesLoading || assetsLoading || categoriesLoading || !categoryDetails) {
    return <div>Loading...</div>;
  }

  if (employeesError || assetsError || categoriesError) {
    return <div className="text-red-600">Error: {employeesError || assetsError || categoriesError}</div>;
  }

  if (!currentCategory.name || !currentAsset.name || !employees.length) {
    return (
      <div>
        {(!currentCategory.name && 'Category not found') ||
         (!currentAsset.name && 'Asset not found') ||
         (!employees.length && 'No employees found')}.
      </div>
    );
  }

  return (
    <div>
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
            rowData.assigned_assets?.length ? rowData.assigned_assets.join(', ') : 'None'
          }
        />
        <Column header="Action" body={assignButton} />
      </DataTable>
    </div>
  );
};

export default EmployeeAssignment;