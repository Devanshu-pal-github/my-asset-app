import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssetItemsByCategory } from "../../store/slices/assetItemSlice";
import logger from "../../utils/logger";
import AssetTable from "./components/AssetTable";
import { paginate, sortData, filterData } from "./components/tableUtils";

const AssetTablePage = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { items, loading, error } = useSelector((state) => state.assetItems);
  const { categories } = useSelector((state) => state.assetCategories);
  const [globalFilter, setGlobalFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("asset_id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showEditModal, setShowEditModal] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const [unassignableAssets, setUnassignableAssets] = useState(0);
  const [notes, setNotes] = useState("");
  const itemsPerPage = 10;

  useEffect(() => {
    logger.debug("AssetTablePage useEffect triggered", { categoryId });
    logger.debug("Categories in AssetTablePage:", { categories });
    if (categoryId) {
      logger.info("Dispatching fetchAssetItemsByCategory action", { categoryId });
      dispatch(fetchAssetItemsByCategory(categoryId))
        .then(() => {
          logger.info("Successfully fetched asset items for category", { categoryId });
        })
        .catch((err) => {
          logger.error("Failed to fetch asset items", { error: err.message });
        });
    }
  }, [dispatch, categoryId]);

  // Re-fetch assets if navigating back from AddItemPage after a successful submission
  useEffect(() => {
    if (location.state?.assetAdded && categoryId) {
      logger.debug("Re-fetching assets after adding a new item", { categoryId });
      dispatch(fetchAssetItemsByCategory(categoryId))
        .then(() => {
          logger.info("Successfully re-fetched asset items after adding a new item", { categoryId });
        })
        .catch((err) => {
          logger.error("Failed to re-fetch asset items", { error: err.message });
        });
      // Clear the state to prevent repeated re-fetches
      logger.debug("Clearing navigation state to prevent repeated re-fetches");
      window.history.replaceState({}, document.title);
    }
  }, [location.state, dispatch, categoryId]);

  logger.debug("Rendering AssetTablePage", { categoryId, items, loading, error });

  if (!categoryId) {
    logger.error("No categoryId provided in URL", { url: window.location.href });
    return <Navigate to="/asset-inventory" replace />;
  }

  const category = categories.find((cat) => (cat._id || cat.id) === categoryId) || { name: "Unknown", is_allotted: false };
  logger.debug("Category details", { category });

  // Check if the category is allotted
  const isAllotted = category.is_allotted;

  const totalUnits = items.length;
  const totalCost = items
    .reduce((sum, item) => sum + (item.purchase_cost || 0), 0)
    .toLocaleString("en-US", { style: "currency", currency: "USD" });
  const inStorage = items.filter(
    (item) => item.status === "available" && !item.has_active_assignment
  ).length;

  const filteredItems = filterData(items, globalFilter, [
    "asset_id",
    "name",
    "status",
    "serial_number",
  ]);
  const sortedItems = sortData(filteredItems, sortField, sortOrder);
  const paginatedItems = paginate(sortedItems, currentPage, itemsPerPage);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const handleSort = (field) => {
    const newSortOrder = sortField === field && sortOrder === "asc" ? "desc" : "asc";
    logger.debug("Sorting table", { field, newSortOrder });
    setSortField(field);
    setSortOrder(newSortOrder);
  };

  const handlePageChange = (page) => {
    logger.debug("Changing page", { currentPage: page });
    setCurrentPage(page);
  };

  const handleEditSave = () => {
    const changes = [];
    const prevTotalAssets = totalUnits;
    const prevUnassignableAssets = category.unassignable_assets || 0;

    if (totalAssets !== prevTotalAssets) {
      changes.push(`Total Assets changed from ${prevTotalAssets} to ${totalAssets}`);
    }
    if (unassignableAssets !== prevUnassignableAssets) {
      changes.push(`Unassignable Assets changed from ${prevUnassignableAssets} to ${unassignableAssets}`);
    }

    logger.info("Saving category updates", { categoryId, totalAssets, unassignableAssets, notes });
    setShowEditModal(false);
  };

  if (loading && items.length === 0) {
    logger.info("AssetTablePage is loading");
    return <div className="p-6">Loading...</div>;
  }

  if (error && items.length === 0) {
    logger.error("AssetTablePage error", { error });
    return (
      <div className="p-6 text-red-600">
        Error: {error}
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

  const header = (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-600">Total Units</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalUnits}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-600">Total Cost</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalCost}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-600">In Storage</h2>
          <p className="text-2xl font-bold text-gray-900 mt-1">{inStorage}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <input
          type="text"
          placeholder="Search by ID, name, or status..."
          className="w-full max-w-md p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            logger.debug("Search input changed", { value: e.target.value });
          }}
        />
        <div className="flex gap-2">
          {isAllotted ? (
            <>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                onClick={() => {
                  logger.debug("Opening edit modal", { totalUnits });
                  setTotalAssets(totalUnits);
                  setUnassignableAssets(0);
                  setNotes("");
                  setShowEditModal(true);
                }}
              >
                Edit Category
              </button>
              <Link
                to={`/asset-inventory/${categoryId}/add-allotted-items`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                + Add New Item
              </Link>
            </>
          ) : (
            <>
              <Link
                to={`/asset-inventory/${categoryId}/bulk-upload`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                + Bulk Upload...
              </Link>
              <Link
                to={`/asset-inventory/${categoryId}/add-item`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                + Add New Item
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const columns = [
    "asset_id",
    "name",
    "serial_number",
    "status",
    "specifications",
    "actions",
  ];

  return (
    <div className="p-6 bg-background-offwhite min-h-screen text-gray-900">
      <div className="mb-6 mt-20">
        <h1 className="text-xl font-semibold text-black">Asset Management</h1>
        <p className="text-sm text-gray-400">
          Asset Management &gt; {category.name || "Unknown"}
        </p>
      </div>
      {header}

      {/* Edit Modal for Allotted Categories */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Edit Category - {category.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Total Assets
              </label>
              <input
                type="number"
                value={totalAssets}
                onChange={(e) => {
                  logger.debug("Total assets changed", { value: e.target.value });
                  setTotalAssets(Number(e.target.value));
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Unassignable Assets
              </label>
              <input
                type="number"
                value={unassignableAssets}
                onChange={(e) => {
                  logger.debug("Unassignable assets changed", { value: e.target.value });
                  setUnassignableAssets(Number(e.target.value));
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => {
                  logger.debug("Notes changed", { value: e.target.value });
                  setNotes(e.target.value);
                }}
                className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="4"
                placeholder="Enter any notes for this update..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => {
                  logger.debug("Closing edit modal");
                  setShowEditModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={handleEditSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-4">
        <AssetTable
          data={paginatedItems}
          header={null}
          globalFilter={globalFilter}
          columns={columns}
          specKeys={[]}
          categoryId={categoryId}
          category={category}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder}
        />
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredItems.length)} of{" "}
            {filteredItems.length} assets
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (page) => (
                <button
                  key={page}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              )
            )}
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <Link
            to="/asset-inventory"
            className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AssetTablePage;