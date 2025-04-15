import { configureStore } from '@reduxjs/toolkit';
import assetCategoryReducer from './slices/assetCategorySlice.jsx';

const store = configureStore({
  reducer: {
    assetCategories: assetCategoryReducer,
  },
});

export default store;