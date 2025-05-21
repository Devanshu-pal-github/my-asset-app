import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import logger from '../../utils/logger.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const retryRequest = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, { error: error.message });
      console.warn(`Retry attempt ${attempt} failed:`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export const fetchAssetCategories = createAsyncThunk(
  'assetCategories/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    logger.debug('Initiating fetchAssetCategories with filters:', filters);
    console.log('Fetching asset categories from:', API_URL, 'Filters:', filters);
    try {
      // Build query parameters if any filters are provided
      const queryParams = new URLSearchParams();
      if (filters.category_type) queryParams.append('category_type', filters.category_type);
      if (filters.is_active !== undefined) queryParams.append('is_active', filters.is_active);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const url = `${API_URL}/asset-categories/${queryString}`;
      
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
      
      logger.info('Asset categories response received');
      console.log('Asset categories response in slice:', response);
      
      const data = Array.isArray(response) ? response : [];
      logger.info('Asset categories processed:', { count: data.length });
      
      // Map the backend fields to frontend fields, ensuring all required fields are present
      return data.map(cat => ({
        // Required ID field - use id from backend
        id: cat.id || '',
        _id: cat.id || '', // For backward compatibility
        
        // Core fields from AssetCategoryResponse
        category_name: cat.category_name || '',
        name: cat.category_name || cat.name || '', // Alias for category_name
        category_type: cat.category_type || '',
        description: cat.description || '',
        
        // Statistics fields
        total_assets: cat.total_assets || 0,
        assigned_assets: cat.assigned_assets || 0,
        under_maintenance: cat.under_maintenance || 0,
        unassignable_assets: cat.unassignable_assets || 0,
        total_cost: cat.total_cost || 0,
        in_storage: cat.in_storage || 0,
        available_assets: cat.available_assets || 0,
        
        // UI display fields - compatible with AssetTable
        totalUnits: cat.totalUnits || cat.total_assets || 0,
        totalCost: cat.totalCost || cat.total_cost || 0,
        inStorage: cat.inStorage || cat.in_storage || 0,
        utilizationRate: cat.utilizationRate || 0,
        
        // Boolean flags
        is_active: cat.is_active !== undefined ? cat.is_active : true,
        is_enabled: cat.is_enabled !== undefined ? cat.is_enabled : true,
        is_allotted: cat.is_allotted !== undefined ? cat.is_allotted : false,
        is_allotable: cat.is_allotable !== undefined ? cat.is_allotable : false,
        is_reassignable: cat.is_reassignable !== undefined ? cat.is_reassignable : true,
        is_consumable: cat.is_consumable !== undefined ? cat.is_consumable : false,
        can_be_assigned_reassigned: cat.can_be_assigned_reassigned !== undefined ? cat.can_be_assigned_reassigned : false,
        
        // Maintenance fields
        maintenance_required: cat.maintenance_required !== undefined ? cat.maintenance_required : false,
        requires_maintenance: cat.requires_maintenance !== undefined ? cat.requires_maintenance : false,
        is_recurring_maintenance: cat.is_recurring_maintenance !== undefined ? cat.is_recurring_maintenance : false,
        maintenance_frequency: cat.maintenance_frequency || '',
        maintenance_alert_days: cat.alert_before_due || cat.maintenance_alert_days || null,
        
        // Cost and lifecycle fields
        cost_per_unit: cat.cost_per_unit || null,
        expected_life: cat.expected_life || null,
        life_unit: cat.life_unit || '',
        depreciation_method: cat.depreciation_method || '',
        residual_value: cat.residual_value || null,
        
        // Assignment policies
        assignment_policies: cat.assignment_policies || {
          max_assignments: cat.assignment_policies?.max_assignments || 1,
          assignable_to: cat.assignment_policies?.assignable_to || cat.can_be_assigned_to || null,
          assignment_duration: cat.assignment_policies?.assignment_duration || cat.default_assignment_duration || null,
          duration_unit: cat.assignment_policies?.duration_unit || cat.assignment_duration_unit || 'days',
          allow_multiple_assignments: cat.assignment_policies?.allow_multiple_assignments || cat.allow_multiple_assignments || false,
        },
        
        // Default assignment fields (for backward compatibility)
        can_be_assigned_to: cat.can_be_assigned_to || cat.assignment_policies?.assignable_to || null,
        default_assignment_duration: cat.default_assignment_duration || cat.assignment_policies?.assignment_duration || null,
        assignment_duration_unit: cat.assignment_duration_unit || cat.assignment_policies?.duration_unit || 'days',
        allow_multiple_assignments: cat.allow_multiple_assignments !== undefined ? cat.allow_multiple_assignments : 
                                    (cat.assignment_policies?.allow_multiple_assignments !== undefined ? 
                                    cat.assignment_policies?.allow_multiple_assignments : false),
        
        // Specifications and documents
        has_specifications: cat.has_specifications !== undefined ? cat.has_specifications : false,
        specifications: cat.specifications || [],
        required_documents: cat.required_documents !== undefined ? cat.required_documents : false,
        documents: cat.documents || {
          purchase: false,
          warranty: false,
          insurance: false,
          custom: []
        },
        
        // Edit history
        edit_history: cat.edit_history || [],
        
        // Template flag
        save_as_template: cat.save_as_template !== undefined ? cat.save_as_template : false,
        
        // Timestamps
        created_at: cat.created_at || new Date().toISOString(),
        updated_at: cat.updated_at || null,
        
        // Additional fields for UI
        notes: cat.notes || '',
        icon: 'pi pi-desktop', // Default icon
        
        // Legacy fields for backward compatibility
        count: cat.total_assets || 0,
        total_value: cat.total_cost || 0,
        assigned_count: cat.assigned_assets || 0,
        maintenance_count: cat.under_maintenance || 0,
        policies: cat.policies || [],
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
    console.log('Adding asset category:', category);
    
    try {
      // Map frontend fields to match backend AssetCategoryCreate model
      const payload = {
        category_name: category.category_name || category.name,
        category_type: category.category_type,
        description: category.description,
        policies: category.policies || [],
        
        // Boolean flags
        is_active: category.is_active,
        is_enabled: category.is_enabled,
        is_allotted: category.is_allotted,
        is_allotable: category.is_allotable,
        is_reassignable: category.is_reassignable,
        is_consumable: category.is_consumable,
        can_be_assigned_reassigned: category.can_be_assigned_reassigned,
        
        // Maintenance fields
        maintenance_required: category.maintenance_required,
        requires_maintenance: category.requires_maintenance,
        is_recurring_maintenance: category.is_recurring_maintenance,
        maintenance_frequency: category.maintenance_frequency,
        alert_before_due: category.alert_before_due || category.maintenance_alert_days,
        
        // Specifications and documents
        has_specifications: category.has_specifications,
        specifications: category.specifications || [],
        required_documents: category.required_documents,
        documents: category.documents,
        
        // Cost and lifecycle fields
        cost_per_unit: category.cost_per_unit,
        expected_life: category.expected_life,
        life_unit: category.life_unit,
        depreciation_method: category.depreciation_method,
        residual_value: category.residual_value,
        
        // Assignment fields
        default_assignment_duration: category.default_assignment_duration,
        assignment_duration_unit: category.assignment_duration_unit,
        can_be_assigned_to: category.can_be_assigned_to,
        allow_multiple_assignments: category.allow_multiple_assignments,
        assignment_policies: category.assignment_policies,
        
        // Template flag
        save_as_template: category.save_as_template,
        
        // Additional fields
        notes: category.notes,
      };
      
      console.log('Sending POST request with payload:', payload);
      const response = await fetch(`${API_URL}/asset-categories/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      logger.info('Asset category added successfully:', { data });
      console.log('Asset category added successfully:', data);
      
      // Map the response back to frontend field names
      return {
        id: data.id,
        _id: data.id, // For backward compatibility
        ...data,
      };
    } catch (error) {
      logger.error('Add asset category failed:', { error: error.message });
      console.error('Add asset category failed:', error.message);
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
    console.log('Updating asset category:', { id, category });
    
    try {
      // Map frontend fields to match backend AssetCategoryUpdate model
      const payload = {
        category_name: category.category_name || category.name,
        category_type: category.category_type,
        description: category.description,
        policies: category.policies,
        
        // Boolean flags
        is_active: category.is_active,
        is_enabled: category.is_enabled,
        is_allotted: category.is_allotted,
        is_allotable: category.is_allotable,
        is_reassignable: category.is_reassignable,
        is_consumable: category.is_consumable,
        can_be_assigned_reassigned: category.can_be_assigned_reassigned,
        
        // Maintenance fields
        maintenance_required: category.maintenance_required,
        requires_maintenance: category.requires_maintenance,
        is_recurring_maintenance: category.is_recurring_maintenance,
        maintenance_frequency: category.maintenance_frequency,
        alert_before_due: category.alert_before_due || category.maintenance_alert_days,
        maintenance_alert_days: category.maintenance_alert_days,
        
        // Specifications and documents
        has_specifications: category.has_specifications,
        specifications: category.specifications,
        required_documents: category.required_documents,
        documents: category.documents,
        
        // Cost and lifecycle fields
        cost_per_unit: category.cost_per_unit,
        expected_life: category.expected_life,
        life_unit: category.life_unit,
        depreciation_method: category.depreciation_method,
        residual_value: category.residual_value,
        
        // Assignment fields
        default_assignment_duration: category.default_assignment_duration,
        assignment_duration_unit: category.assignment_duration_unit,
        can_be_assigned_to: category.can_be_assigned_to,
        allow_multiple_assignments: category.allow_multiple_assignments,
        assignment_policies: category.assignment_policies,
        
        // Template flag
        save_as_template: category.save_as_template,
        
        // Additional fields
        notes: category.notes,
      };
      
      console.log('Sending PUT request with payload:', payload);
      const response = await fetch(`${API_URL}/asset-categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      logger.info('Asset category updated successfully:', { data });
      console.log('Asset category updated successfully:', data);
      
      // Map the response back to frontend field names
      return {
        id: data.id,
        _id: data.id, // For backward compatibility
        ...data,
      };
    } catch (error) {
      logger.error('Update asset category failed:', { error: error.message });
      console.error('Update asset category failed:', error.message);
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
    console.log('Deleting asset category:', id);
    
    try {
      const response = await fetch(`${API_URL}/asset-categories/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `HTTP error! Status: ${response.status}` }));
        throw new Error(errorData.detail || `HTTP error! Status: ${response.status}`);
      }
      
      logger.info('Asset category deleted successfully');
      console.log('Asset category deleted successfully');
      return id;
    } catch (error) {
      logger.error('Delete asset category failed:', { error: error.message });
      console.error('Delete asset category failed:', error.message);
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
      console.log('Clearing error state');
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
        console.log('Add asset category pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(addAssetCategory.fulfilled, (state, action) => {
        logger.info('Add asset category fulfilled:', { data: action.payload });
        console.log('Add asset category fulfilled:', action.payload);
        state.loading = false;
        state.categories.push(action.payload);
      })
      .addCase(addAssetCategory.rejected, (state, action) => {
        logger.error('Add asset category rejected:', { error: action.payload });
        console.error('Add asset category rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateAssetCategory.pending, (state) => {
        logger.debug('Update asset category pending');
        console.log('Update asset category pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAssetCategory.fulfilled, (state, action) => {
        logger.info('Update asset category fulfilled:', { data: action.payload });
        console.log('Update asset category fulfilled:', action.payload);
        state.loading = false;
        const index = state.categories.findIndex((cat) => 
          cat.id === action.payload.id || cat._id === action.payload.id
        );
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
      })
      .addCase(updateAssetCategory.rejected, (state, action) => {
        logger.error('Update asset category rejected:', { error: action.payload });
        console.error('Update asset category rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteAssetCategory.pending, (state) => {
        logger.debug('Delete asset category pending');
        console.log('Delete asset category pending');
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAssetCategory.fulfilled, (state, action) => {
        logger.info('Delete asset category fulfilled:', { id: action.payload });
        console.log('Delete asset category fulfilled:', action.payload);
        state.loading = false;
        state.categories = state.categories.filter((cat) => 
          cat.id !== action.payload && cat._id !== action.payload
        );
      })
      .addCase(deleteAssetCategory.rejected, (state, action) => {
        logger.error('Delete asset category rejected:', { error: action.payload });
        console.error('Delete asset category rejected:', action.payload);
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = assetCategorySlice.actions;
export default assetCategorySlice.reducer;
