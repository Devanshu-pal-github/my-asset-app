import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const axiosInstance = axios.create({
  timeout: 15000,
});

export const fetchAssetCategories = createAsyncThunk(
  'assetCategories/fetchAll',
  async (_, { rejectWithValue }) => {
    logger.debug('Initiating fetchAssetCategories');
    try {
      logger.debug('Fetching asset categories from:', { url: `${API_URL}/asset-categories/` });
      const response = await axiosInstance.get(`${API_URL}/asset-categories/`);
      logger.info('Asset categories response:', { data: response.data });
      const data = Array.isArray(response.data) ? response.data : [];
      logger.info('Asset categories processed:', { count: data.length });
      return data;
    } catch (error) {
      logger.error('Fetch asset categories failed:', {
        message: error.message,
        code: error.code,
        response: error.response ? {
          status: error.response.status,
          data: error.response.data,
        } : null,
      });
      const errorMessage = error.code === 'ERR_NETWORK'
        ? 'Network error: Unable to connect to the backend. Please check if the server is running.'
        : error.response?.data?.detail || error.message || 'Failed to fetch asset categories';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addAssetCategory = createAsyncThunk(
  'assetCategories/add',
  async (category, { rejectWithValue }) => {
    logger.debug('Initiating addAssetCategory:', { category });
    try {
      const response = await axiosInstance.post(`${API_URL}/asset-categories/`, category);
      logger.info('Asset category added successfully:', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('Add asset category failed:', { error: error.message });
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to add asset category'
      );
    }
  }
);

export const updateAssetCategory = createAsyncThunk(
  'assetCategories/update',
  async ({ id, category }, { rejectWithValue }) => {
    logger.debug('Initiating updateAssetCategory:', { id, category });
    try {
      const response = await axiosInstance.put(`${API_URL}/asset-categories/${id}`, category);
      logger.info('Asset category updated successfully:', { data: response.data });
      return response.data;
    } catch (error) {
      logger.error('Update asset category failed:', { error: error.message });
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to update asset category'
      );
    }
  }
);

export const deleteAssetCategory = createAsyncThunk(
  'assetCategories/delete',
  async (id, { rejectWithValue }) => {
    logger.debug('Initiating deleteAssetCategory:', { id });
    try {
      await axiosInstance.delete(`${API_URL}/asset-categories/${id}`);
      logger.info('Asset category deleted successfully');
      return id;
    } catch (error) {
      logger.error('Delete asset category failed:', { error: error.message });
      return rejectWithValue(
        error.response?.data?.detail || 'Failed to delete asset category'
      );
    }
  }
);

const assetCategorySlice = createSlice({
  name: 'assetCategories',
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      logger.debug('Clearing error state');
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetCategories.pending, (state) => {
        logger.debug('Fetch asset categories pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetCategories.fulfilled, (state, action) => {
        logger.info('Fetch asset categories fulfilled:', { count: action.payload ? action.payload.length : 0 });
        state.loading = false;
        state.categories = Array.isArray(action.payload)
          ? action.payload.map(cat => ({
              ...cat,
              _id: String(cat._id || cat.id), // Normalize _id to string
            }))
          : [];
      })
      .addCase(fetchAssetCategories.rejected, (state, action) => {
        logger.error('Fetch asset categories rejected:', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
        state.categories = [];
      })
      .addCase(addAssetCategory.pending, (state) => {
        logger.debug('Add asset category pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(addAssetCategory.fulfilled, (state, action) => {
        logger.info('Add asset category fulfilled:', { data: action.payload });
        state.loading = false;
        state.categories.push({ ...action.payload, _id: String(action.payload._id || action.payload.id) });
      })
      .addCase(addAssetCategory.rejected, (state, action) => {
        logger.error('Add asset category rejected:', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAssetCategory.pending, (state) => {
        logger.debug('Update asset category pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssetCategory.fulfilled, (state, action) => {
        logger.info(' Angst category fulfilled:', { data: action.payload });
        state.loading = false;
        const index = state.categories.findIndex((cat) => cat._id === String(action.payload._id || action.payload.id));
        if (index !== -1) {
          state.categories[index] = { ...action.payload, _id: String(action.payload._id || action.payload.id) };
        }
      })
      .addCase(updateAssetCategory.rejected, (state, action) => {
        logger.error('Update asset category rejected:', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAssetCategory.pending, (state) => {
        logger.debug('Delete asset category pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssetCategory.fulfilled, (state, action) => {
        logger.info('Delete asset category fulfilled:', { id: action.payload });
        state.loading = false;
        state.categories = state.categories.filter((cat) => cat._id !== String(action.payload));
      })
      .addCase(deleteAssetCategory.rejected, (state, action) => {
        logger.error('Delete asset category rejected:', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = assetCategorySlice.actions;
export default assetCategorySlice.reducer;