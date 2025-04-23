import React, { useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssetItemsByCategory } from "../../store/slices/assetItemSlice";
import logger from "../../utils/logger";
import AssetTable from "./components/AssetTable";

const AssetTablePage = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.assetItems);
  const { categories } = useSelector((state) => state.assetCategories);

  useEffect(() => {
    console.log("Category ID from useParams:", categoryId);
    logger.debug("AssetTablePage useEffect triggered", { categoryId });
    logger.debug("Categories in AssetTablePage:", { categories });
    if (categoryId) {
      dispatch(fetchAssetItemsByCategory(categoryId))
        .then(() =>
          logger.info("Successfully fetched asset items for category", {
            categoryId,
          })
        )
        .catch((err) =>
          logger.error("Failed to fetch asset items", { error: err.message })
        );
    }
  }, [dispatch, categoryId]);

  logger.debug("Rendering AssetTablePage", {
    categoryId,
    items,
    loading,
    error,
  });

  if (!categoryId) {
    logger.error("No categoryId provided in URL", {
      url: window.location.href,
    });
    return <Navigate to="/asset-inventory" replace />;
  }

  const category =
    categories.find((cat) => (cat._id || cat.id) === categoryId) || {};
  logger.debug("Category details", { category });

  const totalUnits = items.length;
  const totalCost = items
    .reduce((sum, item) => sum + (item.purchase_cost || 0), 0)
    .toLocaleString("en-US", { style: "currency", currency: "USD" });
  const inStorage = items.filter((item) => !item.is_assigned).length;

  if (loading) {
    logger.info("AssetTablePage is loading");
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    logger.error("AssetTablePage error", { error });
    return (
      <div className="p-6 text-red-600">
        Error:{" "}
        {error.includes("404")
          ? "Asset items endpoint not found. Please contact support."
          : error}
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

  if (!items.length) {
    logger.info("No asset items found for category", { categoryId });
    return (
      <div className="p-6">
        No assets found for category: {category.name || "Unknown"}
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

  const columns = [
    "asset_tag",
    "serial_number",
    "assigned_at",
    "specifications",
    "viewMore",
  ];
  const header = (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-600">Total Units</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalUnits}</p>
          <span className="text-green-500 text-xs">+5%</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-600">Total Cost</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCost}</p>
          <span className="text-green-500 text-xs">+5%</span>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-600">In Storage</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{inStorage}</p>
          <span className="text-green-500 text-xs">+5%</span>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by ID, IMEI, or employee..."
          className="w-full max-w-md p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onChange={(e) =>
            logger.debug("Search input changed", { value: e.target.value })
          }
        />
        <div className="flex gap-2">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            onClick={() => logger.info("Bulk Upload button clicked")}
          >
            + Bulk Upload...
          </button>
          <Link
            to={`/asset-inventory/${categoryId}/add-item`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            onClick={() => logger.info("Add new item link clicked")}
          >
            + Add new item
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-background-offwhite min-h-screen text-gray-900">
      <div className="mb-6 mt-20">
        <h1 className="text-xl font-semibold text-black">Asset Management</h1>
        <p className="text-sm text-gray-400">
          Asset Management > {category.name || "Laptops"}
        </p>
      </div>
      {header}
      <div className="bg-white rounded-lg shadow-md p-4">
        <AssetTable
          data={items}
          header={null}
          globalFilter=""
          columns={columns}
          specKeys={[]}
          categoryId={categoryId}
        />
        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
            onClick={() => logger.info("Return to Asset Inventory clicked")}
          >
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AssetTablePage;