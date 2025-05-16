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

  const getSafeId = (item) => item.id || (item._id && isValidObjectId(item._id) ? item._id : item.asset_tag || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

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
                  col === "asset_tag" || col === "name" ? "cursor-pointer" : ""
                }`}
                onClick={() =>
                  (col === "asset_tag" || col === "name") && onSort(col)
                }
              >
                {col === "asset_tag" && (
                  <>
                    Asset ID{" "}
                    {sortField === "asset_tag" &&
                      (sortOrder === "asc" ? "↑" : "↓")}
                  </>
                )}
                {col === "name" && (
                  <>
                    Asset Name{" "}
                    {sortField === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </>
                )}
                {col === "serial_number" && "Serial Number"}
                {col === "status" && "Status"}
                {col === "specifications" && "Specifications"}
                {col === "actions" && "Actions"}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={getSafeId(item)}>
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {col === "specifications" ? (
                    renderSpecifications(item)
                  ) : col === "actions" ? (
                    <div className="flex gap-2">
                      <Link
                        to={`/asset/${getSafeId(item)}`}
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() =>
                          logger.info("Navigating to asset detail", {
                            assetId: getSafeId(item),
                          })
                        }
                      >
                        View Details
                      </Link>
                    </div>
                  ) : (
                    item[col] || "-"
                  )}
                </td>
              ))}
            </tr>
          ))}
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