import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const axiosInstance = axios.create({ timeout: 30000 });

// Ensure logger has warn method, fallback to error if missing
const safeLogger = {
  ...logger,
  warn: logger.warn || ((message, context) => logger.error(`[WARN] ${message}`, context)),
};

export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      safeLogger.debug('Fetching employees from API');
      const response = await axiosInstance.get(`${API_URL}/employees/`);
      safeLogger.info('Successfully fetched employees', { count: response.data.length });
      return response.data;
    } catch (error) {
      safeLogger.error('Failed to fetch employees', { error: error.message });
      return rejectWithValue(error.message);
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    employees: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearEmployees: (state) => {
      state.employees = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearEmployees } = employeeSlice.actions;
export default employeeSlice.reducer;