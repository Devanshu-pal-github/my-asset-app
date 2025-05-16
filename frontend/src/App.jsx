import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
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
import AddAllottedItems from "./pages/AssetTable/components/AddAllottedItems.jsx";
import BulkUploadPage from "./pages/AssetTable/components/BulkUploadPage.jsx"; // Import BulkUploadPage
import EmployeeAssets from "./pages/EmployeeAssets/index.jsx";
import EmployeeDetails from "./pages/EmployeeDetails/index.jsx";
import Maintenance from "./pages/Maintenance/index.jsx"; // Import Maintenance page
import RequestsApprovals from "./pages/RequestsApprovals/index.jsx"; // Import RequestsApprovals page
import ReportsAnalytics from "./pages/ReportsAnalytics/index.jsx"; // Import Reports & Analytics page
import logger from "./utils/logger.jsx";

// Mock assetCategories and addAssetItem for BulkUploadPage (replace with actual data in a real app)
const mockCategories = [
  { id: "cat1", name: "Laptops", is_allotted: false },
  { id: "cat2", name: "Stationery", is_allotted: true },
];
const mockAddAssetItem = (item) => {
  logger.info("Mock addAssetItem called", { item });
};

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
            <Route path=":categoryId/add-allotted-items" element={<AddAllottedItems />} />
            <Route path=":categoryId/bulk-upload" element={<BulkUploadPage assetCategories={mockCategories} addAssetItem={mockAddAssetItem} />} /> {/* New route */}
            <Route path=":categoryId/assign" element={<AssetAssignmentTable />} />
            <Route path=":categoryId/assign/:assetId" element={<EmployeeAssignment />} />
            <Route path=":categoryId/unassign" element={<AssetUnassignmentTable />} />
            <Route path=":categoryId/unassign/:assetId" element={<EmployeeUnassignment />} />
          </Route>
          <Route path="asset/:assetId" element={<AssetDetail />} />
          <Route path="employee-assets" element={<EmployeeAssets />} />
          <Route path="employee-profile/:id" element={<EmployeeDetails />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="requests-approvals" element={<RequestsApprovals />} />
          <Route path="reports-analytics" element={<ReportsAnalytics />} />
          <Route path="*" element={<Navigate to="/asset-inventory" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;