import React, { useEffect, useState } from "react";
import { useParams, Link, Navigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchAssetItemsByCategory } from "../../store/slices/assetItemSlice";
import logger from "../../utils/logger";
import AssetTable from "./components/AssetTable";
import { paginate, sortData, filterData } from "./components/tableUtils";
import { mockAssets, mockCategories } from "../../components/mockData";

const AssetTablePage = () => {
  const { categoryId } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const { items, loading, error } = useSelector((state) => state.assetItems);
  const { categories } = useSelector((state) => state.assetCategories);
  const [globalFilter, setGlobalFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState("asset_id"); // Changed from asset_tag to asset_id
  const [sortOrder, setSortOrder] = useState("asc");
  const [activeTab, setActiveTab] = useState("assignment");
  const [showEditModal, setShowEditModal] = useState(false);
  const [totalAssets, setTotalAssets] = useState(0);
  const [unassignableAssets, setUnassignableAssets] = useState(0);
  const [notes, setNotes] = useState("");
  const [editHistory, setEditHistory] = useState([
    {
      id: "edit1",
      type: "edit",
      edit_date: "2025-04-20",
      change_type: "Category Update",
      details: "Total Assets changed from 40 to 50; Unassignable Assets changed from 3 to 5",
      notes: "Increased stock due to new shipment; marked some as unassignable due to defects",
    },
    {
      id: "edit2",
      type: "edit",
      edit_date: "2025-04-25",
      change_type: "Category Update",
      details: "Unassignable Assets changed from 5 to 7",
      notes: "Found additional defective items during inventory check",
    },
  ]);
  const itemsPerPage = 10;

  // Mock history data
  const mockAssignmentHistory = [
    {
      id: "assign1",
      employee: "John Doe",
      employee_id: "emp1",
      department: "Engineering",
      assigned_at: "2025-04-01",
    },
    {
      id: "assign2",
      employee: "Jane Smith",
      employee_id: "emp2",
      department: "HR",
      assigned_at: "2025-03-15",
    },
  ];

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

  // Use mock data as fallback if items are empty or there's an error
  const effectiveItems = items.length > 0 ? items : mockAssets.filter(asset => asset.category_id === categoryId);
  const effectiveCategories = categories.length > 0 ? categories : mockCategories;
  const category = effectiveCategories.find((cat) => (cat._id || cat.id) === categoryId) || { name: "Unknown", is_allotted: false };
  logger.debug("Category details", { category });

  // Check if the category is allotted
  const isAllotted = category.is_allotted;

  // Transform items to map backend fields to frontend expectations
  const transformedItems = effectiveItems.map((item) => ({
    ...item,
    assigned_at: item.current_assignment_date || null,
    status: item.status || "available",
  }));

  const totalUnits = transformedItems.length;
  const totalCost = transformedItems
    .reduce((sum, item) => sum + (item.purchase_cost || 0), 0)
    .toLocaleString("en-US", { style: "currency", currency: "USD" });
  const inStorage = transformedItems.filter(
    (item) => item.status === "available" && !item.has_active_assignment
  ).length;

  const filteredItems = filterData(transformedItems, globalFilter, [
    "asset_id", // Changed from asset_tag to asset_id
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
    // Log changes to edit history
    const changes = [];
    const prevTotalAssets = totalUnits; // Previous total assets (before edit)
    const prevUnassignableAssets = category.unassignable_assets || 0; // Previous unassignable assets

    if (totalAssets !== prevTotalAssets) {
      changes.push(`Total Assets changed from ${prevTotalAssets} to ${totalAssets}`);
    }
    if (unassignableAssets !== prevUnassignableAssets) {
      changes.push(`Unassignable Assets changed from ${prevUnassignableAssets} to ${unassignableAssets}`);
    }

    if (changes.length > 0) {
      const editRecord = {
        id: `edit${editHistory.length + 1}`,
        type: "edit",
        edit_date: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
        change_type: "Category Update",
        details: changes.join("; "),
        notes: notes || "No notes provided",
      };
      setEditHistory((prev) => [...prev, editRecord]);
      logger.info("Added new edit history record", { editRecord });
    }

    // Update the category with new values (mock update for now)
    logger.info("Saving category updates", { categoryId, totalAssets, unassignableAssets, notes });
    setShowEditModal(false);
  };

  // Sort edit history by date, newest first
  const sortedEditHistory = [...editHistory].sort(
    (a, b) => new Date(b.edit_date) - new Date(a.edit_date)
  );

  if (loading && items.length === 0) {
    logger.info("AssetTablePage is loading");
    return <div className="p-6">Loading...</div>;
  }

  if (error && items.length === 0) {
    logger.error("AssetTablePage error", { error });
    return (
      <div className="p-6 text-red-600">
        Error:{" "}
        {error.includes("404")
          ? "Asset items endpoint not found. Using mock data."
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

  if (!transformedItems.length) {
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
    "asset_id", // Changed from asset_tag to asset_id
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
          Asset Management > {category.name || "Unknown"}
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
        {isAllotted ? (
          <div>
            <div className="flex border-b border-gray-200 mb-4">
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "assignment"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  logger.debug("Switching to assignment tab");
                  setActiveTab("assignment");
                }}
              >
                Assignment History
              </button>
              <button
                className={`px-4 py-2 text-sm font-medium ${
                  activeTab === "maintenance"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  logger.debug("Switching to maintenance tab");
                  setActiveTab("maintenance");
                }}
              >
                Edit History
              </button>
            </div>

            {activeTab === "assignment" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Employee</th>
                      <th className="px-6 py-3">Employee ID</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Assigned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAssignmentHistory.map((record) => (
                      <tr key={record.id} className="bg-white border-b">
                        <td className="px-6 py-4">{record.employee}</td>
                        <td className="px-6 py-4">{record.employee_id}</td>
                        <td className="px-6 py-4">{record.department}</td>
                        <td className="px-6 py-4">{record.assigned_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "maintenance" && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Details</th>
                      <th className="px-6 py-3">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEditHistory.map((record) => {
                      const truncatedNotes =
                        record.notes.length > 20
                          ? `${record.notes.substring(0, 20)}...`
                          : record.notes;
                      return (
                        <tr key={record.id} className="bg-white border-b">
                          <td className="px-6 py-4">{record.edit_date}</td>
                          <td className="px-6 py-4">{record.details}</td>
                          <td className="px-6 py-4" title={record.notes}>
                            {truncatedNotes}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}

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