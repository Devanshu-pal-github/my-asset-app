import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Papa from "papaparse";

const BulkUploadPage = ({ assetCategories, addAssetItem }) => {
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

  useEffect(() => {
    if (id && assetCategories.length > 0) {
      const category = assetCategories.find((cat) => cat.id === id);
      setSelectedCategory(category || null);
      setPurchaseInfo((prev) => ({ ...prev, assetCategory: category?.id || "" }));
    }
  }, [id, assetCategories]);

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && (uploadedFile.type === "text/csv" || uploadedFile.name.endsWith(".csv"))) {
      setFile(uploadedFile);
      Papa.parse(uploadedFile, {
        header: true,
        complete: (result) => {
          const headers = result.meta.fields;
          const initialMapping = {};
          headers.forEach((header) => {
            initialMapping[header] = header;
          });
          setMappedColumns(initialMapping);
          setPreviewData(result.data.slice(0, 5)); // Preview first 5 rows
        },
      });
    }
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    const imagePreviews = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...imagePreviews]);
  };

  const handleMapColumn = (systemField, excelColumn) => {
    setMappedColumns((prev) => ({ ...prev, [systemField]: excelColumn }));
  };

  const handleSubmit = () => {
    if (file && previewData.length > 0) {
      const mappedData = previewData.map((row) => {
        const newItem = {
          deviceId: row[mappedColumns["Device Name"]] || `AUTO_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          serialNumber: row[mappedColumns["Serial No."]] || "",
          assignedTo: row[mappedColumns["Assigned To"]] || "",
          department: purchaseInfo.locationDepartment || "",
          status: "Pending",
          categoryId: purchaseInfo.assetCategory,
          specs: row[mappedColumns["Model"]] || "",
          purchaseDate: row[mappedColumns["Purchase Date"]] || purchaseInfo.purchaseDate,
          warrantyDuration: row[mappedColumns["Warranty Duration"]] || purchaseInfo.warrantyDuration,
        };
        return newItem;
      });
      mappedData.forEach((item) => addAssetItem(item));
      console.log("Uploaded Data:", mappedData);
    }
    navigate(`/asset-inventory/${id}/table`, { replace: true });
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
    console.log("Draft Saved:", draftData);
    navigate(`/asset-inventory/${id}/table`, { replace: true });
  };

  const handleCancel = () => {
    navigate(`/asset-inventory/${id}/table`, { replace: true });
  };

  return (
    <div className="px-6 py-5 mt-20">
      <div className="mb-6">
        <Link to={`/asset-inventory/${id}/table`} className="text-blue-500 hover:text-blue-700 text-sm">
          <i className="pi pi-arrow-left mr-1"></i>Back to {selectedCategory?.name || id} Inventory
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 mt-2">Bulk Upload Assets</h1>
        <p className="text-gray-600 text-sm mt-1">Import multiple assets from an Excel file</p>
      </div>
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Purchase Information</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Vendor Name</label>
            <input
              type="text"
              value={purchaseInfo.vendorName}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, vendorName: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Invoice / Bill Number</label>
            <input
              type="text"
              value={purchaseInfo.invoiceBillNumber}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, invoiceBillNumber: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
            <input
              type="date"
              value={purchaseInfo.purchaseDate}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, purchaseDate: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total Purchase Value</label>
            <input
              type="number"
              value={purchaseInfo.totalPurchaseValue}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, totalPurchaseValue: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={purchaseInfo.paymentMethod}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, paymentMethod: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Asset Category</label>
            <select
              value={purchaseInfo.assetCategory}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, assetCategory: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
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
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Purchased By</label>
            <input
              type="text"
              value={purchaseInfo.purchasedBy}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, purchasedBy: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Supplier Contact</label>
            <input
              type="text"
              value={purchaseInfo.supplierContact}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, supplierContact: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">GST / Tax ID</label>
            <input
              type="text"
              value={purchaseInfo.gstTaxId}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, gstTaxId: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
              value={purchaseInfo.currency}
              onChange={(e) => setPurchaseInfo({ ...purchaseInfo, currency: e.target.value })}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Currency</option>
              <option value="USD">USD</option>
              <option value="INR">INR</option>
            </select>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Excel File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-upload"
            />
            <label htmlFor="excel-upload" className="cursor-pointer text-blue-500 hover:text-blue-700">
              {file ? file.name : "Drop your Excel file or Choose File"}
            </label>
            <p className="text-xs text-gray-500 mt-1">.xls, .xlsx, Max 10,000 rows</p>
          </div>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="mt-4 grid grid-cols-5 gap-4">
            {images.map((img, index) => (
              <img key={index} src={img.preview} alt={`Preview ${index}`} className="w-24 h-24 object-cover rounded" />
            ))}
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Map Excel Columns</h2>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>System Field</div>
          <div>Excel Column</div>
          <div>Status</div>
          {["Device Name", "Serial No.", "Model", "Purchase Date", "Warranty Duration", "Category", "Location", "Assigned To"].map((field) => (
            <React.Fragment key={field}>
              <div>{field}</div>
              <select
                value={mappedColumns[field] || ""}
                onChange={(e) => handleMapColumn(field, e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Select</option>
                {Object.keys(mappedColumns).map((col) => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
              <div>
                {mappedColumns[field] ? <span className="text-green-500">✔</span> : <span className="text-yellow-500">⚠</span>}
              </div>
            </React.Fragment>
          ))}
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Preview</h2>
        <p className="text-sm text-gray-500 mb-2">Shows a few rows of the uploaded Excel after mapping</p>
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr>
              {Object.keys(previewData[0] || {}).map((key) => (
                <th key={key} className="py-2 px-4 border-b">{key}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, index) => (
              <tr key={index} className="border-b">
                {Object.values(row).map((value, i) => (
                  <td key={i} className="py-2 px-4">{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-500 mt-2">Note: Preview only displays the first 5 rows</p>
        <div className="mt-6 flex justify-end gap-4">
          <button onClick={() => setMappedColumns({})} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Reset Mapping
          </button>
          <button onClick={handleCancel} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={handleSaveDraft} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
            Save as Draft
          </button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            Upload & Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPage;