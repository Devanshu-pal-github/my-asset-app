import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

// Async thunk to fetch all employees
export const fetchEmployees = createAsyncThunk(
  'employees/fetchEmployees',
  async (_, { rejectWithValue }) => {
    try {
      logger.debug('Fetching employees from API');
      const response = await axios.get(`${API_URL}/employees/`);
      logger.info('Successfully fetched employees', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch employees', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch employees');
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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
        logger.debug('Fetch employees pending');
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
        logger.debug('Fetch employees fulfilled', { employeeCount: action.payload.length });
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        logger.error('Fetch employees rejected', { error: action.payload });
      });
  },
});

export default employeeSlice.reducer;