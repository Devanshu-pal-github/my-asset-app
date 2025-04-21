import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import axios from "axios";
import EditAssetForm from "../AssetInventory/components/EditAssetForm";
import {
  fetchAssetItemById,
  updateAssetItem,
  clearCurrentItem,
} from "../../store/slices/assetItemSlice";
import {
  fetchAssignmentHistory,
  clearAssignmentHistory,
} from "../../store/slices/assignmentHistorySlice";
import {
  fetchMaintenanceHistory,
  clearMaintenanceHistory,
} from "../../store/slices/maintenanceHistorySlice";
import {
  fetchDocuments,
  clearDocuments,
} from "../../store/slices/documentSlice";
import logger from "../../utils/logger";

// Constants
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";
const TABS = {
  SPECIFICATIONS: "specifications",
  ASSIGNMENT_HISTORY: "assignmentHistory",
  MAINTENANCE_HISTORY: "maintenanceHistory",
};
const axiosInstance = axios.create({ timeout: 15000 });

// Utility Functions
const formatDate = (date) => {
  if (!date) return "N/A";
  return new Date(date).toISOString().split("T")[0];
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return "N/A";
  return `₹${Number(amount).toLocaleString("en-IN")}`;
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`;
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-500 p-6">
          <p>
            Error rendering content:{" "}
            {this.state.error?.message || "Unknown error"}
          </p>
          <p>Please try refreshing the page or contact support.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Components
const Breadcrumb = ({ assetData, categoryId }) => (
  <div className="flex items-center text-sm mb-4">
    <Link
      to="/asset-inventory"
      className="text-gray-600 hover:text-blue-600 transition-colors"
    >
      Asset Management
    </Link>
    <span className="mx-2 text-gray-400">›</span>
    <Link
      to={`/asset-inventory/${categoryId}`}
      className="text-gray-600 hover:text-blue-600 transition-colors"
    >
      {assetData.categoryName}
    </Link>
    <span className="mx-2 text-gray-400">›</span>
    <span className="text-gray-800 font-medium">{assetData.assetTag}</span>
  </div>
);

const StatusIndicator = ({ status }) => {
  const statusStyles = {
    "In Use": "bg-blue-500",
    "Under Maintenance": "bg-yellow-500",
    Available: "bg-green-500",
    Retired: "bg-red-500",
    Lost: "bg-red-500",
  };
  const bgColor = statusStyles[status] || "bg-gray-400";

  return (
    <div className="flex items-center">
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${bgColor}`} />
      <span>{status}</span>
    </div>
  );
};

const AssetInfoCard = ({ title, data }) => (
  <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
    <h2 className="text-lg font-semibold mb-4">{title}</h2>
    <div className="space-y-4">
      {data.map(({ label, value, className }) => (
        <div key={label} className="flex justify-between">
          <span className="text-gray-600">{label}</span>
          <span className={`font-medium ${className || ""}`}>
            {React.isValidElement(value) ? value : String(value)}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const TabNavigation = ({ activeTab, onTabChange }) => (
  <div className="flex border-b border-gray-200">
    {Object.values(TABS).map((tab) => (
      <button
        key={tab}
        className={`px-4 py-3 text-sm font-medium ${
          activeTab === tab
            ? "text-blue-600 border-b-2 border-blue-500"
            : "text-gray-600 hover:text-blue-600"
        } transition-colors`}
        onClick={() => onTabChange(tab)}
      >
        {tab.replace(/([A-Z])/g, " $1").trim()}
      </button>
    ))}
  </div>
);

const SpecificationsTab = ({ assetData }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
    <div>
      <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Specifications</span>
          <span className="font-medium">{assetData.specifications}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Notes</span>
          <span className="font-medium">{assetData.notes}</span>
        </div>
      </div>
    </div>
    <div>
      <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
      <div className="space-y-4">
        {[
          { label: "Vendor", value: assetData.vendor },
          { label: "Purchase Cost", value: assetData.purchaseCost },
          { label: "Purchase Date", value: assetData.purchaseDate },
          { label: "Warranty Until", value: assetData.warrantyExpiration },
          { label: "Current Value", value: assetData.currentValue },
          { label: "Insurance Policy", value: assetData.insurancePolicy },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="flex justify-between items-center pb-2 border-b border-gray-100"
          >
            <span className="text-gray-600">{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AssignmentHistoryTab = ({
  history,
  loading,
  error,
  currentAssigneeName,
  currentAssigneeId,
}) => {
  if (loading)
    return <p className="text-gray-600">Loading assignment history...</p>;
  if (error)
    return (
      <p className="text-red-500">
        {error.includes("404")
          ? "No assignment history found"
          : "Failed to fetch assignment history"}
      </p>
    );
  if (!history || history.length === 0)
    return <p className="text-gray-500">No assignment history available</p>;

  return (
    <DataTable
      value={history}
      responsiveLayout="scroll"
      stripedRows
      className="p-datatable-sm"
    >
      <Column
        field="assigned_to"
        header="Assignee"
        sortable
        body={(rowData) => (
          <span>
            {rowData.assigned_to === currentAssigneeId
              ? currentAssigneeName
              : rowData.assigned_to || "Unknown"}
          </span>
        )}
      />
      <Column
        field="department"
        header="Department"
        sortable
        body={(rowData) => rowData.department || "N/A"}
      />
      <Column
        field="condition"
        header="Condition"
        sortable
        body={(rowData) => rowData.condition || "N/A"}
      />
      <Column
        field="assignment_date"
        header="Assignment Date"
        sortable
        body={(rowData) => formatDate(rowData.assignment_date)}
      />
      <Column
        field="return_date"
        header="Return Date"
        sortable
        body={(rowData) => formatDate(rowData.return_date)}
      />
      <Column
        field="is_active"
        header="Active"
        sortable
        body={(rowData) => (rowData.is_active ? "Yes" : "No")}
      />
      <Column
        field="notes"
        header="Notes"
        body={(rowData) => rowData.notes || "N/A"}
      />
    </DataTable>
  );
};

const MaintenanceHistoryTab = ({ history, loading, error }) => {
  if (loading)
    return <p className="text-gray-600">Loading maintenance history...</p>;
  if (error)
    return (
      <p className="text-red-500">
        {error.includes("404")
          ? "No maintenance history found"
          : "Failed to fetch maintenance history"}
      </p>
    );
  if (!history || history.length === 0)
    return <p className="text-gray-500">No maintenance history available</p>;

  return (
    <DataTable
      value={history}
      responsiveLayout="scroll"
      stripedRows
      className="p-datatable-sm"
    >
      <Column
        field="maintenance_type"
        header="Service Type"
        sortable
        body={(rowData) => rowData.maintenance_type || "N/A"}
      />
      <Column
        field="technician"
        header="Technician"
        sortable
        body={(rowData) => rowData.technician || "N/A"}
      />
      <Column
        field="condition_before"
        header="Condition Before"
        sortable
        body={(rowData) => rowData.condition_before || "N/A"}
      />
      <Column
        field="condition_after"
        header="Condition After"
        sortable
        body={(rowData) => rowData.condition_after || "N/A"}
      />
      <Column
        field="maintenance_date"
        header="Maintenance Date"
        sortable
        body={(rowData) => formatDate(rowData.maintenance_date)}
      />
      <Column
        field="completed_date"
        header="Completed Date"
        sortable
        body={(rowData) => formatDate(rowData.completed_date)}
      />
      <Column
        field="cost"
        header="Cost"
        sortable
        body={(rowData) => formatCurrency(rowData.cost)}
      />
      <Column
        field="is_completed"
        header="Completed"
        sortable
        body={(rowData) => (rowData.is_completed ? "Yes" : "No")}
      />
      <Column
        field="notes"
        header="Notes"
        body={(rowData) => rowData.notes || "N/A"}
      />
    </DataTable>
  );
};

const DocumentList = ({ assetId }) => {
  const { documents, loading, error } = useSelector((state) => state.documents);

  useEffect(() => {
    logger

.debug("DocumentList useEffect", { assetId, documents });
  }, [assetId, documents]);

  if (loading) return <p>Loading documents...</p>;
  if (error)
    return (
      <div className="text-red-500">
        <p>
          {error.includes("404") ? "No documents found" : `Error: ${error}`}
        </p>
        <Button
          label="Retry"
          icon="pi pi-refresh"
          className="p-button-sm p-button-outlined mt-2"
          onClick={() => dispatch(fetchDocuments(assetId))}
        />
      </div>
    );

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Documents</h3>
      {documents.length > 0 ? (
        documents.map((doc) => (
          <div key={doc.id} className="p-4 border rounded-lg mb-2">
            <p>
              <strong>{doc.filename}</strong>
            </p>
            <p>
              Type: {doc.type} | Uploaded: {formatDate(doc.upload_date)}
            </p>
            <Button
              label="View"
              icon="pi pi-eye"
              className="p-button-sm p-button-outlined"
              onClick={() =>
                window.open(`${API_URL}${doc.file_path}`, "_blank")
              }
            />
          </div>
        ))
      ) : (
        <p className="text-gray-500">No documents found.</p>
      )}
    </div>
  );
};

// Main Component
const AssetDetail = () => {
  const { categoryId, assetId } = useParams();
  const dispatch = useDispatch();
  const {
    currentItem: asset,
    loading: assetLoading,
    error: assetError,
  } = useSelector((state) => state.assetItems);
  const { categories } = useSelector((state) => state.assetCategories);
  const {
    history: assignmentHistory,
    loading: assignmentLoading,
    error: assignmentError,
  } = useSelector((state) => state.assignmentHistory);
  const {
    history: maintenanceHistory,
    loading: maintenanceLoading,
    error: maintenanceError,
  } = useSelector((state) => state.maintenanceHistory);
  const [activeTab, setActiveTab] = useState(TABS.SPECIFICATIONS);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentAssigneeName, setCurrentAssigneeName] = useState("Unassigned");

  useEffect(() => {
    logger.debug("AssetDetail useEffect triggered", {
      categoryId,
      assetId,
      asset,
    });
    if (assetId && categoryId) {
      logger.info("Dispatching fetchAssetItemById", { assetId });
      dispatch(fetchAssetItemById(assetId))
        .unwrap()
        .then((result) => {
          logger.info("Successfully fetched asset item", { assetId, result });
        })
        .catch((err) => {
          logger.error("Failed to fetch asset item", {
            error: err.message,
            assetId,
          });
        });
      dispatch(fetchDocuments(assetId))
        .unwrap()
        .then(() => logger.info("Successfully fetched documents", { assetId }))
        .catch((err) =>
          logger.error("Failed to fetch documents", { error: err.message })
        );
    }
    return () => {
      dispatch(clearCurrentItem());
      dispatch(clearAssignmentHistory());
      dispatch(clearMaintenanceHistory());
      dispatch(clearDocuments());
      logger.debug("Cleared all state on unmount");
    };
  }, [dispatch, assetId, categoryId]);

  useEffect(() => {
    logger.debug("AssetLoading state", { assetLoading, assetId, asset });
    if (assetLoading) {
      logger.info("AssetDetail is loading", { assetId });
    }
  }, [assetLoading, assetId]);

  useEffect(() => {
    const fetchEmployeeName = async (employeeId) => {
      logger.debug("Fetching employee name", { employeeId });
      try {
        const response = await axiosInstance.get(
          `${API_URL}/employees/${employeeId}`
        );
        if (!response.data) throw new Error("No employee data returned");
        const { first_name, last_name } = response.data;
        const fullName = `${first_name} ${last_name}`;
        setCurrentAssigneeName(fullName);
        logger.info("Successfully fetched employee name", {
          employeeId,
          fullName,
        });
      } catch (error) {
        logger.error("Failed to fetch employee name", { error: error.message });
        setCurrentAssigneeName("Unknown");
      }
    };

    // Handle array or string for current_assignee_id
    const assigneeId = Array.isArray(asset?.current_assignee_id)
      ? asset.current_assignee_id[0]
      : asset?.current_assignee_id;

    if (assigneeId) {
      fetchEmployeeName(assigneeId);
    } else {
      setCurrentAssigneeName("Unassigned");
      logger.debug(
        "No current_assignee_id, setting currentAssigneeName to Unassigned"
      );
    }
  }, [asset?.current_assignee_id]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    logger.debug("Switched tab", { tab });
    if (tab === TABS.ASSIGNMENT_HISTORY) {
      dispatch(fetchAssignmentHistory(assetId))
        .unwrap()
        .then(() =>
          logger.info("Successfully fetched assignment history", { assetId })
        )
        .catch((err) =>
          logger.error("Failed to fetch assignment history", {
            error: err.message,
          })
        );
    } else if (tab === TABS.MAINTENANCE_HISTORY) {
      dispatch(fetchMaintenanceHistory(assetId))
        .unwrap()
        .then(() =>
          logger.info("Successfully fetched maintenance history", { assetId })
        )
        .catch((err) =>
          logger.error("Failed to fetch maintenance history", {
            error: err.message,
          })
        );
    }
  };

  const toggleEditForm = () => {
    setShowEditForm((prev) => !prev);
    logger.debug("Toggled edit form", { showEditForm: !showEditForm });
  };

  const updateAssetDetails = (updatedData) => {
    logger.debug("Updating asset details", { assetId, updatedData });
    dispatch(updateAssetItem({ id: assetId, itemData: updatedData }))
      .unwrap()
      .then(() => {
        logger.info("Successfully updated asset", { assetId });
        toggleEditForm();
      })
      .catch((err) =>
        logger.error("Failed to update asset", { error: err.message })
      );
  };

  const handleAssign = () => {
    logger.info("Assign button clicked", { assetId });
    // Placeholder for assign logic
  };

  const handleUnassign = () => {
    logger.info("Unassign button clicked", { assetId });
    // Placeholder for unassign logic
  };

  const handleLogMaintenance = () => {
    logger.info("Log maintenance button clicked", { assetId });
    // Placeholder for maintenance log logic
  };

  if (!categoryId || !assetId) {
    logger.error("Missing URL parameters", {
      categoryId,
      assetId,
      url: window.location.href,
    });
    return <Navigate to="/asset-inventory" replace />;
  }

  if (assetLoading) {
    return (
      <div className="px-6 py-5 flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3" />
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (assetError || !asset) {
    logger.error("AssetDetail error or no asset found", {
      assetError,
      assetId,
      asset,
    });
    return (
      <div className="px-6 py-5 text-red-500">
        Error: {assetError || "Asset not found or data not loaded"}
        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            <i className="pi pi-arrow-left mr-2" />
            Return to Asset Inventory
          </Link>
        </div>
      </div>
    );
  }

  const assetCategory = categories.find(
    (cat) => cat.id === asset.category_id
  ) || {
    id: asset.category_id,
    name: "Unknown",
  };

  const assetData = {
    assetId: asset.id,
    assetTag: asset.asset_tag || "N/A",
    categoryId: asset.category_id || "N/A",
    categoryName: assetCategory.name,
    assetName: asset.name || "N/A",
    serialNumber: asset.serial_number || "N/A",
    status: asset.status || "N/A",
    isOperational: asset.is_operational ? "Operational" : "Non-Operational",
    condition: asset.condition || "N/A",
    createdAt: formatDate(asset.created_at),
    lastUpdated: formatDate(asset.updated_at),
    currentAssigneeId: Array.isArray(asset.current_assignee_id)
      ? asset.current_assignee_id[0]
      : asset.current_assignee_id || "",
    currentAssigneeName,
    hasActiveAssignment: asset.has_active_assignment
      ? "Assigned"
      : "Not Assigned",
    department: asset.department || "N/A",
    location: asset.location || "N/A",
    specifications: asset.specifications
      ? Object.entries(asset.specifications)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ")
      : "N/A",
    vendor: asset.vendor || "N/A",
    purchaseCost: formatCurrency(asset.purchase_cost),
    purchaseDate: formatDate(asset.purchase_date),
    warrantyExpiration: formatDate(asset.warranty_expiration),
    currentValue: formatCurrency(asset.current_value),
    notes: asset.notes || "N/A",
    insurancePolicy: asset.insurance_policy || "N/A",
    disposalDate: formatDate(asset.disposal_date),
    currentAssignmentDate: formatDate(asset.current_assignment_date),
  };

  return (
    <div className="px-6 py-5 mt-20">
      <Breadcrumb assetData={assetData} categoryId={assetCategory.id} />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Asset Details</h1>
        <Button
          label="Edit Asset"
          icon="pi pi-pencil"
          className="p-button-sm p-button-indigo"
          onClick={toggleEditForm}
        />
      </div>

      {showEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Asset</h3>
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-plain"
                onClick={toggleEditForm}
              />
            </div>
            <EditAssetForm
              asset={assetData}
              onClose={toggleEditForm}
              onUpdateAsset={updateAssetDetails}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <AssetInfoCard
          title="Asset Status"
          data={[
            {
              label: "Status",
              value: <StatusIndicator status={assetData.status} />,
            },
            {
              label: "Condition",
              value: assetData.condition,
              className: "text-green-600",
            },
            { label: "Operational", value: assetData.isOperational },
            { label: "Last Updated", value: assetData.lastUpdated },
          ]}
        />
        <AssetInfoCard
          title="Asset Information"
          data={[
            { label: "Asset Name", value: assetData.assetName },
            { label: "Asset Tag", value: assetData.assetTag },
            { label: "Serial Number", value: assetData.serialNumber },
            { label: "Category", value: assetData.categoryName },
            { label: "Created At", value: assetData.createdAt },
          ]}
        />
        <AssetInfoCard
          title="Assignment Details"
          data={[
            { label: "Current Assignee", value: assetData.currentAssigneeName },
            { label: "Department", value: assetData.department },
            { label: "Location", value: assetData.location },
            {
              label: "Assignment Status",
              value: assetData.hasActiveAssignment,
            },
            {
              label: "Assignment Date",
              value: assetData.currentAssignmentDate,
            },
          ]}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 mb-6">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <ErrorBoundary>
          <div className="p-6">
            {activeTab === TABS.SPECIFICATIONS && (
              <>
                <div className="flex justify-end mb-4">
                  <Button
                    label="Edit"
                    icon="pi pi-pencil"
                    className="p-button-sm p-button-indigo"
                    onClick={toggleEditForm}
                  />
                </div>
                <SpecificationsTab assetData={assetData} />
              </>
            )}
            {activeTab === TABS.ASSIGNMENT_HISTORY && (
              <>
                <div className="flex justify-end mb-4 space-x-2">
                  <Button
                    label="Assign"
                    icon="pi pi-user-plus"
                    className="p-button-sm p-button-success"
                    onClick={handleAssign}
                  />
                  <Button
                    label="Unassign"
                    icon="pi pi-user-minus"
                    className="p-button-sm p-button-warning"
                    onClick={handleUnassign}
                  />
                </div>
                <AssignmentHistoryTab
                  history={assignmentHistory}
                  loading={assignmentLoading}
                  error={assignmentError}
                  currentAssigneeName={assetData.currentAssigneeName}
                  currentAssigneeId={assetData.currentAssigneeId}
                />
              </>
            )}
            {activeTab === TABS.MAINTENANCE_HISTORY && (
              <>
                <div className="flex justify-end mb-4">
                  <Button
                    label="Log"
                    icon="pi pi-file-edit"
                    className="p-button-sm p-button-info"
                    onClick={handleLogMaintenance}
                  />
                </div>
                <MaintenanceHistoryTab
                  history={maintenanceHistory}
                  loading={maintenanceLoading}
                  error={maintenanceError}
                />
              </>
            )}
          </div>
        </ErrorBoundary>
      </div>

      <DocumentList assetId={assetId} />

      <div className="mt-6 flex justify-end space-x-2">
        <Link to={`/asset-inventory/${assetCategory.id}`}>
          <Button
            label="View All Units"
            icon="pi pi-list"
            className="p-button-sm p-button-primary"
          />
        </Link>
        <Link to="/asset-inventory">
          <Button
            label="Return to Inventory"
            icon="pi pi-arrow-left"
            className="p-button-sm p-button-outlined"
          />
        </Link>
      </div>
    </div>
  );
};

export default AssetDetail;