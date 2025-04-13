import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AssetTable from "./components/AssetTable";
import AddItemForm from "./components/AddItemForm";

const AssetTablePage = ({
  assetItems,
  assetCategories,
  loading,
  addAssetItem,
}) => {
  const { id } = useParams();
  const [globalFilter, setGlobalFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const tableData = assetItems.filter((item) => item.categoryId === id);
  const assetCategory = assetCategories.find((cat) => cat.id === id);

  useEffect(() => {
    if (id && assetCategories.length > 0) {
      const category = assetCategories.find((cat) => cat.id === id);
      if (category) setSelectedCategory(category);
    }
  }, [id, assetCategories]);

  const toggleAddForm = () => setShowAddForm(!showAddForm);

  const header = (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">
        {assetCategory?.name || id} Inventory
      </h2>
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="pi pi-search text-gray-400"></i>
          </div>
          <input
            type="text"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search items..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={toggleAddForm}
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
        >
          Add Item<i className="pi pi-plus ml-2"></i>
        </button>
      </div>
    </div>
  );

  const ensureData = () => {
    if (tableData.length === 0 && id === "laptops") {
      return [
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
        {
          deviceId: "LAPTOP002",
          serialNumber: "MP13567890",
          assignedTo: "Sarah Johnson",
          department: "Design",
          assignmentDate: "2022-05-15",
          specs: "M1 Pro, 16GB RAM, 1TB SSD",
          status: "In Use",
          categoryId: "laptops",
        },
        {
          deviceId: "LAPTOP003",
          serialNumber: "LT45678901",
          assignedTo: "",
          department: "",
          assignmentDate: "",
          specs: "i5, 8GB RAM, 256GB SSD",
          status: "In Storage",
          categoryId: "laptops",
        },
      ];
    }
    return tableData;
  };

  const calculateStats = () => {
    const data = ensureData();
    const totalUnits = data.length;
    const totalCost = assetCategory
      ? Math.round(
          (assetCategory.value / (assetCategory.count || 1)) * totalUnits
        )
      : 45000;
    const inUseCount = data.filter((item) => item.status === "In Use").length;
    const inStorageCount = data.filter(
      (item) => item.status === "In Storage"
    ).length;
    const assignedCount = data.filter(
      (item) => item.assignedTo && item.assignedTo.length > 0
    ).length;
    const avgCostPerUnit =
      totalUnits > 0 ? (totalCost / totalUnits).toFixed(2) : 0;

    return {
      totalUnits,
      totalCost,
      inUseCount,
      inStorageCount,
      assignedCount,
      avgCostPerUnit,
    };
  };

  if (loading) {
    return (
      <div className="px-6 py-5 flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-3"></div>
          <p className="text-gray-600 text-sm">Loading asset items...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="px-6 py-5 mt-20">
      <div className="mb-6">
        <Link
          to="/asset-inventory"
          className="text-blue-500 hover:text-blue-700 text-sm"
        >
          <i className="pi pi-arrow-left mr-1"></i>Back to Asset Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Asset Management {id ? `> ${assetCategory?.name || id}` : ""}
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          View and manage individual asset items
        </p>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_2px_4px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.06)] w-full md:w-[calc(25%-1.5rem)]">
          <h3 className="text-sm text-gray-500 mb-1">Total Units</h3>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">{stats.totalUnits}</div>
            <div className="text-sm font-medium text-green-500">+5%</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_2px_4px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.06)] w-full md:w-[calc(25%-1.5rem)]">
          <h3 className="text-sm text-gray-500 mb-1">Total Cost</h3>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">₹{stats.totalCost}</div>
            <div className="text-sm font-medium text-green-500">+5%</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_2px_4px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.06)] w-full md:w-[calc(25%-1.5rem)]">
          <h3 className="text-sm text-gray-500 mb-1">In Use</h3>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">{stats.inUseCount}</div>
            <div className="text-sm font-medium text-green-500">+3%</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_2px_4px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.06)] w-full md:w-[calc(25%-1.5rem)]">
          <h3 className="text-sm text-gray-500 mb-1">In Storage</h3>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">{stats.inStorageCount}</div>
            <div className="text-sm font-medium text-blue-500">+2%</div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_2px_4px_rgba(0,0,0,0.04)] border border-gray-200 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.06)] w-full md:w-[calc(25%-1.5rem)]">
          <h3 className="text-sm text-gray-500 mb-1">Avg Cost/Unit</h3>
          <div className="flex justify-between items-end">
            <div className="text-2xl font-bold">₹{stats.avgCostPerUnit}</div>
            <div className="text-sm font-medium text-green-500">+1%</div>
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[650px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Add New {assetCategory?.name || id} Item
              </h3>
              <button
                onClick={toggleAddForm}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="pi pi-times"></i>
              </button>
            </div>
            <AddItemForm
              categoryId={id}
              onClose={toggleAddForm}
              onAddItem={addAssetItem}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.06),_0_2px_4px_rgba(0,0,0,0.04)] border border-gray-200 p-4 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1),_0_3px_6px_rgba(0,0,0,0.06)]">
        <AssetTable
          data={ensureData()}
          header={header}
          globalFilter={globalFilter}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <Link
          to="/asset-inventory"
          className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
        >
          <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
        </Link>
      </div>
    </div>
  );
};

export default AssetTablePage;
