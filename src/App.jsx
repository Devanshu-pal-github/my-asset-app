import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AssetInventory from "./pages/AssetInventory/index.jsx";
import AddAssetForm from "./pages/AssetInventory/components/AddAssetForm.jsx";
import AssetTablePage from "./pages/AssetTable/index.jsx";
import AssetDetail from "./pages/AssetDetail/index.jsx";
import AssetAssignmentTable from "./pages/AssetInventory/components/AssetAssignmentTable.jsx";
import EmployeeAssignment from "./pages/AssetInventory/components/EmployeeAssignment.jsx";
import AssetUnassignmentTable from "./pages/AssetInventory/components/AssetUnassignmentTable.jsx";
import EmployeeUnassignment from "./pages/AssetInventory/components/EmployeeUnassignment.jsx";
import AddItemPage from "./pages/AssetTable/components/AddItemPage.jsx";
import EmployeeAssets from "./pages/EmployeeAssets/index.jsx";
import EmployeeDetails from "./pages/EmployeeDetails/index.jsx";
import logger from "./utils/logger.jsx";

logger.debug("Rendering App component");

function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/asset-inventory" replace />} />
          <Route path="asset-inventory">
            <Route index element={<AssetInventory />} />
            <Route path="add-category" element={<AddAssetForm />} />
            <Route path=":categoryId" element={<AssetTablePage />} />
            <Route path=":categoryId/add-item" element={<AddItemPage />} />
            <Route
              path=":categoryId/assign"
              element={<AssetAssignmentTable />}
            />
            <Route
              path=":categoryId/assign/:assetId"
              element={<EmployeeAssignment />}
            />
            <Route
              path=":categoryId/unassign"
              element={<AssetUnassignmentTable />}
            />
            <Route
              path=":categoryId/unassign/:assetId"
              element={<EmployeeUnassignment />}
            />
            <Route path=":categoryId/:assetId" element={<AssetDetail />} />
          </Route>
          <Route path="employee-assets" element={<EmployeeAssets />} />
          <Route path="employee-profile/:id" element={<EmployeeDetails />} />
          <Route
            path="*"
            element={<Navigate to="/asset-inventory" replace />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;