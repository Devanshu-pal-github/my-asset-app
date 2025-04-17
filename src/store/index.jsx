import { configureStore } from '@reduxjs/toolkit';
import assetCategoryReducer from './slices/assetCategorySlice.jsx';
import assetItemReducer from './slices/assetItemSlice.jsx';

const store = configureStore({
  reducer: {
    assetCategories: assetCategoryReducer,
    assetItems: assetItemReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export default store;