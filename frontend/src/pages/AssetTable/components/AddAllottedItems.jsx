// File: src/pages/AssetTable/components/AddAllottedItems.jsx
import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import logger from "../../../utils/logger";

const AddAllottedItems = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: "",
    count: 1,
    purchaseCost: "",
    purchaseDate: "",
  });
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 3) {
      setError("You can upload a maximum of 3 documents.");
      return;
    }
    setDocuments(files);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.itemName || !formData.count || !formData.purchaseCost || !formData.purchaseDate) {
      setError("Please fill in all required fields.");
      return;
    }
    if (formData.count < 1) {
      setError("Count must be at least 1.");
      return;
    }

    // Mock API call to add items
    logger.info("Adding new items for allotted category", {
      categoryId,
      formData,
      documents: documents.map((doc) => doc.name),
    });

    // Simulate success
    setSuccess("Items added successfully!");
    setError("");
    setTimeout(() => {
      navigate(`/asset-inventory/${categoryId}`);
    }, 1500);
  };

  return (
    <div className="p-6 bg-background-offwhite min-h-screen text-gray-900">
      <div className="mb-6 mt-20">
        <h1 className="text-xl font-semibold text-black">Add New Items</h1>
        <p className="text-sm text-gray-400">
          Asset Management > Add Items for Allotted Category
        </p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Add Items to Allotted Category
        </h2>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Item Name *
                </label>
                <input
                  type="text"
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Count *
                </label>
                <input
                  type="number"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purchase Cost *
                </label>
                <input
                  type="number"
                  name="purchaseCost"
                  value={formData.purchaseCost}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter purchase cost"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Purchase Date *
                </label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={formData.purchaseDate}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Document Upload */}
          <div className="mb-6">
            <h3 className="text-md font-semibold text-gray-800 mb-2">
              Upload Documents
            </h3>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload up to 3 documents (PDF, JPG, PNG).
            </p>
            {documents.length > 0 && (
              <ul className="mt-2 text-sm text-gray-600">
                {documents.map((doc, index) => (
                  <li key={index}>{doc.name}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Link
              to={`/asset-inventory/${categoryId}`}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAllottedItems;