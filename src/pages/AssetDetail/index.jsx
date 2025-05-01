import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import EditAssetForm from "./components/EditAssetForm";
import EditAssetSpecsAndFinanceForm from "./components/EditAssetSpecsAndFinanceForm";
import EmployeeAssignment from "./components/EmployeeAssignment";
import EmployeeUnassignment from "./components/EmployeeUnassignment";
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
const axiosInstance = axios.create({ timeout: 30000 });

// Utility Functions
const formatDate = (date) =>
  date ? new Date(date).toISOString().split("T")[0] : "N/A";
const formatCurrency = (amount) =>
  amount || amount === 0
    ? Number(amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      })
    : "N/A";
const formatFileSize = (bytes) =>
  bytes || bytes === 0
    ? `${(bytes / 1024 ** Math.floor(Math.log(bytes) / Math.log(1024))).toFixed(
        2
      )} ${
        ["B", "KB", "MB", "GB"][Math.floor(Math.log(bytes) / Math.log(1024))]
      }`
    : "N/A";
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

// Error Boundary Component
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const errorHandler = (error) => {
      setHasError(true);
      setError(error);
    };
    window.addEventListener("error", errorHandler);
    return () => window.removeEventListener("error", errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="text-red-500 p-6">
        <p>Error rendering content: {error?.message || "Unknown error"}</p>
        <p>Please try refreshing the page or contact support.</p>
      </div>
    );
  }
  return children;
};

// Components
const Breadcrumb = ({ assetData, categoryId }) => (
  <div className="flex items-center text-sm mb-4">
    <Link
      to="/asset-inventory"
      className="flex items-center text-gray-600 hover:text-blue-600 transition-colors"
    >
      <i className="pi pi-arrow-left mr-2"></i>Asset Management
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
    assigned: "bg-blue-500",
    under_maintenance: "bg-yellow-500",
    available: "bg-green-500",
    retired: "bg-red-500",
    lost: "bg-red-500",
  };
  const bgColor = statusStyles[status] || "bg-gray-400";
  return (
    <div className="flex items-center">
      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${bgColor}`} />
      <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
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

const SpecificationsTab = ({ assetData, onEdit }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
    <div>
      <h3 className="text-lg font-semibold mb-4">Technical Specifications</h3>
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Specifications</span>
          <span className="font-medium">{assetData.specifications}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Model</span>
          <span className="font-medium">{assetData.model}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Notes</span>
          <span className="font-medium">{assetData.notes}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Maintenance Due Date</span>
          <span className="font-medium">{assetData.maintenanceDueDate}</span>
        </div>
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <span className="text-gray-600">Disposal Date</span>
          <span className="font-medium">{assetData.disposalDate}</span>
        </div>
      </div>
    </div>
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={onEdit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Edit
        </button>
      </div>
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
  onAssign,
  onUnassign,
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
    <div className="w-full overflow-x-hidden">
      <div className="flex justify-end mb-4 space-x-2">
        <button
          onClick={onAssign}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Assign
        </button>
        <button
          onClick={onUnassign}
          className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
        >
          Unassign
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full max-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Assignee
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Entity Type
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Department
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Condition
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Assignment Date
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Return Date
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Active
              </th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-1/6">
                Notes
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map((rowData) => (
              <tr key={rowData.id}>
                <td className="px-4 py-2 whitespace-nowrap">
                  {rowData.assigned_to.includes(currentAssigneeId)
                    ? currentAssigneeName
                    : rowData.assigned_to || "Unknown"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {rowData.entity_type || "N/A"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {rowData.department || "N/A"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {rowData.condition_at_assignment || "N/A"}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDate(rowData.assigned_at)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {formatDate(rowData.unassigned_at)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {rowData.is_active ? "Yes" : "No"}
                </td>
                <td className="px-4 py-2">{rowData.notes || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MaintenanceHistoryTab = ({
  history,
  loading,
  error,
  onLogMaintenance,
}) => {
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
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={onLogMaintenance}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Log Maintenance
        </button>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Service Type
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Technician
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Condition Before
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Condition After
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Maintenance Date
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Completed Date
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Cost
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Completed
            </th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
              Notes
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {history.map((rowData) => (
            <tr key={rowData.id}>
              <td className="px-4 py-2 whitespace-nowrap">
                {rowData.maintenance_type || "N/A"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {rowData.technician || "N/A"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {rowData.condition_before || "N/A"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {rowData.condition_after || "N/A"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {formatDate(rowData.maintenance_date)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {formatDate(rowData.completed_date)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {formatCurrency(rowData.cost)}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {rowData.status === "completed" ? "Yes" : "No"}
              </td>
              <td className="px-4 py-2 whitespace-nowrap">
                {rowData.notes || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const DocumentList = ({ assetId }) => {
  const { documents, loading, error } = useSelector((state) => state.documents);
  useEffect(
    () => logger.debug("DocumentList useEffect", { assetId, documents }),
    [assetId, documents]
  );
  if (loading) return <p>Loading documents...</p>;
  if (error)
    return (
      <div className="text-red-500">
        <p>
          {error.includes("404") ? "No documents found" : `Error: ${error}`}
        </p>
        <button
          onClick={() => dispatch(fetchDocuments(assetId))}
          className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Documents</h3>
      {documents.length > 0 ? (
        documents.map((doc) => (
          <div key={doc.id} className="p-4 border rounded-lg mb-2">
            <p>
              <strong>{doc.file_url.split("/").pop()}</strong>
            </p>
            <p>
              Type: {doc.document_type} | Uploaded: {formatDate(doc.created_at)}{" "}
              | Size: {formatFileSize(doc.file_size)}
            </p>
            <button
              onClick={() => window.open(`${API_URL}${doc.file_url}`, "_blank")}
              className="mt-2 px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              View
            </button>
          </div>
        ))
      ) : (
        <p className="text-gray-500">No documents found.</p>
      )}
    </div>
  );
};

const AssetDetail = () => {
  const { assetId } = useParams();
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
  const [showBasicEditForm, setShowBasicEditForm] = useState(false);
  const [showSpecsFinanceEditForm, setShowSpecsFinanceEditForm] =
    useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [currentAssigneeName, setCurrentAssigneeName] = useState("Unassigned");

  const memoizedAsset = useMemo(() => asset, [asset]);

  logger.debug("AssetDetail rendering", {
    assetId,
    asset: memoizedAsset,
    assetError,
  });

  // Only redirect if assetId is completely missing
  if (!assetId) {
    logger.error("Missing assetId in AssetDetail", {
      url: window.location.href,
    });
    return <Navigate to="/asset-inventory" replace />;
  }

  // Handle invalid ObjectId gracefully
  if (!isValidObjectId(assetId)) {
    logger.warn("Using fallback assetId, not a valid ObjectId", { assetId });
    // Proceed with rendering, fetch will likely fail but we handle it below
  }

  useEffect(() => {
    logger.debug("AssetDetail useEffect triggered", {
      assetId,
      asset: memoizedAsset,
    });
    dispatch(fetchAssetItemById(assetId))
      .unwrap()
      .then((result) =>
        logger.info("Successfully fetched asset item", { assetId, result })
      )
      .catch((err) =>
        logger.error("Failed to fetch asset item", {
          error: err.message,
          assetId,
        })
      );
    dispatch(fetchDocuments(assetId))
      .unwrap()
      .then(() => logger.info("Successfully fetched documents", { assetId }))
      .catch((err) =>
        logger.error("Failed to fetch documents", { error: err.message })
      );
    return () => {
      dispatch(clearCurrentItem());
      dispatch(clearAssignmentHistory());
      dispatch(clearMaintenanceHistory());
      dispatch(clearDocuments());
      logger.debug("Cleared all state on unmount");
    };
  }, [dispatch, assetId]);

  useEffect(() => {
    logger.debug("AssetLoading state", {
      assetLoading,
      assetId,
      asset: memoizedAsset,
    });
    if (assetLoading) logger.info("AssetDetail is loading", { assetId });
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
    const assigneeId = memoizedAsset?.current_assignee_id;
    if (assigneeId) fetchEmployeeName(assigneeId);
    else {
      setCurrentAssigneeName("Unassigned");
      logger.debug(
        "No current_assignee_id, setting currentAssigneeName to Unassigned"
      );
    }
  }, [memoizedAsset?.current_assignee_id]);

  const assignmentCategoryId = memoizedAsset?.category_id;
  if (assignmentCategoryId && !isValidObjectId(assignmentCategoryId))
    logger.error("Invalid categoryId for EmployeeAssignment", {
      assignmentCategoryId,
      assetId,
    });
  else if (assignmentCategoryId)
    logger.debug("Valid categoryId for EmployeeAssignment", {
      assignmentCategoryId,
      assetId,
    });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    logger.debug("Switched tab", { tab });
    if (tab === TABS.ASSIGNMENT_HISTORY)
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
    else if (tab === TABS.MAINTENANCE_HISTORY)
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
  };

  const toggleBasicEditForm = () => {
    setShowBasicEditForm((prev) => !prev);
    logger.debug("Toggled basic edit form", {
      showBasicEditForm: !showBasicEditForm,
    });
  };
  const toggleSpecsFinanceEditForm = () => {
    setShowSpecsFinanceEditForm((prev) => !prev);
    logger.debug("Toggled specs and finance edit form", {
      showSpecsFinanceEditForm: !showSpecsFinanceEditForm,
    });
  };
  const updateAssetDetails = (updatedData) => {
    logger.debug("Updating asset details", { assetId, updatedData });
    dispatch(updateAssetItem({ id: assetId, itemData: updatedData }))
      .unwrap()
      .then(() => {
        logger.info("Successfully updated asset", { assetId });
        toggleBasicEditForm();
        toggleSpecsFinanceEditForm();
      })
      .catch((err) =>
        logger.error("Failed to update asset", { error: err.message })
      );
  };
  const handleAssign = () => {
    logger.info("Assign button clicked, opening modal", { assetId });
    setShowAssignModal(true);
  };
  const handleUnassign = () => {
    logger.info("Unassign button clicked, opening modal", { assetId });
    setShowUnassignModal(true);
  };
  const handleLogMaintenance = () =>
    logger.info("Log maintenance button clicked", { assetId });
  const handleAssignmentSuccess = () => {
    logger.info("Assignment successful, refreshing data", { assetId });
    setShowAssignModal(false);
    Promise.all([
      dispatch(fetchAssetItemById(assetId)).unwrap(),
      dispatch(fetchAssignmentHistory(assetId)).unwrap(),
    ])
      .then(() =>
        logger.info("Data refresh completed after assignment", { assetId })
      )
      .catch((err) =>
        logger.error("Failed to refresh data after assignment", {
          error: err.message,
        })
      );
  };
  const handleUnassignmentSuccess = () => {
    logger.info("Unassignment successful, refreshing data", { assetId });
    setShowUnassignModal(false);
    Promise.all([
      dispatch(fetchAssetItemById(assetId)).unwrap(),
      dispatch(fetchAssignmentHistory(assetId)).unwrap(),
    ])
      .then(() =>
        logger.info("Data refresh completed after unassignment", { assetId })
      )
      .catch((err) =>
        logger.error("Failed to refresh data after unassignment", {
          error: err.message,
        })
      );
  };

  if (assetLoading)
    return (
      <div className="px-6 py-5 flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3" />
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );

  // Display fallback data or error message if asset fetch fails
  const assetData = memoizedAsset
    ? {
        assetId: memoizedAsset._id || assetId,
        assetTag: memoizedAsset.asset_tag || assetId,
        categoryId: memoizedAsset.category_id || "N/A",
        categoryName:
          (categories.find(
            (cat) => (cat.id || cat._id) === memoizedAsset.category_id
          ) || {}).name || "Unknown",
        assetName: memoizedAsset.name || "N/A",
        serialNumber: memoizedAsset.serial_number || "N/A",
        model: memoizedAsset.model || "N/A",
        status: memoizedAsset.status || "available",
        isOperational: memoizedAsset.is_operational
          ? "Operational"
          : "Non-Operational",
        condition: memoizedAsset.condition || "N/A",
        createdAt: formatDate(memoizedAsset.created_at),
        lastUpdated: formatDate(memoizedAsset.updated_at),
        currentAssigneeId: memoizedAsset.current_assignee_id || "",
        currentAssigneeName,
        hasActiveAssignment: memoizedAsset.has_active_assignment
          ? "Assigned"
          : "Not Assigned",
        department: memoizedAsset.department || "N/A",
        location: memoizedAsset.location || "N/A",
        specifications: memoizedAsset.specifications
          ? Object.entries(memoizedAsset.specifications)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
          : "N/A",
        vendor: memoizedAsset.vendor || "N/A",
        purchaseCost: formatCurrency(memoizedAsset.purchase_cost),
        purchaseDate: formatDate(memoizedAsset.purchase_date),
        warrantyExpiration: formatDate(memoizedAsset.warranty_until),
        currentValue: formatCurrency(memoizedAsset.current_value),
        notes: memoizedAsset.notes || "N/A",
        insurancePolicy: memoizedAsset.insurance_policy || "N/A",
        disposalDate: formatDate(memoizedAsset.disposal_date),
        currentAssignmentDate: formatDate(memoizedAsset.current_assignment_date),
        maintenanceDueDate: formatDate(memoizedAsset.maintenance_due_date),
      }
    : {
        // Fallback data if asset is not fetched
        assetId: assetId,
        assetTag: assetId,
        categoryId: "N/A",
        categoryName: "Unknown",
        assetName: "N/A",
        serialNumber: "N/A",
        model: "N/A",
        status: "available",
        isOperational: "N/A",
        condition: "N/A",
        createdAt: "N/A",
        lastUpdated: "N/A",
        currentAssigneeId: "",
        currentAssigneeName: "Unassigned",
        hasActiveAssignment: "Not Assigned",
        department: "N/A",
        location: "N/A",
        specifications: "N/A",
        vendor: "N/A",
        purchaseCost: "N/A",
        purchaseDate: "N/A",
        warrantyExpiration: "N/A",
        currentValue: "N/A",
        notes: "N/A",
        insurancePolicy: "N/A",
        disposalDate: "N/A",
        currentAssignmentDate: "N/A",
        maintenanceDueDate: "N/A",
      };

  return (
    <div className="p-6 bg-background-offwhite min-h-screen text-gray-900">
      <Breadcrumb assetData={assetData} categoryId={assetData.categoryId} />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Asset Details</h1>
        <button
          onClick={toggleBasicEditForm}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Edit Basic Details
        </button>
      </div>
      {showBasicEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Edit Basic Asset Details</h3>
              <button
                onClick={toggleBasicEditForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <EditAssetForm
              asset={assetData}
              onClose={toggleBasicEditForm}
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
            { label: "Model", value: assetData.model },
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
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <SpecificationsTab
                  assetData={assetData}
                  onEdit={toggleSpecsFinanceEditForm}
                />
              </div>
            )}
            {activeTab === TABS.ASSIGNMENT_HISTORY && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <AssignmentHistoryTab
                  history={assignmentHistory}
                  loading={assignmentLoading}
                  error={assignmentError}
                  currentAssigneeName={assetData.currentAssigneeName}
                  currentAssigneeId={assetData.currentAssigneeId}
                  onAssign={handleAssign}
                  onUnassign={handleUnassign}
                />
              </div>
            )}
            {activeTab === TABS.MAINTENANCE_HISTORY && (
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <MaintenanceHistoryTab
                  history={maintenanceHistory}
                  loading={maintenanceLoading}
                  error={maintenanceError}
                  onLogMaintenance={handleLogMaintenance}
                />
              </div>
            )}
          </div>
        </ErrorBoundary>
      </div>
      {showSpecsFinanceEditForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Edit Specifications & Financial Details
              </h3>
              <button
                onClick={toggleSpecsFinanceEditForm}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <EditAssetSpecsAndFinanceForm
              asset={assetData}
              onClose={toggleSpecsFinanceEditForm}
              onUpdateAsset={updateAssetDetails}
            />
          </div>
        </div>
      )}
      <DocumentList assetId={assetId} />
      <div className="mt-6 flex justify-end space-x-2">
        <Link to={`/asset-inventory/${assetData.categoryId}`}>
          <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
            View All Units
          </button>
        </Link>
        <Link to="/asset-inventory">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
            Return to Inventory
          </button>
        </Link>
      </div>
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Assign Employee</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <EmployeeAssignment
              visible={showAssignModal}
              onHide={() => setShowAssignModal(false)}
              categoryId={assetData.categoryId}
              assetId={assetId}
              onAssignmentSuccess={handleAssignmentSuccess}
            />
          </div>
        </div>
      )}
      {showUnassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Unassign Employee</h3>
              <button
                onClick={() => setShowUnassignModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <EmployeeUnassignment
              visible={showUnassignModal}
              onHide={() => setShowUnassignModal(false)}
              categoryId={assetData.categoryId}
              assetId={assetId}
              onUnassignmentSuccess={handleUnassignmentSuccess}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDetail;