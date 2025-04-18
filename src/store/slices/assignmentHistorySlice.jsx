import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const fetchAssignmentHistory = createAsyncThunk(
  'assignmentHistory/fetchAssignmentHistory',
  async (assetId, { rejectWithValue }) => {
    try {
      logger.debug('Fetching assignment history from API', { assetId });
      const response = await axios.get(`${API_URL}/assignment-history/?asset_id=${assetId}`);
      logger.info('Successfully fetched assignment history', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch assignment history', { error: error.message });
      return rejectWithValue(error.message);
    }
  }
);

const assignmentHistorySlice = createSlice({
  name: 'assignmentHistory',
  initialState: {
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearAssignmentHistory: (state) => {
      state.history = [];
      state.error = null;
    },
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
      })
      .addCase(fetchAssignmentHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAssignmentHistory } = assignmentHistorySlice.actions;
export default assignmentHistorySlice.reducer;