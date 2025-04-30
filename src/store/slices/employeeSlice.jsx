import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
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

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      logger.debug(`Fetching employees from API: ${API_URL}/employees/`);
      const response = await withRetry(() => axiosInstance.get(`${API_URL}/employees/`));
      
      // Transform the response to match frontend expectations
      const transformedData = response.data.map(employee => {
        // Split name into first_name and last_name (assuming name is "First Last")
        const [first_name, ...lastNameParts] = employee.name.split(' ');
        const last_name = lastNameParts.join(' ') || '';
        
        return {
          ...employee,
          first_name,
          last_name,
        };
      });

      logger.info('Successfully fetched employees', {
        count: transformedData.length,
        employeeIds: transformedData.map((emp) => emp.employee_id),
      });
      return transformedData;
    } catch (error) {
      logger.error('Failed to fetch employees', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchEmployeeDetails = createAsyncThunk(
  'employees/fetchEmployeeDetails',
  async (id, { rejectWithValue }) => {
    try {
      logger.debug(`Fetching employee details from API: ${API_URL}/employees/${id}/details`);
      const response = await withRetry(() => axiosInstance.get(`${API_URL}/employees/${id}/details`));
      logger.info('Successfully fetched employee details', {
        id,
        employee_id: response.data.employee_id,
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch employee details', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
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
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        logger.error('Fetch employees rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchEmployeeDetails.pending, (state) => {
        logger.debug('Fetch employee details pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDetails.fulfilled, (state, action) => {
        logger.info('Fetch employee details fulfilled', { id: action.payload.id });
        state.loading = false;
        state.employeeDetails = action.payload;
      })
      .addCase(fetchEmployeeDetails.rejected, (state, action) => {
        logger.error('Fetch employee details rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEmployees, clearEmployeeDetails } = employeeSlice.actions;
export default employeeSlice.reducer;