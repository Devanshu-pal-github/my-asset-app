import React from "react";
import { Link } from "react-router-dom";
import logger from "../../../utils/logger";

const AssetTable = ({
  data,
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

  const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id); // Inline validation
  const getSafeId = (item) => item._id && isValidObjectId(item._id) ? item._id : item.asset_tag || `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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
                      {item.status === "available" && (
                        <Link
                          to={`/asset-inventory/${categoryId}/assign/${getSafeId(item)}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Assign
                        </Link>
                      )}
                      {item.status === "assigned" && !category.is_allotment && (
                        <Link
                          to={`/asset-inventory/${categoryId}/unassign/${getSafeId(item)}`}
                          className="text-red-600 hover:text-red-800"
                        >
                          Unassign
                        </Link>
                      )}
                      <Link
                        to={`/asset/${getSafeId(item)}`} // Updated to match the route
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