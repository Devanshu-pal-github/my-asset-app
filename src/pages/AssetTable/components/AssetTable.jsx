import React from "react";
import { Link } from "react-router-dom";
import logger from '../../../utils/logger';

const AssetTable = ({ data, header, globalFilter, columns, specKeys, categoryId }) => {
  logger.debug('Rendering AssetTable', { dataCount: data.length, categoryId });

  const filteredData = data.filter((item) =>
    Object.values(item).some((value) =>
      value?.toString().toLowerCase().includes(globalFilter.toLowerCase())
    )
  );

  const renderSpecifications = (item) => {
    const specs = item.specifications || item.specs;
    if (!specs) {
      logger.debug('No specifications found for item', { itemId: item.id });
      return "N/A";
    }
    // Convert object to a comma-separated string of key-value pairs
    const specsString = Object.entries(specs)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    logger.debug('Rendered specifications', { itemId: item.id, specs: specsString });
    return specsString;
  };

  return (
    <div>
      {header}
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
              >
                {col === 'asset_tag' && 'Asset ID'}
                {col === 'serial_number' && 'Asset Name'}
                {col === 'assigned_at' && 'Assigned To'}
                {col === 'specifications' && 'Specifications'}
                {col === 'viewMore' && 'Actions'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((item) => (
            <tr key={item.id} className={item.asset_tag === 'MBA-004' ? 'bg-yellow-100' : ''}>
              {columns.map((col) => (
                <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {col === "specifications" ? (
                    renderSpecifications(item)
                  ) : col === "viewMore" ? (
                    <Link
                      to={`/asset-inventory/asset/${item.id}`}
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => logger.info('Navigating to asset detail', { assetId: item.id })}
                    >
                      View D...
                    </Link>
                  ) : (
                    item[col] || "-"
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