import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FilterBar from "./components/FilterBar";
import PolicyViewer from "./components/PolicyViewer";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import EditAssetForm from "./components/EditAssetForm";

const categoryOptions = [
  { label: "All Categories", value: null },
  { label: "Hardware", value: "Hardware" },
  { label: "Stationery", value: "Stationery" },
];

// Move renderAssetCard outside the component
const renderAssetCard = (asset, toggleAssetSelection, selectedAssets, showPolicies, handleEditClick, handleSingleDeleteClick) => {
  const assigned = Math.floor(asset.count * 0.8);
  const available = Math.floor(asset.count * 0.15);
  const maintenance = asset.count - assigned - available;
  const utilizationRate = Math.round((assigned / asset.count) * 100);
  const isSelected = selectedAssets.some((a) => a.id === asset.id);

  return (
    <div
      key={asset.id}
      className={`bg-white shadow-md rounded-xl overflow-hidden border transition-all duration-200 ${
        isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-gray-100 hover:shadow-lg"
      }`}
    >
      <div className="p-5 border-b border-gray-100 flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <div className="text-blue-600 mr-3 text-lg">
              <i className={asset.icon || "pi pi-desktop"}></i>
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{asset.name}</h3>
          </div>
          <div className="text-sm text-gray-600 mt-1">{asset.category || "Hardware"}</div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => showPolicies(asset)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="View Policies"
          >
            <i className="pi pi-info-circle text-lg"></i>
          </button>
          <button
            onClick={() => handleEditClick(asset)}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
            title="Edit Asset"
          >
            <i className="pi pi-pencil text-lg"></i>
          </button>
          <button
            onClick={() => handleSingleDeleteClick(asset)}
            className="p-2 text-gray-600 hover:text-red-600 transition-colors"
            title="Delete Asset"
          >
            <i className="pi pi-trash text-lg"></i>
          </button>
          <button
            onClick={() => toggleAssetSelection(asset)}
            className={`p-2 ${isSelected ? "text-blue-600" : "text-gray-600 hover:text-blue-600"} transition-colors`}
            title={isSelected ? "Deselect" : "Select for Action"}
          >
            <i className={`pi ${isSelected ? "pi-check-square" : "pi-square"} text-lg`}></i>
          </button>
        </div>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <div className="text-gray-600">Total Items</div>
            <div className="font-semibold text-gray-900">{asset.count}</div>
          </div>
          <div>
            <div className="text-gray-600">Assigned</div>
            <div className="font-semibold text-gray-900">{assigned}</div>
          </div>
          <div>
            <div className="text-gray-600">Available</div>
            <div className="font-semibold text-green-600">{available}</div>
          </div>
          <div>
            <div className="text-gray-600">Maintenance</div>
            <div className="font-semibold text-yellow-600">{maintenance}</div>
          </div>
        </div>
        <div className="mb-6">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Utilization Rate</span>
            <span className="font-semibold text-gray-900">{utilizationRate}%</span>
          </div>
          <div className="bg-gray-200 h-2 rounded-full">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${utilizationRate}%` }}
            ></div>
          </div>
        </div>
        <div className="mb-6 flex space-x-2">
          <button className="bg-[#10B981] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#0E9F6E] transition-colors flex items-center">
            <i className="pi pi-check mr-1"></i> Assign Asset
          </button>
          <button className="bg-[#EF4444] text-white px-3 py-1.5 rounded-lg text-sm hover:bg-[#DC2626] transition-colors flex items-center">
            <i className="pi pi-times mr-1"></i> Unassign Asset
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div className="font-bold text-green-600 text-xl">₹{asset.value.toLocaleString()}</div>
          <Link
            to={`/asset-inventory/${asset.id}/table`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

const AssetInventory = ({
  assets = [], // Default to empty array to avoid undefined errors
  loading = false,
  addAssetCategory,
  deleteAssetCategory,
  updateAssetDetails,
}) => {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState(null);
  const [showPolicyViewer, setShowPolicyViewer] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [currentAssetPolicies, setCurrentAssetPolicies] = useState([]);
  const [currentAssetName, setCurrentAssetName] = useState("");
  const [editingAsset, setEditingAsset] = useState(null);
  const [assetToDelete, setAssetToDelete] = useState(null);

  console.log("Rendering AssetInventory - Assets:", assets, "Loading:", loading);

  // Calculate summary statistics
  const totalAssets = assets.reduce((sum, asset) => sum + (asset.count || 0), 0);
  const activeAssets = assets.reduce(
    (sum, asset) => sum + Math.floor((asset.count || 0) * 0.8),
    0
  );
  const totalValue = assets.reduce((sum, asset) => sum + (asset.value || 0), 0);
  const assetsInMaintenance = assets.reduce(
    (sum, asset) => sum + Math.floor((asset.count || 0) * 0.1),
    0
  );
  const avgAssetValue = totalAssets > 0 ? (totalValue / totalAssets).toFixed(2) : 0;
  const newAssetsThisMonth = Math.floor(totalAssets * 0.05);
  const depreciationRate = 5;

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      searchText === "" ||
      (asset.name && asset.name.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCategory = !category || asset.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleCategoryChange = (e) =>
    setCategory(e.target.value === "null" ? null : e.target.value);
  const toggleAssetSelection = (asset) =>
    setSelectedAssets((prev) =>
      prev.some((a) => a.id === asset.id)
        ? prev.filter((a) => a.id !== asset.id)
        : [...prev, asset]
    );
  const showPolicies = (asset) => {
    setCurrentAssetPolicies(asset.policies || []);
    setCurrentAssetName(asset.name);
    setShowPolicyViewer(true);
  };
  const handleEditClick = (asset) => setEditingAsset(asset);
  const handleSingleDeleteClick = (asset) => {
    setAssetToDelete(asset);
    setShowDeleteModal(true);
  };
  const confirmDelete = () => {
    if (assetToDelete) {
      deleteAssetCategory(assetToDelete.id);
      setAssetToDelete(null);
    } else if (selectedAssets.length > 0) {
      selectedAssets.forEach((asset) => deleteAssetCategory(asset.id));
      setSelectedAssets([]);
    }
    setShowDeleteModal(false);
  };

  const handleUpdateAsset = (updatedAsset) => {
    updateAssetDetails(updatedAsset);
    setEditingAsset(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 text-base">Loading asset data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Asset Management</h1>
        <p className="text-gray-600 text-base mt-2">Overview of your asset management system</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">Total Assets</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">{totalAssets.toLocaleString()}</div>
            <div className="text-sm font-medium text-green-600">+12%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">Active Assets</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">{activeAssets.toLocaleString()}</div>
            <div className="text-sm font-medium text-green-600">+5%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">Total Value</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">₹{(totalValue / 1000000).toFixed(2)}M</div>
            <div className="text-sm font-medium text-green-600">+8%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">Assets in Maintenance</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">{assetsInMaintenance.toLocaleString()}</div>
            <div className="text-sm font-medium text-yellow-600">+3%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">Avg Asset Value</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">₹{avgAssetValue}</div>
            <div className="text-sm font-medium text-green-600">+2%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">New Assets This Month</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">{newAssetsThisMonth.toLocaleString()}</div>
            <div className="text-sm font-medium text-green-600">+10%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition-all duration-200">
          <h3 className="text-sm text-gray-600 mb-2">Depreciation Rate</h3>
          <div className="flex justify-between items-end">
            <div className="text-3xl font-bold text-gray-900">{depreciationRate}%</div>
            <div className="text-sm font-medium text-red-600">-1%</div>
          </div>
        </div>
      </div>

      {selectedAssets.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-md flex justify-between items-center">
          <div>
            <span className="font-medium text-base text-gray-900">{selectedAssets.length}</span>{" "}
            assets selected
          </div>
          <div className="space-x-3">
            <button
              onClick={() => setSelectedAssets([])}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      <FilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        categoryOptions={categoryOptions}
        selectedCategory={category}
        onCategoryChange={(val) => setCategory(val)}
        onAddClick={() => navigate("/asset-inventory/add-category")}
      />

      {editingAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Asset: {editingAsset.name}</h3>
              <button
                onClick={() => setEditingAsset(null)}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <i className="pi pi-times text-lg"></i>
              </button>
            </div>
            <EditAssetForm
              asset={editingAsset}
              onClose={() => setEditingAsset(null)}
              onUpdateAsset={handleUpdateAsset}
            />
          </div>
        </div>
      )}

      <PolicyViewer
        isOpen={showPolicyViewer}
        onClose={() => setShowPolicyViewer(false)}
        policies={currentAssetPolicies}
        title={`${currentAssetName} Policies`}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setAssetToDelete(null);
        }}
        onConfirm={confirmDelete}
        selectedAssets={assetToDelete ? [assetToDelete] : selectedAssets}
        isSingleAsset={!!assetToDelete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) =>
            renderAssetCard(
              asset,
              toggleAssetSelection,
              selectedAssets,
              showPolicies,
              handleEditClick,
              handleSingleDeleteClick
            )
          )
        ) : (
          <div className="col-span-full text-center py-12 text-gray-600 text-base bg-white rounded-xl shadow-md">
            No assets found matching your search criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetInventory;