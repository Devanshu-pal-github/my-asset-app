import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AssetInventory from "./pages/AssetInventory/index";
import AssetDetail from "./pages/AssetDetail/index";
import AssetTablePage from "./pages/AssetTable/index";
import BulkUploadPage from "./pages/AssetTable/components/BulkUploadPage";
import AddItemPage from "./pages/AssetTable/components/AddItemPage";
import AddAssetForm from "./pages/AssetInventory/components/AddAssetForm";

function App() {
  const [assetCategories, setAssetCategories] = useState([]);
  const [assetItems, setAssetItems] = useState([]);
  const [assetDetails, setAssetDetails] = useState([]);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const categories = [
        {
          id: "laptops",
          name: "Laptops",
          category: "Hardware",
          icon: "pi pi-desktop",
          count: 45,
          value: 67500,
          policies: [
            {
              id: 1,
              name: "Laptop Usage Policy",
              description: "Guidelines for proper usage of company laptops",
            },
            {
              id: 2,
              name: "Software Installation Policy",
              description: "Rules regarding installation of software on company laptops",
            },
            {
              id: 3,
              name: "Remote Work Policy",
              description: "Policies for using company laptops while working remotely",
            },
          ],
        },
        {
          id: "mobile",
          name: "Mobile Devices",
          category: "Hardware",
          icon: "pi pi-mobile",
          count: 32,
          value: 38400,
          policies: [
            {
              id: 1,
              name: "Mobile Device Usage Policy",
              description: "Guidelines for proper usage of company mobile devices",
            },
            {
              id: 2,
              name: "Data Security Policy",
              description: "Rules for securing company data on mobile devices",
            },
          ],
        },
      ];

      const items = [
        {
          deviceId: "LAPTOP001",
          serialNumber: "DX15987654",
          assignedTo: "John Smith",
          department: "Engineering",
          assignmentDate: "2022-03-20",
          specs: "i7, 16GB RAM, 512GB SSD",
          status: "In Use",
          categoryId: "laptops",
        },
      ];

      const details = [
        {
          deviceId: "LAPTOP001",
          assetTag: "LAPTOP001",
          itemId: "laptops",
          model: "Dell XPS 15",
          serialNumber: "DX15987654",
          status: "Assigned",
          condition: "Good",
          purchaseDate: "2022-03-15",
          assignedTo: "John Smith",
          department: "Engineering",
          assignmentDate: "2022-03-20",
          expectedReturn: "2024-03-20",
          specs: "i7, 16GB RAM, 512GB SSD",
          vendor: "Dell",
          purchaseCost: 1500,
          warrantyExpiration: "2025-03-15",
          currentValue: 1200,
          lastUpdated: "2023-01-10",
          notes: "Minor scratch on lid",
          policies: [
            {
              id: 1,
              name: "Laptop Usage Policy",
              description: "Guidelines for proper usage of company laptops",
            },
            {
              id: 2,
              name: "Data Security Policy",
              description: "Rules for securing company data on laptops",
            },
          ],
        },
      ];

      const assignmentHist = [
        {
          id: 1,
          deviceId: "LAPTOP001",
          assignedTo: "John Smith",
          department: "Engineering",
          assignmentDate: "2022-03-20",
          returnDate: "",
          notes: "Primary work laptop",
        },
      ];

      const maintenanceHist = [];

      const docs = [
        {
          id: 1,
          deviceId: "LAPTOP001",
          filename: "warranty_laptop001.pdf",
          fileType: "Warranty",
          uploadDate: "2022-03-15",
          uploadedBy: "System Admin",
        },
      ];

      setAssetCategories(categories);
      setAssetItems(items);
      setAssetDetails(details);
      setAssignmentHistory(assignmentHist);
      setMaintenanceHistory(maintenanceHist);
      setDocuments(docs);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const addAssetCategory = (newCategory) => {
    setAssetCategories([...assetCategories, newCategory]);
  };

  const deleteAssetCategory = (categoryId) => {
    setAssetCategories(assetCategories.filter((cat) => cat.id !== categoryId));
    setAssetItems(assetItems.filter((item) => item.categoryId !== categoryId));
    setAssetDetails(assetDetails.filter((detail) => detail.itemId !== categoryId));
  };

  const addAssetItem = (newItem) => {
    setAssetItems((prevItems) => [...prevItems, newItem]);
    setAssetDetails((prevDetails) => [
      ...prevDetails,
      {
        ...newItem,
        assetTag: newItem.assetTag || newItem.deviceId,
        itemId: newItem.categoryId,
        currentValue: newItem.currentValue || newItem.purchaseCost || 0,
        notes: newItem.notes || "",
        policies: [
          {
            id: 1,
            name: "Default Usage Policy",
            description: "Guidelines for proper usage",
          },
        ],
      },
    ]);
  };

  const getAssetById = (id) => assetDetails.find((asset) => asset.deviceId === id) || null;

  const updateAssetDetails = (updatedAsset) => {
    setAssetDetails(
      assetDetails.map((asset) =>
        asset.deviceId === updatedAsset.deviceId ? updatedAsset : asset
      )
    );
    setAssetItems(
      assetItems.map((item) =>
        item.deviceId === updatedAsset.deviceId
          ? { ...item, ...updatedAsset }
          : item
      )
    );
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/asset-inventory" replace />} />
          <Route path="asset-inventory">
            <Route
              index
              element={
                <AssetInventory
                  assets={assetCategories}
                  loading={loading}
                  addAssetCategory={addAssetCategory}
                  deleteAssetCategory={deleteAssetCategory}
                  updateAssetDetails={updateAssetDetails}
                />
              }
            />
            <Route
              path=":id"
              element={
                <AssetDetail
                  assetDetails={assetDetails}
                  assetCategories={assetCategories}
                  assignmentHistory={assignmentHistory}
                  maintenanceHistory={maintenanceHistory}
                  documents={documents}
                  loading={loading}
                  getAssetById={getAssetById}
                  updateAssetDetails={updateAssetDetails}
                />
              }
            />
            <Route
              path=":id/table"
              element={
                <AssetTablePage
                  assetItems={assetItems}
                  assetCategories={assetCategories}
                  loading={loading}
                  addAssetItem={addAssetItem}
                />
              }
            />
            <Route
              path=":id/bulk-upload"
              element={
                <BulkUploadPage
                  addAssetItem={addAssetItem}
                  assetCategories={assetCategories}
                />
              }
            />
            <Route
              path=":id/add-item"
              element={
                <AddItemPage
                  addAssetItem={addAssetItem}
                  assetCategories={assetCategories}
                />
              }
            />
            <Route
              path="add-category"
              element={
                <AddAssetForm
                  onClose={() => (window.location.href = "/asset-inventory")}
                  onAddAsset={addAssetCategory}
                />
              }
            />
          </Route>
          <Route
            path="dashboard"
            element={<Navigate to="/asset-inventory" replace />}
          />
          <Route
            path="employee-assets"
            element={<Navigate to="/asset-inventory" replace />}
          />
          <Route
            path="requests"
            element={<Navigate to="/asset-inventory" replace />}
          />
          <Route
            path="maintenance"
            element={<Navigate to="/asset-inventory" replace />}
          />
          <Route
            path="reports"
            element={<Navigate to="/asset-inventory" replace />}
          />
          <Route
            path="settings"
            element={<Navigate to="/asset-inventory" replace />}
          />
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