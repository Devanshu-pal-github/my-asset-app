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
import {
  mockAssets,
  mockCategories,
  mockAssignmentHistory,
  mockMaintenanceHistory,
  mockDocuments,
  mockEmployees,
} from "../../components/mockData";

// Constants
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
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
const isValidObjectId = (id) => {
  if (!id) return false;
  
  // Check for standard UUID format (8-4-4-4-12 hex digits)
  const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  
  // Check for prefixed ID format like AST-12345678
  const prefixedIdRegex = /^[A-Z]{3}-[0-9A-Z]{8}$/;
  
  // Check for old MongoDB ObjectId format (24 hex characters)
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  
  return uuidRegex.test(id) || prefixedIdRegex.test(id) || objectIdRegex.test(id);
};

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
    <span className="text-gray-800 font-medium">{assetData.assetId}</span>
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
      <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
      <div className="space-y-4">
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
          { label: "Warranty Until", value: assetData.warrantyUntil },
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
          ? "No assignment history found. Using mock data."
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
  const formatDate = (date) => date ? new Date(date).toLocaleDateString() : "N/A";
  const formatCurrency = (amount) => amount ? `$${amount.toFixed(2)}` : "N/A";

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      requested: "bg-yellow-100 text-yellow-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      scheduled: "bg-purple-100 text-purple-800",
      overdue: "bg-orange-100 text-orange-800",
      pending: "bg-gray-100 text-gray-800"
    };
    return statusClasses[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500">
        Error loading maintenance history: {error}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No maintenance history available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={onLogMaintenance}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Log Maintenance
        </button>
      </div>
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Type</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Request Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Completion Date</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Technician</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Cost</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Condition</th>
            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {history.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50">
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <span className="font-medium">{record.maintenance_type}</span>
                  {record.service_type && (
                    <span className="text-sm text-gray-500">{record.service_type}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(record.status)}`}>
                  {record.status}
                </span>
              </td>
              <td className="px-4 py-2">{formatDate(record.request_date)}</td>
              <td className="px-4 py-2">{formatDate(record.completion_date)}</td>
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <span>{record.technician}</span>
                  {record.performed_by && (
                    <span className="text-sm text-gray-500">{record.performed_by}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2">
                {formatCurrency(record.cost || record.actual_cost || record.estimated_cost)}
              </td>
              <td className="px-4 py-2">
                <div className="flex flex-col">
                  <span>Before: {record.condition_before || 'N/A'}</span>
                  <span>After: {record.condition_after || 'N/A'}</span>
                </div>
              </td>
              <td className="px-4 py-2">
                <div className="max-w-xs truncate" title={record.notes}>
                  {record.notes || 'No notes'}
                </div>
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
  const effectiveDocuments =
    documents.length > 0
      ? documents
      : mockDocuments.filter((doc) => doc.asset_id === assetId);
  useEffect(
    () =>
      logger.debug("DocumentList useEffect", {
        assetId,
        documents: effectiveDocuments,
      }),
    [assetId, effectiveDocuments]
  );
  if (loading && documents.length === 0) return <p>Loading documents...</p>;
  if (error && documents.length === 0)
    return (
      <div className="text-red-500">
        <p>
          {error.includes("404")
            ? "No documents found. Using mock data."
            : `Error: ${error}`}
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
      {effectiveDocuments.length > 0 ? (
        effectiveDocuments.map((doc) => (
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
  const { documents } = useSelector((state) => state.documents);
  const [activeTab, setActiveTab] = useState(TABS.SPECIFICATIONS);
  const [showBasicEditForm, setShowBasicEditForm] = useState(false);
  const [showSpecsFinanceEditForm, setShowSpecsFinanceEditForm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [currentAssigneeName, setCurrentAssigneeName] = useState("");

  // Fetch asset data when component mounts
  useEffect(() => {
    if (assetId) {
      dispatch(fetchAssetItemById(assetId));
      dispatch(fetchAssignmentHistory(assetId));
      dispatch(fetchMaintenanceHistory(assetId));
      dispatch(fetchDocuments(assetId));
    }
    return () => {
      dispatch(clearCurrentItem());
      dispatch(clearAssignmentHistory());
      dispatch(clearMaintenanceHistory());
      dispatch(clearDocuments());
    };
  }, [dispatch, assetId]);

  // If no asset data is available, show error
  if (!asset && !assetLoading) {
    return (
      <div className="p-6 text-red-600">
        Error: Asset not found for ID {assetId}. Please check the URL or contact support.
        <div className="flex justify-end mt-4">
          <Link to="/asset-inventory" className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50">
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (assetLoading) {
    return <div className="p-6">Loading asset details...</div>;
  }

  // Update the asset data mapping to be dynamic based on API payload
  const assetData = useMemo(() => {
    if (!asset) return null;

    return {
      // Core Information (from normalized data)
      id: asset._id,
      assetId: asset.asset_id,
      name: asset.name,
      categoryId: asset.category_id,
      categoryName: categories.find(cat => cat._id === asset.category_id)?.name || 'Unknown',
      
      // Status Information
      status: asset.status || 'available',
      condition: asset.condition,
      isOperational: asset.is_operational,
      
      // Technical Details
      serialNumber: asset.serial_number,
      model: asset.model,
      manufacturer: asset.manufacturer,
      specifications: asset.specifications || [],
      
      // Location and Assignment
      location: asset.location,
      department: asset.department,
      assignedTo: asset.assigned_to,
      currentAssignmentDate: asset.current_assignment_date,
      hasActiveAssignment: asset.has_active_assignment,
      
      // Financial Information
      purchaseCost: asset.purchase_cost,
      currentValue: asset.current_value,
      purchaseDate: asset.purchase_date,
      vendor: asset.vendor,
      warrantyUntil: asset.warranty_until,
      
      // Maintenance
      maintenanceDueDate: asset.maintenance_due_date,
      lastMaintenanceDate: asset.last_maintenance_date,
      
      // Metadata
      createdAt: asset.created_at,
      updatedAt: asset.updated_at,
      notes: asset.notes
    };
  }, [asset, categories]);

  // Render info cards based on available data
  const renderInfoCards = () => {
    if (!assetData) return null;

    const cards = [];

    // Status Card (Always show)
    cards.push({
      title: "Asset Status",
      data: [
        { label: "Status", value: <StatusIndicator status={assetData.status} /> },
        ...(assetData.condition ? [{ label: "Condition", value: assetData.condition }] : []),
        { label: "Operational", value: assetData.isOperational ? "Yes" : "No" },
        { label: "Last Updated", value: formatDate(assetData.updatedAt) }
      ].filter(item => item.value)
    });

    // Asset Information Card (Always show)
    cards.push({
      title: "Asset Information",
      data: [
        { label: "Asset Name", value: assetData.name },
        { label: "Asset ID", value: assetData.assetId },
        ...(assetData.serialNumber ? [{ label: "Serial Number", value: assetData.serialNumber }] : []),
        ...(assetData.model ? [{ label: "Model", value: assetData.model }] : []),
        ...(assetData.manufacturer ? [{ label: "Manufacturer", value: assetData.manufacturer }] : []),
        { label: "Category", value: assetData.categoryName }
      ].filter(item => item.value)
    });

    // Assignment Details Card (Only if has assignment data)
    if (assetData.assignedTo || assetData.department || assetData.location) {
      cards.push({
        title: "Assignment Details",
        data: [
          ...(assetData.assignedTo ? [{ label: "Assigned To", value: currentAssigneeName || "Loading..." }] : []),
          ...(assetData.department ? [{ label: "Department", value: assetData.department }] : []),
          ...(assetData.location ? [{ label: "Location", value: assetData.location }] : []),
          ...(assetData.currentAssignmentDate ? [{ 
            label: "Assignment Date", 
            value: formatDate(assetData.currentAssignmentDate) 
          }] : [])
        ].filter(item => item.value)
      });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {cards.map((card, index) => (
          <AssetInfoCard
            key={index}
            title={card.title}
            data={card.data}
          />
        ))}
      </div>
    );
  };

  // Render specifications tab content
  const renderSpecificationsTab = () => {
    if (!assetData) return null;

    const technicalDetails = [
      ...(assetData.model ? [{ label: "Model", value: assetData.model }] : []),
      ...(assetData.manufacturer ? [{ label: "Manufacturer", value: assetData.manufacturer }] : []),
      ...(assetData.serialNumber ? [{ label: "Serial Number", value: assetData.serialNumber }] : []),
      ...(Array.isArray(assetData.specifications) ? 
        assetData.specifications.map(spec => ({
          label: spec.name,
          value: spec.value
        })) : 
        []
      )
    ].filter(item => item.value);

    const purchaseDetails = [
      ...(assetData.purchaseCost ? [{ label: "Purchase Cost", value: formatCurrency(assetData.purchaseCost) }] : []),
      ...(assetData.purchaseDate ? [{ label: "Purchase Date", value: formatDate(assetData.purchaseDate) }] : []),
      ...(assetData.vendor ? [{ label: "Vendor", value: assetData.vendor }] : []),
      ...(assetData.warrantyUntil ? [{ label: "Warranty Until", value: formatDate(assetData.warrantyUntil) }] : []),
      ...(assetData.currentValue ? [{ label: "Current Value", value: formatCurrency(assetData.currentValue) }] : [])
    ].filter(item => item.value);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {technicalDetails.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Technical Details</h3>
            <div className="space-y-4">
              {technicalDetails.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {purchaseDetails.length > 0 && (
          <div>
            <div className="flex justify-end mb-4">
              <button
                onClick={toggleSpecsFinanceEditForm}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Edit
              </button>
            </div>
            <h3 className="text-lg font-semibold mb-4">Purchase Details</h3>
            <div className="space-y-4">
              {purchaseDetails.map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          logger.error("Failed to fetch assignment history, using mock data", {
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
          logger.error("Failed to fetch maintenance history, using mock data", {
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

  return (
    <div className="p-6 bg-background-offwhite min-h-screen mt-20 text-gray-900">
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

      {renderInfoCards()}

      <div className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 mb-6">
        <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        <ErrorBoundary>
          <div className="p-6">
            {activeTab === TABS.SPECIFICATIONS && renderSpecificationsTab()}
            {activeTab === TABS.ASSIGNMENT_HISTORY && (
              <AssignmentHistoryTab
                history={assignmentHistory}
                loading={assignmentLoading}
                error={assignmentError}
                currentAssigneeName={currentAssigneeName}
                currentAssigneeId={assetData.assignedTo}
                onAssign={handleAssign}
                onUnassign={handleUnassign}
              />
            )}
            {activeTab === TABS.MAINTENANCE_HISTORY && (
              <MaintenanceHistoryTab
                history={maintenanceHistory}
                loading={maintenanceLoading}
                error={maintenanceError}
                onLogMaintenance={handleLogMaintenance}
              />
            )}
          </div>
        </ErrorBoundary>
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
