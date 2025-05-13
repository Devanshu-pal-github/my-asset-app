import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const BASE_URL = '/api/v1/analytics';

// Async thunks for API calls
export const fetchAssetStatistics = createAsyncThunk(
  'analytics/fetchAssetStatistics',
  async (params, { rejectWithValue }) => {
    try {
      const { timeFrame = 'year', page = 1, limit = 1000 } = params;
      const response = await axios.get(`${BASE_URL}/assets`, {
        params: { time_frame: timeFrame, page, limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch asset statistics', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch asset statistics');
    }
  }
);

export const fetchDepartmentStatistics = createAsyncThunk(
  'analytics/fetchDepartmentStatistics',
  async (params, { rejectWithValue }) => {
    try {
      const { timeFrame = 'year', page = 1, limit = 1000 } = params;
      const response = await axios.get(`${BASE_URL}/departments`, {
        params: { time_frame: timeFrame, page, limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch department statistics', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch department statistics');
    }
  }
);

export const fetchMaintenanceStatistics = createAsyncThunk(
  'analytics/fetchMaintenanceStatistics',
  async (params, { rejectWithValue }) => {
    try {
      const { timeFrame = 'year', page = 1, limit = 1000 } = params;
      const response = await axios.get(`${BASE_URL}/maintenance`, {
        params: { time_frame: timeFrame, page, limit }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch maintenance statistics', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch maintenance statistics');
    }
  }
);

export const fetchEmployeeAssetStatistics = createAsyncThunk(
  'analytics/fetchEmployeeAssetStatistics',
  async (params, { rejectWithValue }) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'value', 
        sortOrder = 'desc' 
      } = params;
      
      const response = await axios.get(`${BASE_URL}/employees`, {
        params: { 
          page, 
          limit, 
          sort_by: sortBy, 
          sort_order: sortOrder 
        }
      });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch employee asset statistics', error);
      return rejectWithValue(error.response?.data || 'Failed to fetch employee asset statistics');
    }
  }
);

export const generateReport = createAsyncThunk(
  'analytics/generateReport',
  async (params, { rejectWithValue }) => {
    try {
      const { reportType, timeFrame = 'year', format = 'csv' } = params;
      const response = await axios.get(`${BASE_URL}/reports/${reportType}`, {
        params: { time_frame: timeFrame, format },
        responseType: 'blob'  // Important for file downloads
      });
      
      // Create a download link for the report
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true, reportType };
    } catch (error) {
      logger.error('Failed to generate report', error);
      return rejectWithValue(error.response?.data || 'Failed to generate report');
    }
  }
);

// Initial state
const initialState = {
  assetStats: {
    data: null,
    loading: false,
    error: null
  },
  departmentStats: {
    data: null,
    loading: false,
    error: null
  },
  maintenanceStats: {
    data: null,
    loading: false,
    error: null
  },
  employeeAssetStats: {
    data: null,
    pagination: {
      page: 1,
      total_pages: 1,
      total_count: 0,
      limit: 20
    },
    loading: false,
    error: null
  },
  report: {
    loading: false,
    error: null,
    success: false
  }
};

// Create slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    clearAnalyticsState: (state) => {
      return initialState;
    }
  },
  extraReducers: (builder) => {
    // Asset statistics reducers
    builder
      .addCase(fetchAssetStatistics.pending, (state) => {
        state.assetStats.loading = true;
        state.assetStats.error = null;
      })
      .addCase(fetchAssetStatistics.fulfilled, (state, action) => {
        state.assetStats.loading = false;
        state.assetStats.data = action.payload;
      })
      .addCase(fetchAssetStatistics.rejected, (state, action) => {
        state.assetStats.loading = false;
        state.assetStats.error = action.payload;
      });

    // Department statistics reducers
    builder
      .addCase(fetchDepartmentStatistics.pending, (state) => {
        state.departmentStats.loading = true;
        state.departmentStats.error = null;
      })
      .addCase(fetchDepartmentStatistics.fulfilled, (state, action) => {
        state.departmentStats.loading = false;
        state.departmentStats.data = action.payload;
      })
      .addCase(fetchDepartmentStatistics.rejected, (state, action) => {
        state.departmentStats.loading = false;
        state.departmentStats.error = action.payload;
      });

    // Maintenance statistics reducers
    builder
      .addCase(fetchMaintenanceStatistics.pending, (state) => {
        state.maintenanceStats.loading = true;
        state.maintenanceStats.error = null;
      })
      .addCase(fetchMaintenanceStatistics.fulfilled, (state, action) => {
        state.maintenanceStats.loading = false;
        state.maintenanceStats.data = action.payload;
      })
      .addCase(fetchMaintenanceStatistics.rejected, (state, action) => {
        state.maintenanceStats.loading = false;
        state.maintenanceStats.error = action.payload;
      });

    // Employee asset statistics reducers
    builder
      .addCase(fetchEmployeeAssetStatistics.pending, (state) => {
        state.employeeAssetStats.loading = true;
        state.employeeAssetStats.error = null;
      })
      .addCase(fetchEmployeeAssetStatistics.fulfilled, (state, action) => {
        state.employeeAssetStats.loading = false;
        state.employeeAssetStats.data = action.payload;
        
        // Update pagination info if available
        if (action.payload.page) {
          state.employeeAssetStats.pagination = {
            page: action.payload.page,
            total_pages: action.payload.total_pages,
            total_count: action.payload.total_count,
            limit: action.payload.limit
          };
        }
      })
      .addCase(fetchEmployeeAssetStatistics.rejected, (state, action) => {
        state.employeeAssetStats.loading = false;
        state.employeeAssetStats.error = action.payload;
      });

    // Report generation reducers
    builder
      .addCase(generateReport.pending, (state) => {
        state.report.loading = true;
        state.report.error = null;
        state.report.success = false;
      })
      .addCase(generateReport.fulfilled, (state, action) => {
        state.report.loading = false;
        state.report.success = true;
      })
      .addCase(generateReport.rejected, (state, action) => {
        state.report.loading = false;
        state.report.error = action.payload;
      });
  }
});

// Export actions
export const { clearAnalyticsState } = analyticsSlice.actions;

// Export reducer
export default analyticsSlice.reducer; 