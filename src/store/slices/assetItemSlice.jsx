import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import logger from '../../utils/logger.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const axiosInstance = axios.create({ timeout: 15000 });

/**
 * Fetches asset items for a specific category.
 * @param {string} categoryId - ID of the category to filter items
 * @returns {Promise<Array>} List of asset items
 */
export const fetchAssetItemsByCategory = createAsyncThunk(
  'assetItems/fetchByCategory',
  async (categoryId, { rejectWithValue }) => {
    logger.debug('Initiating fetch of asset items by category', { categoryId });
    try {
      const response = await axiosInstance.get(`${API_URL}/asset-items/?category_id=${categoryId}`);
      logger.info('Successfully fetched asset items', { count: response.data.length });
      console.log('API Response for asset items:', response.data); // Added for debugging
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch asset items', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch asset items');
    }
  }
);

/**
 * Creates a new asset item and updates the associated category.
 * @param {Object} itemData - Asset item data to create
 * @returns {Promise<Object>} Created asset item
 */
export const createAssetItem = createAsyncThunk(
  'assetItems/create',
  async (itemData, { rejectWithValue }) => {
    logger.debug('Initiating creation of asset item', { itemData });
    try {
      const response = await axiosInstance.post(`${API_URL}/asset-items/`, itemData);
      logger.info('Successfully created asset item', { id: response.data.id });
      return response.data;
    } catch (error) {
      logger.error('Failed to create asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to create asset item');
    }
  }
);

/**
 * Updates an existing asset item and syncs category data.
 * @param {Object} payload - Contains id and updated item data
 * @returns {Promise<Object>} Updated asset item
 */
export const updateAssetItem = createAsyncThunk(
  'assetItems/update',
  async ({ id, itemData }, { rejectWithValue }) => {
    logger.debug('Initiating update of asset item', { id, itemData });
    try {
      const response = await axiosInstance.put(`${API_URL}/asset-items/${id}`, itemData);
      logger.info('Successfully updated asset item', { id });
      return response.data;
    } catch (error) {
      logger.error('Failed to update asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to update asset item');
    }
  }
);

/**
 * Deletes an asset item and syncs category data.
 * @param {string} id - Asset item ID to delete
 * @returns {Promise<string>} Deleted item ID
 */
export const deleteAssetItem = createAsyncThunk(
  'assetItems/delete',
  async (id, { rejectWithValue }) => {
    logger.debug('Initiating deletion of asset item', { id });
    try {
      await axiosInstance.delete(`${API_URL}/asset-items/${id}`);
      logger.info('Successfully deleted asset item', { id });
      return id;
    } catch (error) {
      logger.error('Failed to delete asset item', { error: error.message });
      return rejectWithValue(error.response?.data?.detail || 'Failed to delete asset item');
    }
  }
);

const assetItemSlice = createSlice({
  name: 'assetItems',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      logger.debug('Clearing asset items error state');
      state.error = null;
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
      .addCase(createAssetItem.pending, (state) => {
        logger.debug('Create asset item pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(createAssetItem.fulfilled, (state, action) => {
        logger.info('Create asset item fulfilled', { id: action.payload.id });
        state.loading = false;
        state.items.push(action.payload);
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
      })
      .addCase(deleteAssetItem.rejected, (state, action) => {
        logger.error('Delete asset item rejected', { error: action.payload });
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = assetItemSlice.actions;
export default assetItemSlice.reducer;