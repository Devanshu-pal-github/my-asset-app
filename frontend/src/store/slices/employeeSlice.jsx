import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const axiosInstance = axios.create({ timeout: 30000 });

const withRetry = async (fn, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      logger.warn('Retrying API call after failure', { attempt: i + 1, error: error.message });
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
};

// Helper function to normalize employee data from backend
const normalizeEmployee = (employee) => {
  // Log raw employee data
  console.log('Raw employee data from backend:', employee);
  logger.debug('Raw employee data fields:', Object.keys(employee));
  logger.debug('Employee metadata fields:', Object.keys(employee.metadata || {}));
  logger.debug('Employee contact fields:', Object.keys(employee.contact || {}));

  // Handle assigned_assets - ensure it's an array and get the count
  const assignedAssets = Array.isArray(employee.assigned_assets) ? employee.assigned_assets : [];
  const assignedAssetsCount = employee.total_assigned_assets || assignedAssets.length || 0;
  console.log('Processing assigned assets:', assignedAssets);
  console.log('Assigned assets count:', assignedAssetsCount);

  const normalized = {
    // Core fields
    id: employee.id,
    employee_id: employee.employee_id,
    first_name: employee.first_name,
    last_name: employee.last_name,
    full_name: employee.full_name || `${employee.first_name} ${employee.last_name}`,
    department: employee.department,
    status: employee.status,

    // Contact Information
    contact: {
      email: employee.contact?.email,
      personal_email: employee.contact?.personal_email,
      phone: employee.contact?.phone,
      mobile: employee.contact?.mobile,
      emergency_contact_name: employee.contact?.emergency_contact_name,
      emergency_contact_phone: employee.contact?.emergency_contact_phone,
      address: employee.contact?.address,
      city: employee.contact?.city,
      state: employee.contact?.state,
      postal_code: employee.contact?.postal_code,
      country: employee.contact?.country,
    },

    // Metadata
    metadata: {
      joining_date: employee.metadata?.joining_date,
      last_working_date: employee.metadata?.last_working_date,
      manager_id: employee.metadata?.manager_id,
      manager_name: employee.metadata?.manager_name,
      location: employee.metadata?.location,
      workstation_id: employee.metadata?.workstation_id,
      skills: employee.metadata?.skills || [],
      certifications: employee.metadata?.certifications || [],
      notes: employee.metadata?.notes,
      employee_type: employee.metadata?.employee_type,
      probation_end_date: employee.metadata?.probation_end_date,
      reporting_to: employee.metadata?.reporting_to,
      job_title: employee.metadata?.job_title,
      role: employee.metadata?.role,
      team: employee.metadata?.team,
      hire_date: employee.metadata?.hire_date,
      designation: employee.metadata?.designation,
      created_at: employee.metadata?.created_at,
    },

    // Asset Assignment Information - ensure proper type handling
    assigned_assets: assignedAssets, // Store the actual array
    assigned_assets_details: assignedAssets, // Store the actual array in a different field
    total_assigned_assets: assignedAssetsCount,
    total_asset_value: typeof employee.total_asset_value === 'number' ? employee.total_asset_value : 0,

    // Frontend component fields
    name: employee.name || employee.full_name || `${employee.first_name} ${employee.last_name}`,
    email: employee.contact?.email,
    phone: employee.contact?.phone,
    role: employee.metadata?.role,
    position: employee.position,
    hire_date: employee.hire_date || employee.metadata?.hire_date,
    designation: employee.designation || employee.metadata?.designation,
    department_id: employee.department_id,
    manager: employee.metadata?.manager_name,
    asset_count: assignedAssetsCount,
    job_title: employee.job_title || employee.metadata?.job_title,
    is_manager: employee.is_manager || false,

    // Additional fields
    employee_type: employee.employee_type || employee.metadata?.employee_type,
    location: employee.location || employee.metadata?.location,
    avatar_url: employee.avatar_url,
    created_at: employee.created_at,
    updated_at: employee.updated_at,

    // Assignment related fields - ensure proper type handling
    asset_assignments: Array.isArray(employee.asset_assignments) ? employee.asset_assignments : [],
    assignment_history: Array.isArray(employee.assignment_history) ? employee.assignment_history : [],
    allow_multiple_assignments: employee.allow_multiple_assignments || false,
    current_assignee_id: Array.isArray(employee.current_assignee_id) ? employee.current_assignee_id : [],

    // Status fields
    is_active: employee.is_active !== undefined ? employee.is_active : true,
    current_assets: Array.isArray(employee.current_assets) ? employee.current_assets : [],
    assigned_assets_count: assignedAssetsCount,
  };

  // Log normalized data
  console.log('Normalized employee data:', normalized);
  logger.debug('Normalized employee fields:', Object.keys(normalized));
  logger.debug('Asset assignments count:', normalized.asset_assignments.length);
  logger.debug('Current assets count:', normalized.current_assets.length);

  return normalized;
};

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (filters = {}, { rejectWithValue }) => {
    try {
      logger.debug('Fetching employees from API', { filters });
      console.log('Fetching employees with filters:', filters);

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filters.department) queryParams.append('department', filters.department);
      if (filters.role) queryParams.append('role', filters.role);
      if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active);

      const url = `${API_URL}/employees/${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      logger.debug('Sending GET request to:', { url });

      const response = await withRetry(() => axiosInstance.get(url));

      // Log raw response
      console.log('Raw employees response from API:', response.data);
      logger.info('Successfully fetched employees', { 
        count: response.data.length,
        fields: response.data.length > 0 ? Object.keys(response.data[0]) : []
      });

      // Normalize and log each employee
      const normalizedEmployees = response.data.map(employee => {
        console.log(`Processing employee ${employee.employee_id || employee.id}:`, employee);
        const normalized = normalizeEmployee(employee);
        console.log('Normalized employee result:', normalized);
        return normalized;
      });

      // Log final result
      console.log('Final normalized employees array:', normalizedEmployees);
      logger.debug('Normalized employees count:', normalizedEmployees.length);

      return normalizedEmployees;
    } catch (error) {
      logger.error('Failed to fetch employees', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error('Error fetching employees:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchEmployeeDetails = createAsyncThunk(
  'employees/fetchEmployeeDetails',
  async (id, { rejectWithValue }) => {
    try {
      logger.debug('Fetching employee details from API', { id });
      console.log('Fetching employee details for ID:', id);

      const response = await withRetry(() => axiosInstance.get(`${API_URL}/employees/${id}/details`));

      // Log raw response
      console.log('Raw employee details response from API:', response.data);
      logger.info('Successfully fetched employee details', {
        id,
        name: response.data.employee?.full_name || response.data.employee?.name,
        fields: Object.keys(response.data)
      });

      // Log employee data before normalization
      console.log('Employee data before normalization:', response.data.employee);
      
      // Normalize the employee data
      const normalizedEmployee = normalizeEmployee(response.data.employee);
      console.log('Normalized employee details:', normalizedEmployee);

      // Log related data
      console.log('Current assets:', response.data.current_assets);
      console.log('Assignment history:', response.data.assignment_history);
      console.log('Maintenance history:', response.data.maintenance_history);
      console.log('Documents:', response.data.documents);

      // Return full response with normalized employee
      const result = {
        employee: normalizedEmployee,
        current_assets: response.data.current_assets || [],
        assignment_history: response.data.assignment_history || [],
        maintenance_history: response.data.maintenance_history || [],
        documents: response.data.documents || [],
      };

      console.log('Final employee details response:', result);
      return result;
    } catch (error) {
      logger.error('Failed to fetch employee details', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        id
      });
      console.error('Error fetching employee details:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    employeeDetails: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearEmployees: (state) => {
      logger.debug('Clearing employees state');
      state.employees = [];
      state.error = null;
    },
    clearEmployeeDetails: (state) => {
      logger.debug('Clearing employee details state');
      state.employeeDetails = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        logger.debug('Fetch employees pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        logger.info('Fetch employees fulfilled', { count: action.payload.length });
        console.log('Employees loaded:', action.payload.length);
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        logger.error('Fetch employees rejected', { error: action.payload });
        console.error('Failed to load employees:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployeeDetails.pending, (state) => {
        logger.debug('Fetch employee details pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDetails.fulfilled, (state, action) => {
        logger.info('Fetch employee details fulfilled', {
          id: action.payload.employee.id,
          name: action.payload.employee.full_name
        });
        console.log('Employee details loaded:', action.payload);
        state.loading = false;
        state.employeeDetails = action.payload;
      })
      .addCase(fetchEmployeeDetails.rejected, (state, action) => {
        logger.error('Fetch employee details rejected', { error: action.payload });
        console.error('Failed to load employee details:', action.payload);
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEmployees, clearEmployeeDetails } = employeeSlice.actions;
export default employeeSlice.reducer;