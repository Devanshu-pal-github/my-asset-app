import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logger from "../../utils/logger";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import EditAssetForm from "./components/EditAssetForm";
import PolicyViewer from "./components/PolicyViewer";
import FilterBar from "./components/FilterBar";

// Mock employees data (to be replaced with API call)
const mockEmployees = [
  {
    _id: "emp1",
    first_name: "John",
    last_name: "Doe",
    department: "Engineering",
    employee_id: "emp1",
    status: "Active",
  },
  {
    _id: "emp2",
    first_name: "Jane",
    last_name: "Smith",
    department: "HR",
    employee_id: "emp2",
    status: "Active",
  },
  {
    _id: "emp3",
    first_name: "Alice",
    last_name: "Johnson",
    department: "Engineering",
    employee_id: "emp3",
    status: "Inactive",
  },
];

// Initial mock categories for testing
const initialMockCategories = [
  {
    _id: "cat1",
    category_name: "Laptops",
    category_type: "hardware",
    description: "High-performance laptops for employees.",
    policies: [
      "Laptops must be returned upon employee termination.",
      "Maintenance required every 6 months.",
    ],
    total_assets: 10,
    assigned_assets: 5,
    under_maintenance: 1,
    unassignable_assets: 0,
    total_cost: 10000,
    is_allotted: false,
  },
  {
    _id: "cat2",
    category_name: "Stationery",
    category_type: "stationery",
    description: "Office stationery items like pens and notebooks.",
    policies: [
      "Stationery items are consumable and not tracked after assignment.",
    ],
    total_assets: 50,
    assigned_assets: 20,
    under_maintenance: 0,
    unassignable_assets: 5,
    total_cost: 500,
    is_allotted: true,
  },
];

// New AllottedCategories Component
const AllottedCategories = ({
  allottedCategories,
  handleAllotmentAssign,
  handleViewDetails,
  handleEdit,
  handleDelete,
}) => {
  return (
     <div className="flex flex-wrap gap-2">
      {allottedCategories.map((category) => {
        const available =
          (category.total_assets || 0) -
          (category.assigned_assets || 0) -
          (category.unassignable_assets || 0);
        const utilizationRate = category.total_assets
          ? ((category.assigned_assets || 0) / category.total_assets) * 100
          : 0;

        return (
          <div
            key={category._id}
            className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200 max-w-[300px] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)] min-h-[370px] flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {category.category_name}
                </h3>
                <p className="text-sm text-gray-500 capitalize">
                  {category.category_type}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewDetails(category)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleEdit(category)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="text-gray-400 hover:text-gray-600 text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Total Items</p>
                  <p className="text-base font-bold text-gray-900">
                    {category.total_assets || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <p className="text-sm text-gray-500">Available</p>
                  <p className="text-base font-bold text-gray-900">
                    {available}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-500">Assigned</p>
                  <p className="text-base font-bold text-gray-900">
                    {category.assigned_assets || 0}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <p className="text-sm text-gray-500">Unassignable</p>
                  <p className="text-base font-bold text-gray-900">
                    {category.unassignable_assets || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-2 mb-6 mt-2">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500">Utilization Rate</p>
                <p className="text-base font-bold text-gray-900">
                  {utilizationRate.toFixed(0)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${utilizationRate}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-auto flex gap-3">
              <button
                className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-200"
                onClick={() => handleAllotmentAssign(category)}
              >
                Assign Asset
              </button>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <p className="text-base font-bold text-gray-900">
                {category.total_cost?.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                }) || "₹0"}
              </p>
              <Link to={`/asset-inventory/${category._id}`}>
                <button className="text-blue-600 hover:underline hover:scale-102 text-sm transition-all duration-200">
                  View Details
                </button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AssetInventory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // State management for categories and employees (mock data for now)
  const [categories, setCategories] = useState(initialMockCategories);
  const [employees, setEmployees] = useState(mockEmployees);
  const [searchTerm, setSearchTerm] = useState(""); // Search term for categories
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(null); // Filter by category
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState(""); // Search term for employees in the modal
  const [showBulkAllotModal, setShowBulkAllotModal] = useState(false);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [notification, setNotification] = useState(null);
  const [filters, setFilters] = useState({
    department: "",
    status: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  // States for modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoryToView, setCategoryToView] = useState(null);

  // Handle new category from AddCategory
  useEffect(() => {
    if (location.state?.newCategory) {
      setCategories((prev) => [
        ...prev,
        { _id: `cat${prev.length + 1}`, ...location.state.newCategory },
      ]);
      setNotification({
        type: "success",
        message: "Category added successfully",
      });
      navigate(location.pathname, { replace: true });
      logger.info("New category added", {
        newCategory: location.state.newCategory,
      });
    }
  }, [location, navigate]);

  // Compute top card stats
  const totalAssets = categories.reduce(
    (sum, cat) => sum + (cat.total_assets || 0),
    0
  );
  const assignedAssets = categories.reduce(
    (sum, cat) => sum + (cat.assigned_assets || 0),
    0
  );
  const totalCost = categories.reduce(
    (sum, cat) => sum + (cat.total_cost || 0),
    0
  );

  // Filter categories based on search term and selected category
  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.category_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategoryFilter
      ? category.category_name === selectedCategoryFilter
      : true;
    return matchesSearch && matchesCategory;
  });

  const allottedCategories = filteredCategories.filter(
    (cat) => cat.is_allotted
  );
  const regularCategories = filteredCategories.filter(
    (cat) => !cat.is_allotted
  );

  // Filter employees based on search term and filters in the modal
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = `${employee.first_name} ${employee.last_name}`
      .toLowerCase()
      .includes(employeeSearchTerm.toLowerCase());
    const matchesDepartment = filters.department
      ? employee.department === filters.department
      : true;
    const matchesStatus = filters.status
      ? employee.status === filters.status
      : true;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
    logger.info("Employee selection toggled", { employeeId });
  };

  const handleBulkAllot = async () => {
    try {
      logger.info("Bulk allotting categories", { selectedEmployees });
      setNotification({
        type: "success",
        message: `Successfully allotted to ${selectedEmployees.length} employees`,
      });
      setShowBulkAllotModal(false);
      setSelectedEmployees([]);
    } catch (err) {
      logger.error("Bulk allotment failed", { error: err.message });
      setNotification({
        type: "error",
        message: "Bulk allotment failed",
      });
    }
  };

  const handleAllotmentAssign = (category) => {
    setSelectedCategory(category);
    setShowAllotmentModal(true);
    setEmployeeSearchTerm(""); // Reset search term when opening modal
    setFilters({ department: "", status: "" }); // Reset filters
    logger.info("Opening allotment modal for category", {
      categoryId: category._id,
    });
  };

  const confirmAllotment = async (employeeId) => {
    try {
      logger.info("Allotting item", {
        categoryId: selectedCategory._id,
        employeeId,
      });
      setNotification({
        type: "success",
        message: "Successfully allotted to employee",
      });
      setShowAllotmentModal(false);
      setSelectedCategory(null);
      // Update the mock data to reflect the new assignment
      setCategories((prev) =>
        prev.map((cat) =>
          cat._id === selectedCategory._id
            ? {
                ...cat,
                assigned_assets: (cat.assigned_assets || 0) + 1,
              }
            : cat
        )
      );
    } catch (err) {
      logger.error("Allotment failed", { error: err.message });
      setNotification({
        type: "error",
        message: "Allotment failed",
      });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    logger.info("Filter applied", { filter: { [name]: value } });
  };

  // Handlers for modals
  const handleViewDetails = (category) => {
    setCategoryToView(category);
    setShowDetailsModal(true);
    logger.info("Opening details modal for category", {
      categoryId: category._id,
    });
  };

  const handleEdit = (category) => {
    setCategoryToEdit(category);
    setShowEditModal(true);
    logger.info("Opening edit modal for category", {
      categoryId: category._id,
    });
  };

  const handleDelete = (category) => {
    setCategoryToDelete(category);
    setShowDeleteModal(true);
    logger.info("Opening delete confirmation modal for category", {
      categoryId: category._id,
    });
  };

  const handleUpdateCategory = (updatedCategory) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat._id === categoryToEdit._id ? { ...cat, ...updatedCategory } : cat
      )
    );
    setShowEditModal(false);
    setCategoryToEdit(null);
    setNotification({
      type: "success",
      message: "Category updated successfully",
    });
    logger.info("Category updated", { categoryId: categoryToEdit._id });
  };

  const handleConfirmDelete = () => {
    setCategories((prev) =>
      prev.filter((cat) => cat._id !== categoryToDelete._id)
    );
    setShowDeleteModal(false);
    setCategoryToDelete(null);
    setNotification({
      type: "success",
      message: "Category deleted successfully",
    });
    logger.info("Category deleted", { categoryId: categoryToDelete._id });
  };

  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1 mt-20 p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Asset Management System
            </h1>
            <p className="text-sm text-gray-500">
              Overview your asset management system
            </p>
          </div>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200">
            <h3 className="text-sm font-medium text-gray-500">Total Assets</h3>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900">{totalAssets}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200">
            <h3 className="text-sm font-medium text-gray-500">
              Assigned Assets
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900">
                {assignedAssets}
              </p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200">
            <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
            <div className="flex items-center gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900">
                {totalCost.toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* FilterBar, Add Category Button, and Bulk Allot Button in One Line */}
        <div className="mt-6 flex justify-between items-center gap-4 mb-6">
          <FilterBar
            searchText={searchTerm}
            onSearchChange={(value) => {
              setSearchTerm(value);
              logger.info("Category search term updated", {
                searchTerm: value,
              });
            }}
            selectedCategory={selectedCategoryFilter}
            onCategoryChange={(value) => {
              setSelectedCategoryFilter(value);
              logger.info("Category filter updated", {
                selectedCategory: value,
              });
            }}
            categories={categories}
          />
          <div className="flex gap-4">
            <button
              onClick={() => {
                navigate("/asset-inventory/add-category");
                logger.info("Add new asset button clicked");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-102 transition-all duration-200 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                viewBox="0 0 24 24"
                className="mr-2"
              >
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              Add Category
            </button>
            {allottedCategories.length > 0 && (
              <button
                className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-4 rounded-md transition-all duration-200"
                onClick={() => {
                  setShowBulkAllotModal(true);
                  logger.info("Bulk allot modal opened");
                }}
              >
                Bulk Allot Categories
              </button>
            )}
          </div>
        </div>

        {/* Bulk Allot Modal */}
        {showBulkAllotModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl z-50">
              <h3 className="text-lg font-semibold text-gray-800">
                Bulk Allotment
              </h3>
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-800">
                  Select Allotted Categories
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto">
                  {allottedCategories.map((category) => (
                    <label key={category._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(category._id)}
                        onChange={() => handleEmployeeSelect(category._id)}
                        className="mr-2"
                      />
                      {category.category_name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-4">
                <h4 className="text-md font-semibold text-gray-800">
                  Select Employees
                </h4>
                <div className="grid grid-cols-2 gap-4 mt-2 max-h-64 overflow-y-auto">
                  {employees.map((employee) => (
                    <label key={employee._id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(employee._id)}
                        onChange={() => handleEmployeeSelect(employee._id)}
                        className="mr-2"
                      />
                      {employee.first_name} {employee.last_name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  onClick={() => {
                    setShowBulkAllotModal(false);
                    logger.info("Bulk allot modal closed");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  onClick={handleBulkAllot}
                  disabled={selectedEmployees.length === 0}
                >
                  Allot
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Allotment Modal */}
        {showAllotmentModal && selectedCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-3xl z-50">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Allot Items - {selectedCategory.category_name}
              </h3>

              {/* Search and Filter Section */}
              <div className="flex justify-between items-center mb-4">
                <div className="relative w-1/2">
                  <input
                    type="text"
                    placeholder="Search employees..."
                    value={employeeSearchTerm}
                    onChange={(e) => {
                      setEmployeeSearchTerm(e.target.value);
                      logger.info("Employee search term updated", {
                        searchTerm: e.target.value,
                      });
                    }}
                    className="pl-10 p-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    🔍
                  </span>
                </div>
                <button
                  className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
                  onClick={() => {
                    setShowFilters(!showFilters);
                    logger.info("Filter button toggled in allotment modal", {
                      showFilters: !showFilters,
                    });
                  }}
                >
                  <span>📏</span> Filter
                </button>
              </div>

              {/* Filter Options */}
              {showFilters && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Department
                      </label>
                      <select
                        name="department"
                        value={filters.department}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Departments</option>
                        <option value="Engineering">Engineering</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Table */}
              <div className="overflow-x-auto max-h-64">
                <table className="w-full text-sm text-left text-gray-500">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Employee Name</th>
                      <th className="px-6 py-3">Employee ID</th>
                      <th className="px-6 py-3">Department</th>
                      <th className="px-6 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-6 py-4 text-center text-gray-500"
                        >
                          No employees found.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((employee) => (
                        <tr
                          key={employee._id}
                          className="bg-white border-b hover:bg-gray-100 transition-colors duration-200"
                        >
                          <td className="px-6 py-4">
                            {employee.first_name} {employee.last_name}
                          </td>
                          <td className="px-6 py-4">{employee.employee_id}</td>
                          <td className="px-6 py-4">{employee.department}</td>
                          <td className="px-6 py-4">
                            <button
                              className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-1 px-3 rounded-lg transition-all duration-200"
                              onClick={() => confirmAllotment(employee._id)}
                            >
                              Assign
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end gap-2">
                <button
                  className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200"
                  onClick={() => {
                    setShowAllotmentModal(false);
                    logger.info("Allotment modal closed");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals for Info, Edit, Delete */}
        {showDetailsModal && categoryToView && (
          <PolicyViewer
            description={categoryToView.description}
            policies={categoryToView.policies || []}
            isOpen={showDetailsModal}
            onClose={() => setShowDetailsModal(false)}
            title={`Details - ${categoryToView.category_name}`}
          />
        )}

        {showEditModal && categoryToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl z-50 max-h-[90vh] overflow-y-auto">
              <EditAssetForm
                asset={categoryToEdit}
                onClose={() => setShowEditModal(false)}
                onUpdateAsset={handleUpdateCategory}
              />
            </div>
          </div>
        )}

        {showDeleteModal && categoryToDelete && (
          <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            selectedAssets={[categoryToDelete]}
          />
        )}

        {/* Regular Categories Section */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Regular Categories
        </h2>
        {regularCategories.length === 0 ? (
          <div className="text-gray-600 mb-8">
            No regular categories available.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mb-8">
            {regularCategories.map((category) => {
              const available =
                (category.total_assets || 0) -
                (category.assigned_assets || 0) -
                (category.under_maintenance || 0);
              const utilizationRate = category.total_assets
                ? ((category.assigned_assets || 0) / category.total_assets) *
                  100
                : 0;

              return (
                <div
                  key={category._id}
                  className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md hover:scale-102 transition-all duration-200 max-w-[300px] md:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.5rem)] min-h-[370px] flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {category.category_name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {category.category_type}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(category)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v2h-2V7zm0 4h2v6h-2v-6z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6 mt-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Total Items:</p>
                        <p className="text-base font-bold text-gray-900">
                          {category.total_assets || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <p className="text-sm text-gray-500">Available:</p>
                        <p className="text-base font-bold text-gray-900">
                          {available}
                        </p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-gray-500">Assigned:</p>
                        <p className="text-base font-bold text-gray-900">
                          {category.assigned_assets || 0}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <p className="text-sm text-gray-500">Maintenance:</p>
                        <p className="text-base font-bold text-gray-900">
                          {category.under_maintenance || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-6 mt-2">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">Utilization Rate:</p>
                      <p className="text-base font-bold text-gray-900">
                        {utilizationRate.toFixed(0)}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${utilizationRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-3">
                    <Link to={`/asset-inventory/${category._id}/assign`}>
                      <button className="bg-blue-600 hover:bg-blue-700 hover:scale-102 text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-200">
                        Assign Asset
                      </button>
                    </Link>
                    <Link to={`/asset-inventory/${category._id}/unassign`}>
                      <button className="bg-red-400 hover:bg-red-500 hover:scale-102 text-white text-sm font-medium py-2 px-4 rounded-md transition-all duration-200">
                        Unassign Asset
                      </button>
                    </Link>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-base font-bold text-gray-900">
                      {category.total_cost?.toLocaleString("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }) || "₹0"}
                    </p>
                    <Link to={`/asset-inventory/${category._id}`}>
                      <button className="text-blue-600 hover:underline hover:scale-102 text-sm transition-all duration-200">
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Allotted Categories Section */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Allotted Categories
        </h2>
        {allottedCategories.length === 0 ? (
          <div className="text-gray-600">No allotted categories available.</div>
        ) : (
          <AllottedCategories
            allottedCategories={allottedCategories}
            handleAllotmentAssign={handleAllotmentAssign}
            handleViewDetails={handleViewDetails}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default AssetInventory;
