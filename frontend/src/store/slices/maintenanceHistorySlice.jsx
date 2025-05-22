import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function to normalize maintenance history data
const normalizeMaintenance = (maintenance) => {
  // Log raw maintenance data for debugging
  logger.debug('Normalizing maintenance data with fields:', Object.keys(maintenance));
  
  return {
    // Core fields
    id: maintenance.id || '',
    asset_id: maintenance.asset_id || '',
    asset_name: maintenance.asset_name || 'Unknown Asset',
    asset_tag: maintenance.asset_tag || '',
    category_name: maintenance.category_name || '',
    
    // Type and status
    maintenance_type: maintenance.maintenance_type || maintenance.service_type || 'Not Specified',
    service_type: maintenance.service_type || maintenance.maintenance_type || 'Not Specified',
    status: (maintenance.status || 'pending').toLowerCase(),
    
    // Dates - ensure proper format
    request_date: maintenance.request_date || maintenance.created_at || new Date().toISOString(),
    scheduled_date: maintenance.scheduled_date || null,
    completion_date: maintenance.completion_date || maintenance.completed_date || null,
    completed_date: maintenance.completed_date || maintenance.completion_date || null,
    maintenance_date: maintenance.maintenance_date || maintenance.request_date || new Date().toISOString(),
    next_scheduled: maintenance.next_scheduled || maintenance.next_maintenance_date || null,
    
    // Description and notes
    description: maintenance.description || maintenance.maintenance_reason || 'No description provided',
    notes: maintenance.notes || maintenance.comments || '',
    
    // Personnel
    assigned_to_name: maintenance.assigned_to_name || maintenance.technician || 'Unassigned',
    technician: maintenance.technician || maintenance.assigned_to_name || 'Unassigned',
    performed_by: maintenance.performed_by || maintenance.technician || 'Not Specified',
    
    // Condition tracking
    condition_before: maintenance.condition_before || 'Not Specified',
    condition_after: maintenance.condition_after || null,
    
    // Priority and severity
    priority: maintenance.priority || 'Medium',
    severity: maintenance.severity || 'Normal',
    
    // Cost information
    estimated_cost: typeof maintenance.estimated_cost === 'number' ? maintenance.estimated_cost : 0,
    actual_cost: typeof maintenance.actual_cost === 'number' ? maintenance.actual_cost : 0,
    cost: typeof maintenance.cost === 'number' ? maintenance.cost : (maintenance.actual_cost || maintenance.estimated_cost || 0),
    
    // Status flags
    completed: maintenance.completed || maintenance.status?.toLowerCase() === 'completed' || false,
    is_warranty_covered: maintenance.is_warranty_covered || false,
    
    // Additional metadata
    category_name: maintenance.category_name || maintenance.asset?.category_name || 'Unknown Category',
    department: maintenance.department || maintenance.location?.department || 'Not Specified',
    location: maintenance.location || maintenance.site || 'Not Specified',
    
    // Timestamps
    created_at: maintenance.created_at || maintenance.request_date || new Date().toISOString(),
    updated_at: maintenance.updated_at || null,
    
    // Additional fields from backend
    maintenance_reason: maintenance.maintenance_reason || maintenance.description || '',
    maintenance_details: maintenance.maintenance_details || {},
    parts_used: Array.isArray(maintenance.parts_used) ? maintenance.parts_used : [],
    labor_hours: maintenance.labor_hours || 0,
    recommendations: maintenance.recommendations || ''
  };
};

export const fetchMaintenanceHistory = createAsyncThunk(
  'maintenanceHistory/fetchMaintenanceHistory',
  async (assetId = null, { rejectWithValue }) => {
    try {
      logger.debug('Fetching maintenance history from API', { assetId });
      
      // If no assetId is provided, fetch all maintenance history
      const url = assetId 
        ? `${API_URL}/maintenance-history/asset/${assetId}`
        : `${API_URL}/maintenance-history`;
        
      logger.debug('Making request to:', { url });
      const response = await axios.get(url);
      
      // Enhanced logging for debugging
      logger.debug('Raw maintenance history response:', {
        dataLength: response.data?.length || 0,
        firstEntry: response.data?.[0],
        isArray: Array.isArray(response.data)
      });
      
      // Ensure response.data is an array
      const maintenanceData = Array.isArray(response.data) ? response.data : [];
      
      // Normalize the maintenance history data
      const normalizedHistory = maintenanceData.map(entry => {
        const normalized = normalizeMaintenance(entry);
        logger.debug('Normalized maintenance entry:', {
          id: normalized.id,
          asset_name: normalized.asset_name,
          status: normalized.status
        });
        return normalized;
      });
      
      logger.info('Successfully fetched maintenance history', { 
        count: normalizedHistory.length,
        assetId: assetId || 'all'
      });
      
      return normalizedHistory;
    } catch (error) {
      logger.error('Failed to fetch maintenance history', { 
        error: error.message,
        assetId: assetId || 'all',
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