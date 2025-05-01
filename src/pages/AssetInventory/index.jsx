import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchAssetCategories } from "../../store/slices/assetCategorySlice";
import logger from "../../utils/logger";

const AssetInventory = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(
    (state) => state.assetCategories
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);

  useEffect(() => {
    logger.debug("AssetInventory useEffect triggered");
    dispatch(fetchAssetCategories());
  }, [dispatch]);

  // Compute top card stats
  const totalAssets = categories.reduce(
    (sum, cat) => sum + (cat.total_items || 0),
    0
  );
  const activeAssets = categories.reduce(
    (sum, cat) => sum + (cat.assigned || 0),
    0
  );
  const totalValue = categories.reduce(
    (sum, cat) => sum + (cat.total_cost || 0),
    0
  );

  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCategorySelect = (categoryId) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleBulkAssign = async () => {
    try {
      logger.info("Bulk assigning categories", {
        selectedCategories,
        selectedEmployees,
      });
      // TODO: API call to assign selected categories to selected employees
      setShowBulkAssignModal(false);
      setSelectedCategories([]);
      setSelectedEmployees([]);
    } catch (err) {
      logger.error("Bulk assignment failed", { error: err.message });
    }
  };

  const handleAllotmentAssign = (category) => {
    setSelectedCategory(category);
    setShowAllotmentModal(true);
  };

  const confirmAllotment = async (employeeId) => {
    try {
      logger.info("Allotting item", {
        categoryId: selectedCategory._id,
        employeeId,
      });
      // TODO: API call to allot item to employee
      setShowAllotmentModal(false);
      setSelectedCategory(null);
    } catch (err) {
      logger.error("Allotment failed", { error: err.message });
    }
  };

  if (loading) return <div className="p-6 text-gray-600">Loading...</div>;
  if (error) {
    logger.error("AssetInventory error", { error });
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="mt-24 p-6">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Total Assets</h3>
          <p className="text-3xl font-bold text-gray-900">{totalAssets}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Active Assets</h3>
          <p className="text-3xl font-bold text-gray-900">{activeAssets}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800">Total Value</h3>
          <p className="text-3xl font-bold text-gray-900">
            ${totalValue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Search, Filter, and Buttons */}
      <div className="flex justify-between items-center mb-5">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg text-gray-700"
          />
          <button className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors">
            Filter
          </button>
        </div>
        <div className="flex gap-3">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            onClick={() => setShowBulkAssignModal(true)}
          >
            Bulk Assign Categories
          </button>
          <Link to="/asset-inventory/add-category">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
              + Add New Category
            </button>
          </Link>
        </div>
      </div>

      {/* Bulk Assign Modal */}
      {showBulkAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800">
              Bulk Category Assignment
            </h3>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">
                Select Categories
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto">
                {categories.map((category) => (
                  <label key={category._id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category._id)}
                      onChange={() => handleCategorySelect(category._id)}
                      className="mr-2"
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">
                Select Employees
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto">
                {/* TODO: Fetch employees dynamically */}
                {[
                  { id: "emp1", name: "Employee 1" },
                  { id: "emp2", name: "Employee 2" },
                ].map((employee) => (
                  <label key={employee.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleEmployeeSelect(employee.id)}
                      className="mr-2"
                    />
                    {employee.name}
                  </label>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => setShowBulkAssignModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={handleBulkAssign}
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allotment Modal */}
      {showAllotmentModal && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-800">
              Allot Items - {selectedCategory.name}
            </h3>
            <div className="mt-4">
              <h4 className="text-md font-semibold text-gray-800">
                Select Employees
              </h4>
              <div className="grid grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto">
                {/* TODO: Fetch employees dynamically */}
                {[
                  { id: "emp1", name: "Employee 1" },
                  { id: "emp2", name: "Employee 2" },
                ].map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between"
                  >
                    <span>{employee.name}</span>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-3 rounded-lg transition-colors"
                      onClick={() => confirmAllotment(employee.id)}
                    >
                      Assign
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                onClick={() => setShowAllotmentModal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const available =
            (category.total_items || 0) -
            (category.assigned || 0) -
            (category.under_maintenance || 0);
          const utilizationRate = category.total_items
            ? ((category.assigned || 0) / category.total_items) * 100
            : 0;

          return (
            <div
              key={category._id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {category.name}
                </h3>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  <strong>Total Items:</strong> {category.total_items || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Assigned:</strong> {category.assigned || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Available:</strong> {available}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Under Maintenance:</strong>{" "}
                  {category.under_maintenance || 0}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Utilization Rate:</strong>{" "}
                  {utilizationRate.toFixed(2)}%
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Total Cost:</strong> $
                  {category.total_cost?.toLocaleString() || 0}
                </p>
              </div>
              <div className="mt-4 flex gap-2">
                {category.is_allotment ? (
                  <>
                    <button
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                      onClick={() => handleAllotmentAssign(category)}
                    >
                      Assign
                    </button>
                    <Link to={`/asset-inventory/${category._id}/details`}>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        View Details
                      </button>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to={`/asset-inventory/${category._id}/assign`}>
                      <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Assign
                      </button>
                    </Link>
                    <Link to={`/asset-inventory/${category._id}/unassign`}>
                      <button className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        Unassign
                      </button>
                    </Link>
                    
                    <Link to={`/asset-inventory/${category._id}`}>
                      <button className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                        View Details
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssetInventory;
