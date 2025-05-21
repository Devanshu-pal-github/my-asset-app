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

export const fetchAssetItemsByCategory = createAsyncThunk(
  'assetItems/fetchByCategory',
  async (categoryId, { rejectWithValue }) => {
    logger.debug('Initiating fetch of asset items by category', { categoryId });
    try {
      const response = await withRetry(() => axiosInstance.get(`${API_URL}/asset-items/?category_id=${categoryId}`));
      logger.info('Successfully fetched asset items', { count: response.data.length });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch asset items', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch asset items');
    }
  }
);

export const fetchAssetItemById = createAsyncThunk(
  'assetItems/fetchById',
  async (assetId, { rejectWithValue }) => {
    logger.debug('Initiating fetch of asset item by ID', { assetId });
    try {
      const response = await withRetry(() => axiosInstance.get(`${API_URL}/asset-items/${assetId}`));
      logger.info('Successfully fetched asset item', { assetId });
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch asset item');
    }
  }
);

export const createAssetItem = createAsyncThunk(
  'assetItems/create',
  async (itemData, { rejectWithValue, dispatch }) => {
    logger.debug('Initiating creation of asset item', { itemData });
    try {
      const response = await withRetry(() => axiosInstance.post(`${API_URL}/asset-items/`, itemData));
      logger.info('Successfully created asset item', { id: response.data.id });
      await dispatch(fetchAssetItemsByCategory(itemData.category_id)).unwrap();
      return response.data;
    } catch (error) {
      logger.error('Failed to create asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to create asset item');
    }
  }
);

export const updateAssetItem = createAsyncThunk(
  'assetItems/update',
  async ({ id, itemData }, { rejectWithValue }) => {
    logger.debug('Initiating update of asset item', { id, itemData });
    try {
      const response = await withRetry(() => axiosInstance.put(`${API_URL}/asset-items/${id}`, itemData));
      logger.info('Successfully updated asset item', { id });
      return response.data;
    } catch (error) {
      logger.error('Failed to update asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to update asset item');
    }
  }
);

export const deleteAssetItem = createAsyncThunk(
  'assetItems/delete',
  async (id, { rejectWithValue }) => {
    logger.debug('Initiating deletion of asset item', { id });
    try {
      await withRetry(() => axiosInstance.delete(`${API_URL}/asset-items/${id}`));
      logger.info('Successfully deleted asset item', { id });
      return id;
    } catch (error) {
      logger.error('Failed to delete asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete asset item');
    }
  }
);

export const assignAssetItem = createAsyncThunk(
  'assetItems/assign',
  async ({ assetId, employeeId, department }, { rejectWithValue, dispatch }) => {
    logger.debug('Initiating assignment of asset item', { assetId, employeeId, department });
    try {
      const response = await withRetry(() => axiosInstance.post(`${API_URL}/asset-items/${assetId}/assign`, { employee_id: employeeId, department }));
      logger.info('Successfully assigned asset item', { assetId, employeeId });
      await dispatch(fetchAssetItemsByCategory(response.data.category_id)).unwrap();
      return response.data;
    } catch (error) {
      logger.error('Failed to assign asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to assign asset item');
    }
  }
);

export const unassignAssetItem = createAsyncThunk(
  'assetItems/unassign',
  async (assetId, { rejectWithValue, dispatch }) => {
    logger.debug('Initiating unassignment of asset item', { assetId });
    try {
      const response = await withRetry(() => axiosInstance.post(`${API_URL}/asset-items/${assetId}/unassign`));
      logger.info('Successfully unassigned asset item', { assetId });
      await dispatch(fetchAssetItemsByCategory(response.data.category_id)).unwrap();
      return response.data;
    } catch (error) {
      logger.error('Failed to unassign asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to unassign asset item');
    }
  }
);

const assetItemSlice = createSlice({
  name: 'assetItems',
  initialState: {
    items: [],
    currentItem: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      logger.debug('Clearing asset items error state');
      state.error = null;
    },
    clearCurrentItem: (state) => {
      logger.debug('Clearing current asset item');
      state.currentItem = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAssetItemsByCategory.pending, (state) => {
        logger.debug('Fetch asset items pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetItemsByCategory.fulfilled, (state, action) => {
        logger.info('Fetch asset items fulfilled', { count: action.payload.length });
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAssetItemsByCategory.rejected, (state, action) => {
        logger.error('Fetch asset items rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchAssetItemById.pending, (state) => {
        logger.debug('Fetch asset item by ID pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetItemById.fulfilled, (state, action) => {
        logger.info('Fetch asset item by ID fulfilled', { assetId: action.payload.id });
        state.loading = false;
        state.currentItem = action.payload;
      })
      .addCase(fetchAssetItemById.rejected, (state, action) => {
        logger.error('Fetch asset item by ID rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createAssetItem.pending, (state) => {
        logger.debug('Create asset item pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssetItem.fulfilled, (state, action) => {
        logger.info('Create asset item fulfilled', { id: action.payload.id });
        state.loading = false;
      })
      .addCase(createAssetItem.rejected, (state, action) => {
        logger.error('Create asset item rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAssetItem.pending, (state) => {
        logger.debug('Update asset item pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssetItem.fulfilled, (state, action) => {
        logger.info('Update asset item fulfilled', { id: action.payload.id });
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.currentItem && state.currentItem.id === action.payload.id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(updateAssetItem.rejected, (state, action) => {
        logger.error('Update asset item rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAssetItem.pending, (state) => {
        logger.debug('Delete asset item pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssetItem.fulfilled, (state, action) => {
        logger.info('Delete asset item fulfilled', { id: action.payload });
        state.loading = false;
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (state.currentItem && state.currentItem.id === action.payload) {
          state.currentItem = null;
        }
      })
      .addCase(deleteAssetItem.rejected, (state, action) => {
        logger.error('Delete asset item rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(assignAssetItem.pending, (state) => {
        logger.debug('Assign asset item pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(assignAssetItem.fulfilled, (state, action) => {
        logger.info('Assign asset item fulfilled', { id: action.payload.id });
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.currentItem && state.currentItem.id === action.payload.id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(assignAssetItem.rejected, (state, action) => {
        logger.error('Assign asset item rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(unassignAssetItem.pending, (state) => {
        logger.debug('Unassign asset item pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(unassignAssetItem.fulfilled, (state, action) => {
        logger.info('Unassign asset item fulfilled', { id: action.payload.id });
        state.loading = false;
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        if (state.currentItem && state.currentItem.id === action.payload.id) {
          state.currentItem = action.payload;
        }
      })
      .addCase(unassignAssetItem.rejected, (state, action) => {
        logger.error('Unassign asset item rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentItem } = assetItemSlice.actions;
export default assetItemSlice.reducer;
