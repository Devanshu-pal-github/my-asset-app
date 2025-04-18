import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import AssetInventory from './pages/AssetInventory/index.jsx';
import AddAssetForm from './pages/AssetInventory/components/AddAssetForm.jsx';
import AssetTablePage from './pages/AssetTable/index.jsx';
import AssetDetail from './pages/AssetDetail/index.jsx';
import AssetAssignmentTable from './pages/AssetInventory/components/AssetAssignmentTable.jsx';
import EmployeeAssignment from './pages/AssetInventory/components/EmployeeAssignment.jsx';
import logger from './utils/logger.jsx';

logger.debug('Rendering App component');

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/asset-inventory" replace />} />
          <Route path="asset-inventory">
            <Route index element={<AssetInventory />} />
            <Route path="add-category" element={<AddAssetForm />} />
            <Route path=":categoryId" element={<AssetTablePage />} />
            <Route path=":categoryId/assign" element={<AssetAssignmentTable />} />
            <Route path=":categoryId/assign/:assetId" element={<EmployeeAssignment />} />
            <Route path="asset/:assetId" element={<AssetDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/asset-inventory" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;