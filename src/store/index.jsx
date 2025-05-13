import { configureStore } from '@reduxjs/toolkit';
import assetCategoryReducer from './slices/assetCategorySlice';
import assetItemReducer from './slices/assetItemSlice';
import assignmentHistoryReducer from './slices/assignmentHistorySlice';
import maintenanceHistoryReducer from './slices/maintenanceHistorySlice';
import documentReducer from './slices/documentSlice';
import employeeReducer from './slices/employeeSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    assetCategories: assetCategoryReducer,
    assetItems: assetItemReducer,
    assignmentHistory: assignmentHistoryReducer,
    maintenanceHistory: maintenanceHistoryReducer,
    documents: documentReducer,
    employees: employeeReducer,
    analytics: analyticsReducer,
  },
});

export default store;