import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import axios from 'axios';
import EditAssetForm from './components/EditAssetForm.jsx';
import { fetchAssetItemById, updateAssetItem, clearCurrentItem } from '../../store/slices/assetItemSlice';
import logger from '../../utils/logger.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const axiosInstance = axios.create({ timeout: 15000 });

const AssetDetail = () => {
  const { assetId } = useParams();
  const dispatch = useDispatch();
  const { currentItem: asset, loading, error } = useSelector((state) => state.assetItems);
  const { categories } = useSelector((state) => state.assetCategories);
  const [activeTab, setActiveTab] = useState('specifications');
  const [showEditForm, setShowEditForm] = useState(false);
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState([]);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    logger.debug('AssetDetail useEffect triggered', { assetId });
    if (assetId) {
      dispatch(fetchAssetItemById(assetId))
        .then(() => logger.info('Successfully fetched asset item', { assetId }))
        .catch((err) => logger.error('Failed to fetch asset item', { error: err.message }));
      // Fetch additional data
      fetchAssignmentHistory();
      fetchMaintenanceHistory();
      fetchDocuments();
    }
    return () => {
      dispatch(clearCurrentItem());
      logger.debug('Cleared current asset item on unmount');
    };
  }, [dispatch, assetId]);

  const fetchAssignmentHistory = async () => {
    logger.debug('Fetching assignment history', { assetId });
    try {
      const response = await axiosInstance.get(`${API_URL}/assignment-history/?asset_id=${assetId}`);
      setAssignmentHistory(response.data);
      logger.info('Successfully fetched assignment history', { count: response.data.length });
    } catch (error) {
      logger.error('Failed to fetch assignment history', { error: error.message });
    }
  };

  const fetchMaintenanceHistory = async () => {
    logger.debug('Fetching maintenance history', { assetId });
    try {
      const response = await axiosInstance.get(`${API_URL}/maintenance-history/?asset_id=${assetId}`);
      setMaintenanceHistory(response.data);
      logger.info('Successfully fetched maintenance history', { count: response.data.length });
    } catch (error) {
      logger.error('Failed to fetch maintenance history', { error: error.message });
    }
  };

  const fetchDocuments = async () => {
    logger.debug('Fetching documents', { assetId });
    try {
      const response = await axiosInstance.get(`${API_URL}/documents/?asset_id=${assetId}`);
      setDocuments(response.data);
      logger.info('Successfully fetched documents', { count: response.data.length });
    } catch (error) {
      logger.error('Failed to fetch documents', { error: error.message });
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

  if (loading) {
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

  if (error || !asset) {
    logger.error('AssetDetail error or no asset found', { error, assetId });
    return (
      <div className="px-6 py-5 text-error-red">
        Error: {error || 'Asset not found'}
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

  const assetCategory = categories.find((cat) => cat.id === asset.category_id) || { id: asset.category_id, name: 'Unknown' };
  logger.debug('Asset category details', { category: assetCategory });

  // Map backend fields to frontend display
  const assetData = {
    deviceId: asset.id,
    assetTag: asset.asset_tag,
    itemId: asset.category_id,
    model: asset.name, // Using name as model since model is not in backend
    serialNumber: asset.serial_number || 'N/A',
    status: asset.status,
    condition: asset.condition,
    purchaseDate: asset.purchase_date ? new Date(asset.purchase_date).toISOString().split('T')[0] : 'N/A',
    assignedTo: asset.assigned_to || 'Unassigned',
    department: asset.department || 'N/A',
    assignmentDate: 'N/A', // Not directly available in AssetItem
    expectedReturn: 'N/A', // Not available
    specs: asset.specifications ? Object.entries(asset.specifications).map(([k, v]) => `${k}: ${v}`).join(', ') : 'N/A',
    vendor: asset.vendor || 'N/A',
    purchaseCost: asset.purchase_cost || 0,
    warrantyExpiration: asset.warranty_expiration ? new Date(asset.warranty_expiration).toISOString().split('T')[0] : 'N/A',
    currentValue: asset.current_value || 'N/A',
    lastUpdated: asset.updated_at ? new Date(asset.updated_at).toISOString().split('T')[0] : 'N/A',
    notes: asset.notes || 'N/A',
  };

  logger.debug('Mapped asset data for display', { assetData });

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
        <div className="text-sm text-gray-500">{document.upload_date ? new Date(document.upload_date).toISOString().split('T')[0] : 'N/A'}</div>
      </div>
    </div>
  );

  const getTabDocuments = () => {
    logger.debug('Filtering documents for tab', { activeTab });
    if (activeTab === 'specifications') {
      return documents.filter((doc) => doc.type === 'specification' || !doc.type);
    } else if (activeTab === 'assignmentHistory') {
      return documents.filter((doc) => doc.type === 'assignment');
    } else if (activeTab === 'maintenanceHistory') {
      return documents.filter((doc) => doc.type === 'maintenance');
    }
    return [];
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
        <div className="bg-white p-5 rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Status Overview</h2>
          <div className="space-y-4">
            <StatusIndicator status={assetData.status} />
            <div className="flex justify-between">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-medium">{assetData.lastUpdated}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Condition</span>
              <span className="font-medium text-green-600">{assetData.condition}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Asset Tag</span>
              <span className="font-medium">{assetData.assetTag}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Serial Number</span>
              <span className="font-medium">{assetData.serialNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model</span>
              <span className="font-medium">{assetData.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Purchase Date</span>
              <span className="font-medium">{assetData.purchaseDate}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] hover:border-blue-100 transition-all duration-300">
          <h2 className="text-lg font-semibold mb-4">Current Assignment</h2>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Assigned To</span>
              <span className="font-medium">{assetData.assignedTo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Department</span>
              <span className="font-medium">{assetData.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assignment Date</span>
              <span className="font-medium">{assetData.assignmentDate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Return</span>
              <span className="font-medium">{assetData.expectedReturn}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] transition-all duration-300 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'specifications'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
            onClick={() => handleTabClick('specifications')}
          >
            Specifications
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'assignmentHistory'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
            } transition-colors`}
            onClick={() => handleTabClick('assignmentHistory')}
          >
            Assignment History
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium ${
              activeTab === 'maintenanceHistory'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700'
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
                <h3 className="text-lg font-semibold mb-4">Hardware Specifications</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Specifications</span>
                    <span className="font-medium">{assetData.specs}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Purchase Information</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Vendor</span>
                    <span className="font-medium">{assetData.vendor}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Purchase Cost</span>
                    <span className="font-medium">₹{assetData.purchaseCost}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Warranty Until</span>
                    <span className="font-medium">{assetData.warrantyExpiration}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="text-gray-600">Current Value</span>
                    <span className="font-medium">₹{assetData.currentValue}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignmentHistory' && (
            <div>
              <DataTable
                value={assignmentHistory}
                responsiveLayout="scroll"
                stripedRows
                className="p-datatable-sm"
              >
                <Column field="assigned_to" header="User" sortable />
                <Column field="department" header="Department" sortable />
                <Column
                  field="assignment_date"
                  header="Assignment Date"
                  sortable
                  body={(rowData) => rowData.assignment_date ? new Date(rowData.assignment_date).toISOString().split('T')[0] : 'N/A'}
                />
                <Column
                  field="return_date"
                  header="Return Date"
                  sortable
                  body={(rowData) => rowData.return_date ? new Date(rowData.return_date).toISOString().split('T')[0] : 'N/A'}
                />
                <Column field="notes" header="Notes" />
              </DataTable>
            </div>
          )}

          {activeTab === 'maintenanceHistory' && (
            <div>
              <DataTable
                value={maintenanceHistory}
                responsiveLayout="scroll"
                stripedRows
                className="p-datatable-sm"
              >
                <Column field="maintenance_type" header="Service Type" sortable />
                <Column field="technician" header="Service Provider" sortable />
                <Column
                  field="maintenance_date"
                  header="Date"
                  sortable
                  body={(rowData) => rowData.maintenance_date ? new Date(rowData.maintenance_date).toISOString().split('T')[0] : 'N/A'}
                />
                <Column
                  field="completed_date"
                  header="Completed Date"
                  sortable
                  body={(rowData) => rowData.completed_date ? new Date(rowData.completed_date).toISOString().split('T')[0] : 'N/A'}
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

      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_6px_16px_rgba(0,0,0,0.06),_0_3px_6px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1),_0_4px_8px_rgba(0,0,0,0.06)] transition-all duration-300 mt-6">
        <h3 className="px-6 py-3 text-lg font-semibold border-b border-gray-200">Documents</h3>
        <div className="p-6">
          {getTabDocuments().length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getTabDocuments().map((doc, index) => (
                <DocumentItem key={index} document={doc} />
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