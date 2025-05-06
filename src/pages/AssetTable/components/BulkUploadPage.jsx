import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Papa from "papaparse";
import logger from "../../../utils/logger";

// Required fields for validation
const REQUIRED_FIELDS = ["Device Name", "Serial No."];

const BulkUploadPage = ({ assetCategories = [], addAssetItem }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [file, setFile] = useState(null);
  const [images, setImages] = useState([]);
  const [mappedColumns, setMappedColumns] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [purchaseInfo, setPurchaseInfo] = useState({
    vendorName: "",
    invoiceBillNumber: "",
    purchaseDate: "",
    totalPurchaseValue: "",
    paymentMethod: "",
    warrantyDuration: "",
    purchaseOrderNumber: "",
    assetCategory: "",
    locationDepartment: "",
    purchasedBy: "",
    supplierContact: "",
    gstTaxId: "",
    currency: "",
  });
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!assetCategories.length) {
      logger.warn("No asset categories provided to BulkUploadPage");
      setError("No asset categories available. Please ensure categories are loaded.");
      return;
    }
    if (id) {
      const category = assetCategories.find((cat) => cat.id === id);
      if (!category) {
        logger.warn("Category not found for id", { id });
        setError(`Category with ID ${id} not found.`);
        return;
      }
      setSelectedCategory(category);
      setPurchaseInfo((prev) => ({ ...prev, assetCategory: category?.id || "" }));
    }
  }, [id, assetCategories]);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) {
      setError("No file selected.");
      setNotification(null);
      return;
    }
    if (uploadedFile.type === "text/csv" || uploadedFile.name.endsWith(".csv")) {
      setFile(uploadedFile);
      setError(null);
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          if (!result.data.length) {
            setError("CSV file is empty or invalid.");
            setNotification(null);
            return;
          }
          const headers = result.meta.fields;
          if (!headers || headers.length === 0) {
            setError("CSV file has no valid headers.");
            setNotification(null);
            return;
          }
          const initialMapping = {};
          headers.forEach((header) => {
            initialMapping[header] = header;
          });
          setMappedColumns(initialMapping);
          setPreviewData(result.data.slice(0, 5));
          logger.debug("Parsed CSV file", { headers, rows: result.data.length });
          setNotification({ type: "success", message: "CSV file loaded successfully." });
        },
        error: (err) => {
          setError("Failed to parse CSV file: " + err.message);
          logger.error("CSV parsing error", { error: err.message });
          setNotification(null);
        },
      });
    } else {
      setError("Please upload a valid CSV file (.csv format).");
      setNotification(null);
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) {
      setError("No images selected.");
      setNotification(null);
      return;
    }
    const imagePreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...imagePreviews]);
    setError(null);
    logger.debug("Uploaded images", { count: files.length });
    setNotification({ type: "success", message: `${files.length} image(s) uploaded successfully.` });
  };

  const handleMapColumn = (systemField, excelColumn) => {
    setMappedColumns((prev) => ({ ...prev, [systemField]: excelColumn }));
    logger.debug("Mapped column", { systemField, excelColumn });
  };

  const validateMapping = () => {
    for (const field of REQUIRED_FIELDS) {
      if (!mappedColumns[field] || mappedColumns[field] === "Select") {
        return `Please map the required field: ${field}`;
      }
    }
    return null;
  };

  const handleSubmit = () => {
    setNotification(null);

    if (!file || !previewData.length) {
      setError("Please upload a valid CSV file with data.");
      return;
    }
    if (!addAssetItem) {
      setError("Asset item addition function is not available.");
      logger.error("addAssetItem prop missing in BulkUploadPage");
      return;
    }

    const mappingError = validateMapping();
    if (mappingError) {
      setError(mappingError);
      return;
    }

    if (!purchaseInfo.assetCategory) {
      setError("Please select an asset category.");
      return;
    }

    const mappedData = previewData.map((row, index) => {
      const newItem = {
        deviceId: row[mappedColumns["Device Name"]] || `AUTO_${Date.now()}_${index}`,
        serialNumber: row[mappedColumns["Serial No."]] || "",
        assignedTo: row[mappedColumns["Assigned To"]] || "",
        department: purchaseInfo.locationDepartment || "",
        status: "Pending",
        categoryId: purchaseInfo.assetCategory,
        specs: row[mappedColumns["Model"]] || "",
        purchaseDate: row[mappedColumns["Purchase Date"]] || purchaseInfo.purchaseDate || "",
        warrantyDuration: row[mappedColumns["Warranty Duration"]] || purchaseInfo.warrantyDuration || "",
      };
      return newItem;
    });

    try {
      mappedData.forEach((item) => {
        if (!item.deviceId || !item.serialNumber) {
          throw new Error(`Missing required fields in row ${mappedData.indexOf(item) + 1}: Device Name and Serial No. are mandatory.`);
        }
        addAssetItem(item);
      });
      logger.info("Uploaded data", { items: mappedData });
      setNotification({ type: "success", message: "Assets uploaded successfully!" });
      setTimeout(() => {
        navigate(`/asset-inventory/${id}/table`, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message);
      logger.error("Bulk upload failed", { error: err.message });
    }
  };

  const handleSaveDraft = () => {
    const draftData = {
      purchaseInfo,
      fileName: file?.name || "",
      mappedColumns,
      previewData,
      images: images.map(img => ({ name: img.file.name, preview: img.preview })),
    };
    localStorage.setItem(`draft_${id}_${Date.now()}`, JSON.stringify(draftData));
    logger.info("Draft saved", { draftData });
    setNotification({ type: "success", message: "Draft saved successfully!" });
    setTimeout(() => {
      navigate(`/asset-inventory/${id}/table`, { replace: true });
    }, 1500);
  };

  const handleCancel = () => {
    logger.debug("Cancelled bulk upload");
    navigate(`/asset-inventory/${id}/table`, { replace: true });
  };

  if (error) {
    return (
      <div className="px-6 py-5 mt-20 min-h-screen bg-background-offwhite">
        <div className="mb-6">
          <Link to={`/asset-inventory/${id}/table`} className="text-blue-600 hover:underline hover:scale-102 text-sm transition-all duration-200 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-2">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
            Back to {selectedCategory?.name || id} Inventory
          </Link>
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">Bulk Upload Assets</h1>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-5 mt-20 min-h-screen bg-background-offwhite">
      <div className="mb-6">
        <Link to={`/asset-inventory/${id}/table`} className="text-blue-600 hover:underline hover:scale-102 text-sm transition-all duration-200 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="mr-2">
            <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
          </svg>
          Back to {selectedCategory?.name || id} Inventory
        </Link>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Bulk Upload Assets</h1>
        <p className="text-sm text-gray-500 mt-1">Import multiple assets from a CSV file</p>
      </div>

      {notification && (
        <div className={`mb-4 p-4 rounded-md text-sm ${notification.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {notification.message}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
            <input
              type="text"
              value={purchaseInfo.vendorName}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, vendorName: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice / Bill Number</label>
            <input
              type="text"
              value={purchaseInfo.invoiceBillNumber}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, invoiceBillNumber: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
            <input
              type="date"
              value={purchaseInfo.purchaseDate}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, purchaseDate: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Purchase Value</label>
            <input
              type="number"
              value={purchaseInfo.totalPurchaseValue}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, totalPurchaseValue: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={purchaseInfo.paymentMethod}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, paymentMethod: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Payment Method</option>
              <option value="Cash">Cash</option>
              <option value="Card">Card</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Warranty Duration</label>
            <select
              value={purchaseInfo.warrantyDuration}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, warrantyDuration: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Warranty Duration</option>
              <option value="12">12 Months</option>
              <option value="24">24 Months</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Order Number</label>
            <input
              type="text"
              value={purchaseInfo.purchaseOrderNumber}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, purchaseOrderNumber: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asset Category</label>
            <select
              value={purchaseInfo.assetCategory}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, assetCategory: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Asset Category</option>
              {assetCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Location / Department</label>
            <input
              type="text"
              value={purchaseInfo.locationDepartment}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, locationDepartment: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchased By</label>
            <input
              type="text"
              value={purchaseInfo.purchasedBy}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, purchasedBy: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Contact</label>
            <input
              type="text"
              value={purchaseInfo.supplierContact}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, supplierContact: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GST / Tax ID</label>
            <input
              type="text"
              value={purchaseInfo.gstTaxId}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, gstTaxId: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={purchaseInfo.currency}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, currency: e.target.value })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Currency</option>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload CSV File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer text-blue-600 hover:underline hover:scale-102 transition-all duration-200"
            >
              {file ? file.name : "Drop your CSV file here or click to upload"}
            </label>
            <p className="text-xs text-gray-500 mt-1">Only .csv files, Max 10,000 rows</p>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images (Optional)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
          />
          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-5 gap-4">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img.preview}
                  alt={`Preview ${index}`}
                  className="w-24 h-24 object-cover rounded-md border border-gray-200"
                />
              ))}
            </div>
          )}
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Map CSV Columns</h2>
        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
          <div className="font-medium text-gray-700">System Field</div>
          <div className="font-medium text-gray-700">CSV Column</div>
          <div className="font-medium text-gray-700">Status</div>
          {["Device Name", "Serial No.", "Model", "Purchase Date", "Warranty Duration", "Assigned To"].map((field) => (
            <React.Fragment key={field}>
              <div className="text-gray-600">
                {field} {REQUIRED_FIELDS.includes(field) && <span className="text-red-600">*</span>}
              </div>
              <select
                value={mappedColumns[field] || ""}
                onChange={(e) => handleMapColumn(field, e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select</option>
                {Object.keys(mappedColumns).map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <div>
                {mappedColumns[field] && mappedColumns[field] !== "Select" ? (
                  <span className="text-green-600">✔</span>
                ) : (
                  <span className="text-yellow-600">⚠</span>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>

        {previewData.length > 0 && (
          <>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
            <p className="text-sm text-gray-500 mb-2">Showing the first 5 rows of the uploaded CSV after mapping</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <th key={key} className="py-3 px-6 border-b">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index} className="bg-white border-b hover:bg-gray-50">
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="py-3 px-6">{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">Note: Preview only displays the first 5 rows</p>
          </>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setMappedColumns({})}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition-all duration-200"
          >
            Reset Mapping
          </button>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition-all duration-200"
          >
            Save as Draft
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition-all duration-200"
          >
            Upload & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPage;