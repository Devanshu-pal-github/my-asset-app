import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to normalize maintenance history data
const normalizeMaintenance = (maintenance) => {
  return {
    id: maintenance.id,
    asset_id: maintenance.asset_id,
    asset_name: maintenance.asset_name,
    asset_tag: maintenance.asset_tag,
    maintenance_type: maintenance.maintenance_type,
    service_type: maintenance.service_type,
    status: maintenance.status,
    request_date: maintenance.request_date,
    scheduled_date: maintenance.scheduled_date,
    completion_date: maintenance.completion_date || maintenance.completed_date,
    description: maintenance.description,
    assigned_to_name: maintenance.assigned_to_name,
    technician: maintenance.technician,
    condition_before: maintenance.condition_before,
    condition_after: maintenance.condition_after,
    maintenance_date: maintenance.maintenance_date,
    priority: maintenance.priority,
    severity: maintenance.severity,
    estimated_cost: maintenance.estimated_cost,
    actual_cost: maintenance.actual_cost,
    cost: maintenance.cost,
    completed: maintenance.completed,
    notes: maintenance.notes,
    is_warranty_covered: maintenance.is_warranty_covered,
    performed_by: maintenance.performed_by,
    next_scheduled: maintenance.next_scheduled
  };
};

export const fetchMaintenanceHistory = createAsyncThunk(
  'maintenanceHistory/fetchMaintenanceHistory',
  async (assetId, { rejectWithValue }) => {
    try {
      logger.debug('Fetching maintenance history from API', { assetId });
      const response = await axios.get(`${API_URL}/maintenance-history/asset/${assetId}`);
      
      // Enhanced logging for debugging
      logger.debug('Raw maintenance history response:', {
        data: response.data,
        firstEntry: response.data[0],
        dataType: typeof response.data,
        isArray: Array.isArray(response.data)
      });
      
      console.log('Raw maintenance history response:', {
        data: response.data,
        firstEntry: response.data[0],
        dataType: typeof response.data,
        isArray: Array.isArray(response.data)
      });
      
      // Normalize the maintenance history data
      const normalizedHistory = response.data.map(entry => {
        const normalized = normalizeMaintenance(entry);
        console.log('Normalized entry:', normalized);
        return normalized;
      });
      
      logger.info('Successfully fetched maintenance history', { 
        count: normalizedHistory.length,
        assetId,
        firstNormalized: normalizedHistory[0]
      });
      
      return normalizedHistory;
    } catch (error) {
      logger.error('Failed to fetch maintenance history', { 
        error: error.message,
        assetId,
        response: error.response?.data 
      });
      console.error('Maintenance history error:', {
        message: error.message,
        response: error.response?.data
      });
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const requestMaintenance = createAsyncThunk(
  'maintenanceHistory/requestMaintenance',
  async (maintenanceData, { rejectWithValue }) => {
    try {
      logger.debug('Requesting maintenance', { maintenanceData });
      
      const response = await axios.post(`${API_URL}/maintenance-history/request`, maintenanceData);
      
      logger.info('Successfully requested maintenance', {
        assetId: maintenanceData.asset_id,
        maintenanceId: response.data.id
      });
      
      return normalizeMaintenance(response.data);
    } catch (error) {
      logger.error('Failed to request maintenance', {
        error: error.message,
        maintenanceData
      });
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const updateMaintenanceStatus = createAsyncThunk(
  'maintenanceHistory/updateStatus',
  async ({ maintenanceId, updateData }, { rejectWithValue }) => {
    try {
      logger.debug('Updating maintenance status', { maintenanceId, updateData });
      
      const response = await axios.post(`${API_URL}/maintenance-history/update`, {
        maintenance_id: maintenanceId,
        ...updateData
      });
      
      logger.info('Successfully updated maintenance status', {
        maintenanceId,
        newStatus: updateData.status
      });
      
      return normalizeMaintenance(response.data);
    } catch (error) {
      logger.error('Failed to update maintenance status', {
        error: error.message,
        maintenanceId
      });
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const maintenanceHistorySlice = createSlice({
  name: 'maintenanceHistory',
  initialState: {
    history: [],
    loading: false,
    error: null,
    currentMaintenance: null
  },
  reducers: {
    clearMaintenanceHistory: (state) => {
      state.history = [];
      state.error = null;
      state.currentMaintenance = null;
    },
    setCurrentMaintenance: (state, action) => {
      state.currentMaintenance = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch maintenance history
      .addCase(fetchMaintenanceHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMaintenanceHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(fetchMaintenanceHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Request maintenance
      .addCase(requestMaintenance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestMaintenance.fulfilled, (state, action) => {
        state.loading = false;
        state.history.unshift(action.payload);
        state.currentMaintenance = action.payload;
      })
      .addCase(requestMaintenance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update maintenance status
      .addCase(updateMaintenanceStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMaintenanceStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.history.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.history[index] = action.payload;
        }
        if (state.currentMaintenance?.id === action.payload.id) {
          state.currentMaintenance = action.payload;
        }
      })
      .addCase(updateMaintenanceStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMaintenanceHistory, setCurrentMaintenance } = maintenanceHistorySlice.actions;
export default maintenanceHistorySlice.reducer;