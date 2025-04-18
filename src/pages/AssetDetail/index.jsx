import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import EditAssetForm from './components/EditAssetForm';
import {
  fetchAssetItemById,
  updateAssetItem,
  clearCurrentItem,
} from '../../store/slices/assetItemSlice';
import {
  fetchAssignmentHistory,
  clearAssignmentHistory,
} from '../../store/slices/assignmentHistorySlice';
import {
  fetchMaintenanceHistory,
  clearMaintenanceHistory,
} from '../../store/slices/maintenanceHistorySlice';
import { fetchDocuments, clearDocuments } from '../../store/slices/documentSlice';
import logger from '../../utils/logger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const axiosInstance = axios.create({ timeout: 15000 });

const AssetDetail = () => {
  const { assetId } = useParams();
  const dispatch = useDispatch();
  const { currentItem: asset, loading: assetLoading, error: assetError } = useSelector(
    (state) => state.assetItems
  );
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
  const { documents, loading: documentsLoading, error: documentsError } = useSelector(
    (state) => state.documents
  );
  const [activeTab, setActiveTab] = useState('specifications');
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentAssigneeName, setCurrentAssigneeName] = useState('Unassigned');

  useEffect(() => {
    logger.debug('AssetDetail useEffect triggered', { assetId });
    if (assetId) {
      dispatch(fetchAssetItemById(assetId))
        .unwrap()
        .then(() => logger.info('Successfully fetched asset item', { assetId }))
        .catch((err) =>
          logger.error('Failed to fetch asset item', { error: err.message })
        );
      // Fetch documents initially for specifications tab
      dispatch(fetchDocuments(assetId))
        .unwrap()
        .then(() => logger.info('Successfully fetched documents', { assetId }))
        .catch((err) =>
          logger.error('Failed to fetch documents', { error: err.message })
        );
    }
    return () => {
      dispatch(clearCurrentItem());
      dispatch(clearAssignmentHistory());
      dispatch(clearMaintenanceHistory());
      dispatch(clearDocuments());
      logger.debug('Cleared all state on unmount');
    };
  }, [dispatch, assetId]);

  useEffect(() => {
    if (asset?.current_assignee_id) {
      fetchEmployeeName(asset.current_assignee_id);
    } else {
      setCurrentAssigneeName('Unassigned');
      logger.debug('No current_assignee_id, setting currentAssigneeName to Unassigned');
    }
  }, [asset?.current_assignee_id]);

  useEffect(() => {
    if (activeTab === 'assignmentHistory') {
      dispatch(fetchAssignmentHistory(assetId))
        .unwrap()
        .then(() => logger.info('Successfully fetched assignment history', { assetId }))
        .catch((err) =>
          logger.error('Failed to fetch assignment history', { error: err.message })
        );
    } else if (activeTab === 'maintenanceHistory') {
      dispatch(fetchMaintenanceHistory(assetId))
        .unwrap()
        .then(() => logger.info('Successfully fetched maintenance history', { assetId }))
        .catch((err) =>
          logger.error('Failed to fetch maintenance history', { error: err.message })
        );
    }
  }, [activeTab, dispatch, assetId]);

  const fetchEmployeeName = async (employeeId) => {
    logger.debug('Fetching employee name', { employeeId });
    try {
      const response = await axiosInstance.get(`${API_URL}/employees/${employeeId}`);
      const { first_name, last_name } = response.data;
      const fullName = `${first_name} ${last_name}`;
      setCurrentAssigneeName(fullName);
      logger.info('Successfully fetched employee name', { employeeId, fullName });
    } catch (error) {
      logger.error('Failed to fetch employee name', { error: error.message });
      setCurrentAssigneeName('Unknown');
    }
  };

  const handleTabClick = (tabName) => {
    setActiveTab(tabName);
    logger.debug('Switched tab', { tabName });
  };

  const toggleEditForm = () => {
    setShowEditForm(!showEditForm);
    logger.debug('Toggled edit form', { showEditForm: !showEditForm });
  };

  const updateAssetDetails = (updatedData) => {
    logger.debug('Updating asset details', { assetId, updatedData });
    dispatch(updateAssetItem({ id: assetId, itemData: updatedData }))
      .unwrap()
      .then(() => {
        logger.info('Successfully updated asset', { assetId });
        toggleEditForm();
      })
      .catch((err) => logger.error('Failed to update asset', { error: err.message }));
  };

  if (!assetId) {
    logger.error('No assetId provided in URL', { url: window.location.href });
    return <Navigate to="/asset-inventory" replace />;
  }

  if (assetLoading) {
    logger.info('AssetDetail is loading');
    return (
      <div className="px-6 py-5 flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600">Loading asset details...</p>
        </div>
      </div>
    );
  }

  if (assetError || !asset) {
    logger.error('AssetDetail error or no asset found', { assetError, assetId });
    return (
      <div className="px-6 py-5 text-red-500">
        Error: {assetError || 'Asset not found'}
        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    );
  }

  const assetCategory = categories.find((cat) => cat.id === asset.category_id) || {
    id: asset.category_id,
    name: 'Unknown',
  };
  logger.debug('Asset category details', { category: assetCategory });

  // Map backend fields to frontend display
  const assetData = {
    assetId: asset.id,
    assetTag: asset.asset_tag || 'N/A',
    categoryId: asset.category_id || 'N/A',
    categoryName: assetCategory.name,
    assetName: asset.name || 'N/A',
    serialNumber: asset.serial_number || 'N/A',
    status: asset.status || 'N/A',
    isOperational: asset.is_operational ? 'Operational' : 'Non-Operational',
    condition: asset.condition || 'N/A',
    createdAt: asset.created_at
      ? new Date(asset.created_at).toISOString().split('T')[0]
      : 'N/A',
    lastUpdated: asset.updated_at
      ? new Date(asset.updated_at).toISOString().split('T')[0]
      : 'N/A',
    currentAssigneeId: asset.current_assignee_id || '',
    currentAssigneeName,
    hasActiveAssignment: asset.has_active_assignment ? 'Assigned' : 'Not Assigned',
    department: asset.department || 'N/A',
    location: asset.location || 'N/A',
    specifications: asset.specifications
      ? Object.entries(asset.specifications)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'N/A',
    vendor: asset.vendor || 'N/A',
    purchaseCost: asset.purchase_cost ? `₹${asset.purchase_cost}` : 'N/A',
    purchaseDate: asset.purchase_date
      ? new Date(asset.purchase_date).toISOString().split('T')[0]
      : 'N/A',
    warrantyExpiration: asset.warranty_expiration
      ? new Date(asset.warranty_expiration).toISOString().split('T')[0]
      : 'N/A',
    currentValue: asset.current_value ? `₹${asset.current_value}` : 'N/A',
    notes: asset.notes || 'N/A',
    insurancePolicy: asset.insurance_policy || 'N/A',
    disposalDate: asset.disposal_date
      ? new Date(asset.disposal_date).toISOString().split('T')[0]
      : 'N/A',
    currentAssignmentDate: asset.current_assignment_date
      ? new Date(asset.current_assignment_date).toISOString().split('T')[0]
      : 'N/A',
  };

  logger.debug('Mapped asset data for display', { assetData });

  // Add insurance policy as a document if present
  const allDocuments = [...documents];
  if (assetData.insurancePolicy && assetData.insurancePolicy !== 'N/A') {
    allDocuments.push({
      id: `insurance-${asset.id}`,
      type: 'insurance',
      filename: 'Insurance Policy',
      upload_date: asset.updated_at || asset.created_at,
      description: `Insurance Policy: ${assetData.insurancePolicy}`,
      file_size: 0,
      mime_type: 'application/pdf',
      is_active: 1,
    });
  }
  logger.debug('Documents with insurance policy', { documentCount: allDocuments.length });

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
        to={`/asset-inventory/${assetCategory.id}`}
        className="text-gray-600 hover:text-blue-600 transition-colors"
      >
        {assetCategory.name}
      </Link>
      <span className="mx-2 text-gray-400">›</span>
      <span className="text-gray-800 font-medium">{assetData.assetTag}</span>
    </div>
  );

  const StatusIndicator = ({ status }) => {
    let bgColor = 'bg-gray-400';
    if (status === 'In Use') bgColor = 'bg-blue-500';
    else if (status === 'Under Maintenance') bgColor = 'bg-yellow-500';
    else if (status === 'Available') bgColor = 'bg-green-500';
    else if (status === 'Retired' || status === 'Lost') bgColor = 'bg-red-500';
    return (
      <div className="flex items-center">
        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${bgColor}`}></span>
        <span>{status}</span>
      </div>
    );
  };

  const DocumentItem = ({ document }) => (
    <div className="flex items-center p-4 border border-gray-200 rounded-lg mb-2 hover:shadow-md hover:border-blue-200 transition-all duration-200">
      <i className="pi pi-file-pdf text-gray-500 mr-3"></i>
      <div>
        <div className="font-medium">{document.filename}</div>
        <div className="text-sm text-gray-500">
          {document.upload_date
            ? new Date(document.upload_date).toISOString().split('T')[0]
            : 'N/A'}
        </div>
        <div className="text-sm text-gray-500">{document.description}</div>
      </div>
    </div>
  );

  const getTabDocuments = () => {
    logger.debug('Filtering documents for tab', { activeTab });
    if (activeTab === 'specifications') {
      return allDocuments.filter(
        (doc) => doc.type === 'invoice' || doc.type === 'insurance' || !doc.type
      );
    } else if (activeTab === 'assignmentHistory') {
      return allDocuments.filter((doc) => doc.type === 'assignment');
    } else if (activeTab === 'maintenanceHistory') {
      return allDocuments.filter((doc) => doc.type === 'maintenance');
    }
    return allDocuments;
  };

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
              asset={assetData}
              onClose={toggleEditForm}
              onUpdateAsset={updateAssetDetails}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Asset Status</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <StatusIndicator status={assetData.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition</span>
              <span className="font-medium text-green-600">{assetData.condition}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Operational</span>
              <span className="font-medium">{assetData.isOperational}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">{assetData.lastUpdated}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Asset Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Asset Name</span>
              <span className="font-medium">{assetData.assetName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Asset Tag</span>
              <span className="font-medium">{assetData.assetTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Serial Number</span>
              <span className="font-medium">{assetData.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Category</span>
              <span className="font-medium">{assetData.categoryName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created At</span>
              <span className="font-medium">{assetData.createdAt}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Assignment Details</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Current Assignee</span>
              <span className="font-medium">{assetData.currentAssigneeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-medium">{assetData.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location</span>
              <span className="font-medium">{assetData.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assignment Status</span>
              <span className="font-medium">{assetData.hasActiveAssignment}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assignment Date</span>
              <span className="font-medium">{assetData.currentAssignmentDate}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'specifications'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-blue-600'
            } transition-colors`}
            onClick={() => handleTabClick('specifications')}
          >
            Specifications
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'assignmentHistory'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-blue-600'
            } transition-colors`}
            onClick={() => handleTabClick('assignmentHistory')}
          >
            Assignment History
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'maintenanceHistory'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-600 hover:text-blue-600'
            } transition-colors`}
            onClick={() => handleTabClick('maintenanceHistory')}
          >
            Maintenance History
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'specifications' && (
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
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Vendor</span>
                    <span className="font-medium">{assetData.vendor}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Purchase Cost</span>
                    <span className="font-medium">{assetData.purchaseCost}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Purchase Date</span>
                    <span className="font-medium">{assetData.purchaseDate}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Warranty Until</span>
                    <span className="font-medium">{assetData.warrantyExpiration}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Current Value</span>
                    <span className="font-medium">{assetData.currentValue}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Insurance Policy</span>
                    <span className="font-medium">{assetData.insurancePolicy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignmentHistory' && (
            <div>
              {assignmentLoading ? (
                <p className="text-gray-600">Loading assignment history...</p>
              ) : assignmentError ? (
                <p className="text-red-500">
                  {assignmentError.includes('404')
                    ? 'No assignment history found'
                    : 'Failed to fetch assignment history'}
                </p>
              ) : assignmentHistory.length === 0 ? (
                <p className="text-gray-500">No assignment history available</p>
              ) : (
                <DataTable
                  value={assignmentHistory}
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
                        {rowData.assigned_to === assetData.currentAssigneeId
                          ? assetData.currentAssigneeName
                          : rowData.assigned_to}
                      </span>
                    )}
                  />
                  <Column field="department" header="Department" sortable />
                  <Column
                    field="condition"
                    header="Condition"
                    sortable
                    body={(rowData) => rowData.condition || 'N/A'}
                  />
                  <Column
                    field="assignment_date"
                    header="Assignment Date"
                    sortable
                    body={(rowData) =>
                      rowData.assignment_date
                        ? new Date(rowData.assignment_date).toISOString().split('T')[0]
                        : 'N/A'
                    }
                  />
                  <Column
                    field="return_date"
                    header="Return Date"
                    sortable
                    body={(rowData) =>
                      rowData.return_date
                        ? new Date(rowData.return_date).toISOString().split('T')[0]
                        : 'N/A'
                    }
                  />
                  <Column
                    field="is_active"
                    header="Active"
                    sortable
                    body={(rowData) => (rowData.is_active ? 'Yes' : 'No')}
                  />
                  <Column field="notes" header="Notes" body={(rowData) => rowData.notes || 'N/A'} />
                </DataTable>
              )}
            </div>
          )}

          {activeTab === 'maintenanceHistory' && (
            <div>
              {maintenanceLoading ? (
                <p className="text-gray-600">Loading maintenance history...</p>
              ) : maintenanceError ? (
                <p className="text-red-500">
                  {maintenanceError.includes('404')
                    ? 'No maintenance history found'
                    : 'Failed to fetch maintenance history'}
                </p>
              ) : maintenanceHistory.length === 0 ? (
                <p className="text-gray-500">No maintenance history available</p>
              ) : (
                <DataTable
                  value={maintenanceHistory}
                  responsiveLayout="scroll"
                  stripedRows
                  className="p-datatable-sm"
                >
                  <Column
                    field="maintenance_type"
                    header="Service Type"
                    sortable
                    body={(rowData) => rowData.maintenance_type || 'N/A'}
                  />
                  <Column
                    field="technician"
                    header="Technician"
                    sortable
                    body={(rowData) => rowData.technician || 'N/A'}
                  />
                  <Column
                    field="condition_before"
                    header="Condition Before"
                    sortable
                    body={(rowData) => rowData.condition_before || 'N/A'}
                  />
                  <Column
                    field="condition_after"
                    header="Condition After"
                    sortable
                    body={(rowData) => rowData.condition_after || 'N/A'}
                  />
                  <Column
                    field="maintenance_date"
                    header="Maintenance Date"
                    sortable
                    body={(rowData) =>
                      rowData.maintenance_date
                        ? new Date(rowData.maintenance_date).toISOString().split('T')[0]
                        : 'N/A'
                    }
                  />
                  <Column
                    field="completed_date"
                    header="Completed Date"
                    sortable
                    body={(rowData) =>
                      rowData.completed_date
                        ? new Date(rowData.completed_date).toISOString().split('T')[0]
                        : 'N/A'
                    }
                  />
                  <Column
                    field="cost"
                    header="Cost"
                    sortable
                    body={(rowData) => (rowData.cost ? `₹${rowData.cost}` : 'N/A')}
                  />
                  <Column
                    field="is_completed"
                    header="Completed"
                    sortable
                    body={(rowData) => (rowData.is_completed ? 'Yes' : 'No')}
                  />
                  <Column field="notes" header="Notes" body={(rowData) => rowData.notes || 'N/A'} />
                </DataTable>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 mt-6">
        <h3 className="px-6 py-3 text-lg font-semibold border-b border-gray-200">Documents</h3>
        <div className="p-6">
          {documentsLoading ? (
            <p className="text-gray-600">Loading documents...</p>
          ) : documentsError ? (
            <p className="text-red-500">
              {documentsError.includes('404')
                ? 'No documents found'
                : 'Failed to fetch documents'}
            </p>
          ) : getTabDocuments().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getTabDocuments().map((doc) => (
                <DocumentItem key={doc.id} document={doc} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No documents found for this {activeTab.replace('History', '')}.
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to={`/asset-inventory/${assetCategory.id}`}
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