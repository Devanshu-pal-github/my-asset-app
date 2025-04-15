import React from "react";
import { Link } from "react-router-dom";

const AssetTable = ({ data, header, globalFilter, columns, specKeys, categoryId }) => {
  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
    )
  );

  const renderSpecifications = (item) => {
    const specs = item.specifications || item.specs || "N/A";
    return specs;
  };

  return (
    <div>
      {header}
      <table className="min-w-full divide-y divide-gray-200 mt-4">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col === "viewMore"
                  ? "Action"
                  : col === "specifications"
                  ? "Specifications"
                  : col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, " $1").trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((item) => (
            <tr key={item.deviceId || item.id}>
              {columns.map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col === "specifications" ? (
                    renderSpecifications(item)
                  ) : col === "viewMore" ? (
                    <Link
                      to={`/asset-inventory/${item.deviceId || item.id}`}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View More
                    </Link>
                  ) : (
                    item[col] || "N/A"
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="text-center py-4 text-gray-600">
          No assets found matching your search criteria.
        </div>
      )}
    </div>
  );
};

export default AssetTable;