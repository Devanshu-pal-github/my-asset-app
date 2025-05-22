import React from "react";
import { Link } from "react-router-dom";
import logger from "../../../utils/logger";

const AssetTable = ({
  data = [],
  header,
  globalFilter,
  columns,
  specKeys,
  categoryId,
  category,
  onSort,
  sortField,
  sortOrder,
}) => {
  logger.debug("Rendering AssetTable", { dataCount: data.length, categoryId });

  const renderSpecifications = (item) => {
    const specs = item.specifications;
    if (!specs || Object.keys(specs).length === 0) {
      logger.debug("No specifications found for item", { itemId: item._id });
      return "N/A";
    }
    const specsString = Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    logger.debug("Rendered specifications", {
      itemId: item._id,
      specs: specsString,
    });
    return specsString;
  };

  const isValidObjectId = (id) => {
    if (!id) return false;
    
    // Check for standard UUID format (8-4-4-4-12 hex digits)
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    
    // Check for prefixed ID format like AST-12345678
    const prefixedIdRegex = /^[A-Z]{3}-[0-9A-Z]{8}$/;
    
    // Check for old MongoDB ObjectId format (24 hex characters)
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    return uuidRegex.test(id) || prefixedIdRegex.test(id) || objectIdRegex.test(id);
  };

  const getSafeId = (item) => {
    const id = item.asset_id || item.id || item._id;
    return isValidObjectId(id) ? id : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      logger.error("Error formatting date", { dateString, error });
      return dateString;
    }
  };

  const renderCellContent = (item, col) => {
    switch (col) {
      case "asset_id":
        return item.asset_id || "-";
      case "name":
        return item.name || "-";
      case "serial_number":
        return item.serial_number || "-";
      case "status":
        return formatStatus(item.status);
      case "specifications":
        return renderSpecifications(item);
      case "current_assignment_date":
        return formatDate(item.current_assignment_date);
      case "purchase_date":
        return formatDate(item.purchase_date);
      case "warranty_until":
        return formatDate(item.warranty_until);
      case "actions":
        const id = item.asset_id || item.id || item._id;
        const isValidId = isValidObjectId(id);
        return (
          <div className="flex gap-2">
            {isValidId ? (
              <Link
                to={`/asset/${id}`}
                className="text-blue-600 hover:text-blue-800"
                onClick={() =>
                  logger.info("Navigating to asset detail", {
                    assetId: id,
                  })
                }
              >
                View Details
              </Link>
            ) : (
              <span 
                className="text-gray-400 cursor-not-allowed" 
                title="Asset ID not available"
              >
                View Details
              </span>
            )}
          </div>
        );
      default:
        return item[col] || "-";
    }
  };

  const getColumnHeader = (col) => {
    const headers = {
      asset_id: "Asset ID",
      name: "Asset Name",
      serial_number: "Serial Number",
      status: "Status",
      specifications: "Specifications",
      current_assignment_date: "Assigned Date",
      purchase_date: "Purchase Date",
      warranty_until: "Warranty Until",
      actions: "Actions",
    };
    return headers[col] || col.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const isSortableColumn = (col) => ["asset_id", "name", "status", "current_assignment_date", "purchase_date"].includes(col);

  return (
    <div>
      {header}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  isSortableColumn(col) ? "cursor-pointer hover:bg-gray-200" : ""
                }`}
                onClick={() => isSortableColumn(col) && onSort(col)}
              >
                {getColumnHeader(col)}{" "}
                {sortField === col && (sortOrder === "asc" ? "↑" : "↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => {
            const id = item.asset_id || item.id || item._id;
            const rowKey = isValidObjectId(id) ? id : `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            return (
              <tr key={rowKey} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                  >
                    {renderCellContent(item, col)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-4 text-gray-600">
          No assets found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default AssetTable;