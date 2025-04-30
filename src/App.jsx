import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
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
import EmployeeAssets from "./pages/EmployeeAssets/index.jsx";
import EmployeeDetails from "./pages/EmployeeDetails/index.jsx";
import logger from "./utils/logger.jsx";

// Utility to validate MongoDB ObjectId
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Route guard to validate assetId
const RouteGuard = ({ children }) => {
  const { categoryId, assetId } = useParams();
  if (!categoryId || !assetId || !isValidObjectId(assetId)) {
    logger.error("Invalid or missing URL parameters", {
      categoryId,
      assetId,
      url: window.location.href,
    });
    return <Navigate to="/asset-inventory" replace />;
  }
  return children;
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
            <Route
              path=":categoryId/:assetId"
              element={
                <RouteGuard>
                  <AssetDetail />
                </RouteGuard>
              }
            />
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
