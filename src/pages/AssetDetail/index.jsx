import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import EditAssetForm from "./components/EditAssetForm";

const AssetDetail = ({
  assetDetails,
  assetCategories,
  assignmentHistory,
  maintenanceHistory,
  documents,
  loading,
  getAssetById,
  updateAssetDetails,
}) => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("specifications");
  const [showEditForm, setShowEditForm] = useState(false);

  // Get the current asset using the prop method or sample data if needed
  const asset = getAssetById(id) || getSampleAssetData(id);

  // Log asset details for debugging
  useEffect(() => {
    console.log("Asset Detail ID:", id);
    console.log("Asset Detail Data:", asset);
    console.log("Asset Categories:", assetCategories);
    console.log(
      "Assignment History:",
      assignmentHistory.filter((history) => history.deviceId === id)
    );
    console.log(
      "Maintenance History:",
      maintenanceHistory.filter((history) => history.deviceId === id)
    );
    console.log(
      "Documents:",
      documents.filter((doc) => doc.deviceId === id)
    );
  }, [
    id,
    asset,
    assetCategories,
    assignmentHistory,
    maintenanceHistory,
    documents,
  ]);

  // Sample data function for when the actual data is not available
  function getSampleAssetData(deviceId) {
    if (deviceId === "LAPTOP001") {
      return {
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
      };
    } else if (deviceId === "LAPTOP002") {
      return {
        deviceId: "LAPTOP002",
        assetTag: "LAPTOP002",
        itemId: "laptops",
        model: "MacBook Pro",
        serialNumber: "MP13567890",
        status: "Assigned",
        condition: "Excellent",
        purchaseDate: "2022-05-10",
        assignedTo: "Sarah Johnson",
        department: "Design",
        assignmentDate: "2022-05-15",
        expectedReturn: "2024-05-15",
        specs: "M1 Pro, 16GB RAM, 1TB SSD",
        vendor: "Apple",
        purchaseCost: 1800,
        warrantyExpiration: "2025-05-10",
        currentValue: 1500,
        lastUpdated: "2022-12-05",
        notes: "",
      };
    } else if (deviceId === "LAPTOP003") {
      return {
        deviceId: "LAPTOP003",
        assetTag: "LAPTOP003",
        itemId: "laptops",
        model: "Lenovo ThinkPad",
        serialNumber: "LT45678901",
        status: "In Storage",
        condition: "Good",
        purchaseDate: "2021-11-20",
        assignedTo: "",
        department: "",
        assignmentDate: "",
        expectedReturn: "",
        specs: "i5, 8GB RAM, 256GB SSD",
        vendor: "Lenovo",
        purchaseCost: 1100,
        warrantyExpiration: "2024-11-20",
        currentValue: 800,
        lastUpdated: "2023-02-18",
        notes: "Battery replaced in January 2023",
      };
    }
    return null;
  }

  // Get the asset category
  const assetCategory = asset?.itemId
    ? assetCategories.find((cat) => cat.id === asset.itemId) || {
        id: "laptops",
        name: "Laptops",
      }
    : { id: "laptops", name: "Laptops" };

  // Filter histories and documents based on current asset
  const currentAssignmentHistory = assignmentHistory.filter(
    (history) => history.deviceId === id
  );
  const currentMaintenanceHistory = maintenanceHistory.filter(
    (history) => history.deviceId === id
  );
  const currentDocuments = documents.filter((doc) => doc.deviceId === id);

  // Handle tab click
  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
  };

  // Toggle edit form
  const toggleEditForm = () => {
    setShowEditForm(!showEditForm);
  };

  // Breadcrumb component
  const Breadcrumb = () => (
    <div className="flex items-center text-sm mb-4">
      <Link
        to="/asset-inventory"
        className="text-gray-600 hover:text-blue-600 transition-colors"
      >
        Asset Management
      </Link>
      <span className="mx-2 text-gray-400">›</span>
      <Link
        to={`/asset-inventory/${assetCategory?.id || "laptops"}/table`}
        className="text-gray-600 hover:text-blue-600 transition-colors"
      >
        {assetCategory?.name || "Laptops"}
      </Link>
      <span className="mx-2 text-gray-400">›</span>
      <span className="text-gray-800 font-medium">{asset?.assetTag || id}</span>
    </div>
  );

  // Status indicator component
  const StatusIndicator = ({ status }) => {
    let bgColor = "bg-gray-400";

    if (status === "Assigned") bgColor = "bg-blue-500";
    else if (status === "In Repair") bgColor = "bg-yellow-500";
    else if (status === "In Storage") bgColor = "bg-green-500";

    return (
      <div className="flex items-center">
        <span
          className={`inline-block w-2 h-2 rounded-full mr-2 ${bgColor}`}
        ></span>
        <span>{status}</span>
      </div>
    );
  };

  // Document item component
  const DocumentItem = ({ document }) => (
    <div className="flex items-center p-4 border border-gray-200 rounded-lg mb-2 hover:shadow-md hover:border-blue-200 transition-all duration-200">
      <i className="pi pi-file-pdf text-gray-500 mr-3"></i>
      <div>
        <div className="font-medium">{document.filename}</div>
        <div className="text-sm text-gray-500">{document.uploadDate}</div>
      </div>
    </div>
  );

  // Filter documents based on active tab
  const getTabDocuments = () => {
    if (activeTab === "specifications") {
      return currentDocuments.filter(
        (doc) => doc.type === "specification" || !doc.type
      );
    } else if (activeTab === "assignmentHistory") {
      return currentDocuments.filter((doc) => doc.type === "assignment");
    } else if (activeTab === "maintenanceHistory") {
      return currentDocuments.filter((doc) => doc.type === "maintenance");
    }
    return [];
  };

  if (loading || !asset) {
    return (
      <div className="px-6 py-5 flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 mt-20">
      <Breadcrumb />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Asset Details</h1>
        <button
          onClick={toggleEditForm}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
        >
          <i className="pi pi-pencil mr-2"></i>
          Edit Asset
        </button>
      </div>

      {/* Edit Asset Form Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Asset</h3>
              <button
                onClick={toggleEditForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="pi pi-times"></i>
              </button>
            </div>
            <EditAssetForm
              asset={asset}
              onClose={toggleEditForm}
              onUpdateAsset={updateAssetDetails}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Status Overview Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Status Overview</h2>
          <div className="space-y-4">
            <StatusIndicator status={asset.status} />

            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">{asset.lastUpdated}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Condition</span>
              <span className="font-medium text-green-600">
                {asset.condition}
              </span>
            </div>
          </div>
        </div>

        {/* Basic Information Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Asset Tag</span>
              <span className="font-medium">{asset.assetTag}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Serial Number</span>
              <span className="font-medium">{asset.serialNumber}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{asset.model}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Purchase Date</span>
              <span className="font-medium">{asset.purchaseDate}</span>
            </div>
          </div>
        </div>

        {/* Current Assignment Card */}
        <div className="bg-white p-5 rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Current Assignment</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Assigned To</span>
              <span className="font-medium">
                {asset.assignedTo || "Unassigned"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-medium">{asset.department || "N/A"}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Assignment Date</span>
              <span className="font-medium">
                {asset.assignmentDate || "N/A"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Expected Return</span>
              <span className="font-medium">
                {asset.expectedReturn || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] transition-all duration-300 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "specifications"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
            onClick={() => handleTabClick("specifications")}
          >
            Specifications
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "assignmentHistory"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
            onClick={() => handleTabClick("assignmentHistory")}
          >
            Assignment History
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === "maintenanceHistory"
                ? "text-blue-600 border-b-2 border-blue-500"
                : "text-gray-500 hover:text-gray-700"
            } transition-colors`}
            onClick={() => handleTabClick("maintenanceHistory")}
          >
            Maintenance History
          </button>
        </div>

        <div className="p-6">
          {activeTab === "specifications" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Hardware Specifications
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Specifications</span>
                    <span className="font-medium">{asset.specs}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Purchase Information
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Vendor</span>
                    <span className="font-medium">{asset.vendor}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Purchase Cost</span>
                    <span className="font-medium">₹{asset.purchaseCost}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Warranty Until</span>
                    <span className="font-medium">
                      {asset.warrantyExpiration}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Current Value</span>
                    <span className="font-medium">₹{asset.currentValue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "assignmentHistory" && (
            <div>
              <DataTable
                value={currentAssignmentHistory}
                responsiveLayout="scroll"
                stripedRows
                className="p-datatable-sm"
              >
                <Column field="assignedTo" header="User" sortable />
                <Column field="department" header="Department" sortable />
                <Column
                  field="assignmentDate"
                  header="Assignment Date"
                  sortable
                />
                <Column field="returnDate" header="Return Date" sortable />
                <Column field="notes" header="Notes" />
              </DataTable>
            </div>
          )}

          {activeTab === "maintenanceHistory" && (
            <div>
              <DataTable
                value={currentMaintenanceHistory}
                responsiveLayout="scroll"
                stripedRows
                className="p-datatable-sm"
              >
                <Column
                  field="maintenanceType"
                  header="Service Type"
                  sortable
                />
                <Column field="technician" header="Service Provider" sortable />
                <Column field="maintenanceDate" header="Date" sortable />
                <Column
                  field="completedDate"
                  header="Completed Date"
                  sortable
                />
                <Column
                  field="cost"
                  header="Cost"
                  sortable
                  body={(rowData) => `₹${rowData.cost}`}
                />
                <Column field="notes" header="Notes" />
              </DataTable>
            </div>
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] transition-all duration-300 mt-6">
        <h3 className="px-6 py-3 text-lg font-semibold border-b border-gray-200">
          Documents
        </h3>
        <div className="p-6">
          {getTabDocuments().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getTabDocuments().map((doc, index) => (
                <DocumentItem key={index} document={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No documents found for this {activeTab.replace("History", "")}.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to={`/asset-inventory/${assetCategory?.id || "laptops"}/table`}
          className="flex items-center px-4 py-2 mr-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
        >
          <i className="pi pi-list mr-2"></i>
          View All Units
        </Link>
        <Link
          to="/asset-inventory"
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
        >
          <i className="pi pi-arrow-left mr-2"></i>
          Return to Inventory
        </Link>
      </div>
    </div>
  );
};

export default AssetDetail;
