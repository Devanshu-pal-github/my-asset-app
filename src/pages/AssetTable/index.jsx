import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import AssetTable from "./components/AssetTable";

const AssetTablePage = ({ assetItems, assetCategories, loading, addAssetItem }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [assetItemsState, setAssetItemsState] = useState(assetItems);

  useEffect(() => {
    if (id && assetCategories.length > 0) {
      const category = assetCategories.find((cat) => cat.id === id);
      setSelectedCategory(category || null);
    }
    // Update assetItemsState only when assetItems changes or on navigation back
    setAssetItemsState(assetItems);
  }, [id, assetCategories, assetItems]);

  const header = (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-gray-800">{selectedCategory?.name || id} Inventory</h2>
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
        <Link
          to={`/asset-inventory/${id}/add-item`}
          className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
        >
          Add Item<i className="pi pi-plus ml-2"></i>
        </Link>
        <button
          onClick={() => navigate(`/asset-inventory/${id}/bulk-upload`)}
          className="flex items-center px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600"
        >
          Bulk Upload<i className="pi pi-upload ml-2"></i>
        </button>
      </div>
    </div>
  );

  const ensureData = () => assetItemsState.filter((item) => item.categoryId === id);

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

  return (
    <div className="px-6 py-5 mt-20">
      <div className="mb-6">
        <Link to="/asset-inventory" className="text-blue-500 hover:text-blue-700 text-sm">
          <i className="pi pi-arrow-left mr-1"></i>Back to Asset Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">
          Asset Management {id ? `> ${selectedCategory?.name || id}` : ""}
        </h1>
        <p className="text-gray-600 text-sm mt-1">View and manage individual asset items</p>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <AssetTable
          data={ensureData()}
          header={header}
          globalFilter={globalFilter}
          columns={["deviceId", "name", "department", "status", "assignedTo", "specifications", "viewMore"]}
          specKeys={selectedCategory?.specifications?.map((spec) => spec.key) || []}
          categoryId={id}
        />
      </div>
      <div className="mt-6 flex justify-end">
        <Link to="/asset-inventory" className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50">
          <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
        </Link>
      </div>
    </div>
  );
};

export default AssetTablePage;