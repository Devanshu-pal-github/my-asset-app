import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchMaintenanceHistory = createAsyncThunk(
  'maintenanceHistory/fetchMaintenanceHistory',
  async (assetId, { rejectWithValue }) => {
    try {
      logger.debug('Fetching maintenance history from API', { assetId });
      const response = await axios.get(`${API_URL}/maintenance-history/?asset_id=${assetId}`);
      logger.info('Successfully fetched maintenance history', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch maintenance history', { error: error.message });
      return rejectWithValue(error.message);
    }
  }
);

const maintenanceHistorySlice = createSlice({
  name: 'maintenanceHistory',
  initialState: {
    history: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearMaintenanceHistory: (state) => {
      state.history = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { clearMaintenanceHistory } = maintenanceHistorySlice.actions;
export default maintenanceHistorySlice.reducer;