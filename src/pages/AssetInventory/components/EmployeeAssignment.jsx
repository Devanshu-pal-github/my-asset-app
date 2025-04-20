import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { fetchEmployees } from '../../../store/slices/employeeSlice';
import { fetchAssetItemsByCategory } from '../../../store/slices/assetItemSlice';
import { fetchAssetCategories } from '../../../store/slices/assetCategorySlice';
import axios from 'axios';
import logger from '../../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const EmployeeAssignment = () => {
  const dispatch = useDispatch();
  const { categoryId, assetId } = useParams();
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
    fetchData();
  }, [dispatch, categoryId, assetId]);

  logger.debug('Rendering EmployeeAssignment', {
    employees,
    employeesLoading,
    employeesError,
    assets,
    assetsLoading,
    assetsError,
    categories,
    categoriesLoading,
    categoriesError,
    categoryDetails,
  });

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

      dispatch(fetchAssetItemsByCategory(categoryId));
      dispatch(fetchEmployees());
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
      <button
        className={`px-4 py-2 rounded text-white ${
          canAssign ? 'bg-primary-blue hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'
        }`}
        onClick={() => canAssign && handleAssignClick(rowData)}
        disabled={!canAssign}
      >
        Assign
      </button>
    );
  };

  if (isLoading || employeesLoading || assetsLoading || categoriesLoading || !categoryDetails) {
    return <div className="p-6">Loading...</div>;
  }

  if (employeesError || assetsError || categoriesError) {
    const errorMessage = employeesError || assetsError || categoriesError;
    logger.error('EmployeeAssignment error', { error: errorMessage });
    return (
      <div className="p-6 text-red-600">
        <span className="flex items-center">
          <i className="pi pi-exclamation-triangle mr-2"></i>
          Error: {errorMessage}
        </span>
      </div>
    );
  }

  if (!currentCategory.name) {
    logger.warn('Category not found', { categoryId });
    return (
      <div className="p-6">
        Category not found.{' '}
        <Link to="/asset-inventory" className="text-primary-blue underline">
          Back to Inventory
        </Link>
      </div>
    );
  }

  if (!currentAsset.name) {
    logger.warn('Asset not found', { assetId });
    return (
      <div className="p-6">
        Asset not found.{' '}
        <Link to={`/asset-inventory/${categoryId}/assign`} className="text-primary-blue underline">
          Back to Asset Assignment
        </Link>
      </div>
    );
  }

  if (!employees.length) {
    logger.info('No employees found');
    return (
      <div className="p-6">
        No employees found.{' '}
        <Link to={`/asset-inventory/${categoryId}/assign`} className="text-primary-blue underline">
          Back to Asset Assignment
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 p-5">
      <Toast ref={toast} />
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Assign Employee to Asset</h2>
          <span className="text-gray-600 text-sm">
            Assign an employee to {currentAsset.name} ({currentCategory.name})
          </span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search employees..."
            className="p-2 border border-border-gray rounded-xl text-text-light"
          />
          <Link to={`/asset-inventory/${categoryId}/assign`}>
            <button className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
              Back to Asset Assignment
            </button>
          </Link>
        </div>
      </div>
      <DataTable
        value={employees}
        className="employee-table"
        paginator
        rows={10}
        tableStyle={{ minWidth: '50rem' }}
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