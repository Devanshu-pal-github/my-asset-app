import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (assetId, { rejectWithValue }) => {
    try {
      logger.debug('Fetching documents from API', { assetId });
      const response = await axios.get(`${API_URL}/documents/?asset_id=${assetId}`);
      logger.info('Successfully fetched documents', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch documents', { error: error.message });
      return rejectWithValue(error.message);
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState: {
    documents: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearDocuments: (state) => {
      state.documents = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearDocuments } = documentSlice.actions;
export default documentSlice.reducer;