
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import logger from '../../utils/logger.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      logger.warning(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
      console.warn(`Retry attempt ${attempt} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const fetchAssetCategories = createAsyncThunk(
  'assetCategories/fetchAll',
  async (_, { rejectWithValue }) => {
    logger.debug('Initiating fetchAssetCategories');
    console.log('Fetching asset categories from:', API_URL);
    try {
      const url = `${API_URL}/asset-categories/`;
      logger.debug('Sending GET request:', { url });
      console.log('Sending GET request to:', url);
      const response = await retryRequest(async () => {
        const res = await fetch(url, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) {
          throw new Error(`HTTP error! Status: ${res.status}`);
        }
        return res.json();
      });
      logger.info('Asset categories response:', { status: response.status, data: response });
      console.log('Asset categories response:', response);
      const data = Array.isArray(response) ? response : [];
      logger.info('Asset categories processed:', { count: data.length });
      return data.map(cat => ({
        ...cat,
        _id: String(cat._id || cat.id || ''),
        name: cat.name || '',
        icon: cat.icon || 'pi pi-desktop',
        description: cat.description || '',
        is_active: cat.is_active !== undefined ? cat.is_active : true,
        category_type: cat.category_type || '',
        is_reassignable: cat.is_reassignable !== undefined ? cat.is_reassignable : true,
        is_consumable: cat.is_consumable !== undefined ? cat.is_consumable : false,
        requires_maintenance: cat.requires_maintenance !== undefined ? cat.requires_maintenance : false,
        maintenance_frequency: cat.maintenance_frequency || '',
        maintenance_alert_days: cat.maintenance_alert_days || null,
        cost_per_unit: cat.cost_per_unit || null,
        expected_life: cat.expected_life || null,
        life_unit: cat.life_unit || '',
        depreciation_method: cat.depreciation_method || '',
        residual_value: cat.residual_value || null,
        assignment_policies: cat.assignment_policies || {
          max_assignments: 1,
          assignable_to: null,
          assignment_duration: null,
          duration_unit: null,
          allow_multiple_assignments: false,
        },
        specifications: cat.specifications || {},
        save_as_template: cat.save_as_template !== undefined ? cat.save_as_template : false,
        created_at: cat.created_at || new Date().toISOString(),
        updated_at: cat.updated_at || null,
        count: cat.count || 0,
        total_value: cat.total_value || 0,
        assigned_count: cat.assigned_count || 0,
        maintenance_count: cat.maintenance_count || 0,
        utilization_rate: cat.utilization_rate || 0,
      }));
    } catch (error) {
      const errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
      logger.error('Fetch asset categories failed:', errorDetails);
      console.error('Fetch asset categories error:', errorDetails);
      const errorMessage = error.message.includes('NetworkError') || error.message.includes('Failed to fetch')
        ? `Network error: Unable to connect to ${API_URL}. Ensure the backend is running and CORS is configured.`
        : error.message || 'Failed to fetch asset categories';
      return rejectWithValue(errorMessage);
    }
  }
);

export const addAssetCategory = createAsyncThunk(
  'assetCategories/add',
  async (category, { rejectWithValue }) => {
    logger.debug('Initiating addAssetCategory:', { category });
    try {
      const response = await fetch(`${API_URL}/asset-categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      logger.info('Asset category added successfully:', { data });
      return data;
    } catch (error) {
      logger.error('Add asset category failed:', { error: error.message });
      return rejectWithValue(
        error.message || 'Failed to add asset category'
      );
    }
  }
);

export const updateAssetCategory = createAsyncThunk(
  'assetCategories/update',
  async ({ id, category }, { rejectWithValue }) => {
    logger.debug('Initiating updateAssetCategory:', { id, category });
    try {
      const payload = {
        name: category.name,
        icon: category.icon,
        description: category.description,
        category_type: category.category_type,
        is_active: category.is_active,
        is_reassignable: category.is_reassignable,
        is_consumable: category.is_consumable,
        requires_maintenance: category.requires_maintenance,
        maintenance_frequency: category.maintenance_frequency,
        maintenance_alert_days: category.maintenance_alert_days,
        cost_per_unit: category.cost_per_unit,
        expected_life: category.expected_life,
        life_unit: category.life_unit,
        depreciation_method: category.depreciation_method,
        residual_value: category.residual_value,
        assignment_policies: category.assignment_policies,
        specifications: category.specifications,
        save_as_template: category.save_as_template,
      };
      const response = await fetch(`${API_URL}/asset-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      logger.info('Asset category updated successfully:', { data });
      return {
        ...data,
        _id: String(data._id || data.id || ''),
        count: data.count || 0,
        total_value: data.total_value || 0,
        assigned_count: data.assigned_count || 0,
        maintenance_count: data.maintenance_count || 0,
        utilization_rate: data.utilization_rate || 0,
      };
    } catch (error) {
      logger.error('Update asset category failed:', { error: error.message });
      return rejectWithValue(
        error.message || 'Failed to update asset category'
      );
    }
  }
);

export const deleteAssetCategory = createAsyncThunk(
  'assetCategories/delete',
  async (id, { rejectWithValue }) => {
    logger.debug('Initiating deleteAssetCategory:', { id });
    try {
      const response = await fetch(`${API_URL}/asset-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      logger.info('Asset category deleted successfully');
      return id;
    } catch (error) {
      logger.error('Delete asset category failed:', { error: error.message });
      return rejectWithValue(
        error.message || 'Failed to delete asset category'
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
        console.log('Fetch asset categories pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAssetCategories.fulfilled, (state, action) => {
        logger.info('Fetch asset categories fulfilled:', { count: action.payload ? action.payload.length : 0 });
        console.log('Fetch asset categories fulfilled:', action.payload);
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchAssetCategories.rejected, (state, action) => {
        logger.error('Fetch asset categories rejected:', { error: action.payload });
        console.error('Fetch asset categories rejected:', action.payload);
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
        logger.info('Asset category fulfilled:', { data: action.payload });
        state.loading = false;
        const index = state.categories.findIndex((cat) => cat._id === String(action.payload._id || action.payload.id));
        if (index !== -1) {
          state.categories[index] = action.payload;
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
