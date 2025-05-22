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

// Helper function to normalize assignment history entry
const normalizeAssignmentHistory = (entry) => {
  logger.debug('Normalizing assignment history entry', { entryId: entry.id, entry });
  
  // Ensure we have a valid entry object to work with
  if (!entry || typeof entry !== 'object') {
    logger.warn('Invalid assignment entry received for normalization', { entry });
    return {
      id: '',
      asset_id: '',
      asset_name: 'Unknown Asset',
      employee_id: '',
      employee_name: 'Unknown Employee',
      assignment_date: new Date().toISOString(),
      status: 'unknown',
      is_active: false
    };
  }
  
  return {
    id: entry.id || '',
    asset_id: entry.asset_id || '',
    asset_name: entry.asset_name || 'Unknown Asset',
    asset_tag: entry.asset_tag || '',
    category_id: entry.category_id || '',
    category_name: entry.category_name || '',
    employee_id: entry.employee_id || entry.assigned_to || '',
    employee_name: entry.employee_name || 'Unknown Employee',
    assignment_date: entry.assignment_date || entry.created_at || new Date().toISOString(),
    expected_return_date: entry.expected_return_date || null,
    return_date: entry.return_date || entry.returned_date || null,
    status: entry.status || (entry.return_date ? 'returned' : 'active'),
    notes: entry.notes || entry.assignment_notes || '',
    assigned_by: entry.assigned_by || '',
    assigned_by_name: entry.assigned_by_name || '',
    location: entry.location || entry.department || '',
    is_active: entry.is_active !== undefined ? entry.is_active : !entry.return_date,
    created_at: entry.created_at || entry.assignment_date || new Date().toISOString(),
    updated_at: entry.updated_at || entry.assignment_date || new Date().toISOString(),
    department: entry.department || entry.location || '',
    condition_at_assignment: entry.condition_at_assignment || entry.condition || 'Good',
    assignment_type: entry.assignment_type || 'PERMANENT'
  };
};

export const fetchAssignmentHistory = createAsyncThunk(
  'assignmentHistory/fetchAssignmentHistory',
  async (assetId, { rejectWithValue }) => {
    try {
      logger.debug('Fetching assignment history from API', { assetId });
      console.log(`Fetching assignment history for asset ID: ${assetId}`);
      
      const url = `${API_URL}/assignment-history/asset/${assetId}`;
      logger.info('Making API request to fetch assignment history', { url, assetId });
      
      const response = await withRetry(() => axiosInstance.get(url));
      logger.info('Successfully fetched assignment history', { 
        count: response.data.length,
        assetId,
        responseDataSample: response.data.length > 0 ? response.data[0] : 'No data'
      });
      
      // Log raw response for debugging
      console.log('Raw assignment history response:', response.data);
      logger.debug('Raw assignment history response', { 
        data: response.data,
        fields: response.data.length > 0 ? Object.keys(response.data[0]) : []
      });
      
      return response.data.map(entry => normalizeAssignmentHistory(entry));
    } catch (error) {
      logger.error('Failed to fetch assignment history', { 
        error: error.message,
        assetId,
        status: error.response?.status,
        data: error.response?.data,
        stack: error.stack
      });
      console.error('Error fetching assignment history:', error);
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const createAssignment = createAsyncThunk(
  'assignmentHistory/createAssignment',
  async (payload, { rejectWithValue }) => {
    try {
      // Log full payload for debugging
      logger.debug('Creating new assignment with payload:', payload);
      console.log('Assignment payload from component:', payload);
      
      // Validate required fields
      if (!payload.assetId) {
        const error = 'Asset ID is required for assignment';
        logger.error(error, { payload });
        throw new Error(error);
      }
      
      if (!payload.employeeId) {
        const error = 'Employee ID is required for assignment';
        logger.error(error, { payload });
        throw new Error(error);
      }
      
      // Prepare payload based on required backend fields
      // IMPORTANT: Use snake_case for backend API
      const apiPayload = {
        asset_id: payload.assetId,
        assigned_to: payload.employeeId,
        assignment_notes: payload.assignmentNotes || 'Assigned via asset management system',
        assignment_type: payload.assignmentType || 'PERMANENT',
        assignment_date: payload.startDate || new Date().toISOString(),
        expected_return_date: payload.endDate || null,
        department: payload.department || null,
        condition: payload.condition || 'Good'
      };
      
      // Log API request details
      logger.info('Sending assignment request to API', { 
        url: `${API_URL}/assignment-history/`,
        payload: apiPayload 
      });
      console.log('API request payload:', apiPayload);
      console.log('API payload fields:', Object.keys(apiPayload));
      console.log('Sending to URL:', `${API_URL}/assignment-history/`);
      
      // Make the API request with retry logic
      const response = await withRetry(() => 
        axiosInstance.post(`${API_URL}/assignment-history/`, apiPayload)
      );
      
      // Log the complete API response
      logger.info('Assignment API response received', { 
        status: response.status,
        responseData: response.data,
        responseFields: Object.keys(response.data)
      });
      console.log('Assignment API response:', response.data);
      
      // If response doesn't have an ID, it might be an error
      if (!response.data.id && !response.data._id) {
        logger.warn('API response missing ID field', { 
          response: response.data,
          fields: Object.keys(response.data)
        });
      }
      
      const normalizedAssignment = normalizeAssignmentHistory(response.data);
      logger.debug('Normalized assignment data:', normalizedAssignment);
      
      // Log success with key details
      logger.info('Assignment created successfully', {
        assignmentId: normalizedAssignment.id,
        assetId: normalizedAssignment.asset_id,
        employeeId: normalizedAssignment.employee_id,
        status: normalizedAssignment.status
      });
      
      return normalizedAssignment;
    } catch (error) {
      // Get detailed error information
      const errorStatus = error.response?.status;
      const errorData = error.response?.data;
      const errorDetail = errorData?.detail || error.message;
      
      logger.error('Failed to create assignment', {
        error: errorDetail,
        payload,
        assetId: payload.assetId,
        employeeId: payload.employeeId,
        status: errorStatus,
        responseData: errorData,
        stack: error.stack
      });
      
      // Log detailed error for debugging
      console.error(`Assignment creation failed (${errorStatus}):`, errorDetail);
      console.error('Original payload:', payload);
      
      if (errorData) {
        console.error('Error response data:', errorData);
      }
      
      return rejectWithValue(errorDetail);
    }
  }
);

export const unassignAsset = createAsyncThunk(
  'assignmentHistory/unassignAsset',
  async (payload, { rejectWithValue }) => {
    try {
      // Log full payload for debugging
      logger.debug('Unassigning asset with payload:', payload);
      console.log('Unassignment payload from component:', payload);
      
      // Make sure we have required fields
      if (!payload.assignmentId) {
        throw new Error('Assignment ID is required for unassignment');
      }
      
      // Prepare payload based on required backend fields
      const apiPayload = {
        assignment_id: payload.assignmentId,
        returned_date: payload.returnDate || new Date().toISOString(),
        return_notes: payload.returnNotes || 'Unassigned via asset management system',
        return_condition: payload.returnCondition || 'Good'
      };
      
      // Log API request details
      logger.info('Sending unassignment request to API', { 
        url: `${API_URL}/assignment-history/unassign`,
        payload: apiPayload 
      });
      console.log('API request payload:', apiPayload);
      console.log('Sending to URL:', `${API_URL}/assignment-history/unassign`);
      
      const response = await withRetry(() => 
        axiosInstance.post(`${API_URL}/assignment-history/unassign`, apiPayload)
      );
      
      // Log the complete API response
      logger.info('Unassignment API response received', { 
        status: response.status, 
        responseData: response.data,
        responseFields: Object.keys(response.data)
      });
      console.log('Unassignment API response:', response.data);
      
      return {
        assignment_id: payload.assignmentId,
        return_date: apiPayload.returned_date,
        return_notes: apiPayload.return_notes,
        status: 'returned',
        is_active: false,
        ...response.data
      };
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      logger.error('Failed to unassign asset', {
        error: errorMessage,
        payload,
        status: error.response?.status,
        responseData: error.response?.data,
        stack: error.stack
      });
      console.error('Unassignment failed:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

const assignmentHistorySlice = createSlice({
  name: 'assignmentHistory',
  initialState: {
    history: [],
    loading: false,
    error: null,
    currentAssignment: null
  },
  reducers: {
    clearAssignmentHistory: (state) => {
      state.history = [];
      state.error = null;
      state.currentAssignment = null;
    },
    setCurrentAssignment: (state, action) => {
      state.currentAssignment = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssignmentHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssignmentHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.currentAssignment = action.payload.find(entry => entry.is_active) || null;
      })
      .addCase(fetchAssignmentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAssignment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssignment.fulfilled, (state, action) => {
        state.loading = false;
        state.history.push(action.payload);
        state.currentAssignment = action.payload;
      })
      .addCase(createAssignment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(unassignAsset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unassignAsset.fulfilled, (state, action) => {
        state.loading = false;
        // Update the history entry with return information
        const index = state.history.findIndex(entry => entry.id === action.payload.assignment_id);
        if (index !== -1) {
          state.history[index] = {
            ...state.history[index],
            return_date: action.payload.return_date,
            status: 'returned',
            is_active: false
          };
        }
        state.currentAssignment = null;
      })
      .addCase(unassignAsset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAssignmentHistory, setCurrentAssignment } = assignmentHistorySlice.actions;
export default assignmentHistorySlice.reducer;