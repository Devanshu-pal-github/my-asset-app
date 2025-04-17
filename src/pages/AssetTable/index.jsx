import React from 'react';
import { Link } from 'react-router-dom';

const AssetTablePage = () => {
  const category = {
    name: 'Laptops',
    totalUnits: 3,
    avgCostPerUnit: 1500.00,
    inStorage: 1,
  };

  const assetItems = [
    {
      deviceId: 'LAPTOP001',
      serialNumber: 'DXX087654',
      assignmentDate: '22-03-2024',
      specifications: 'i7, 16GB RAM, 512GB SSD',
    },
    {
      deviceId: 'LAPTOP002',
      serialNumber: 'MP1367890',
      assignmentDate: '22-05-15',
      specifications: 'M1 Pro, 16GB RAM, 1TB SSD',
    },
    {
      deviceId: 'LAPTOP003',
      serialNumber: 'LT4667901',
      assignmentDate: '',
      specifications: 'i5, 8GB RAM, 256GB SSD',
    },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Category Stats */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center text-gray-600">
          <div>
            <h2 className="text-lg font-semibold">Total Units</h2>
            <p className="text-2xl font-bold text-gray-800">{category.totalUnits}</p>
            <span className="text-green-600">+5%</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">Avg Cost/Unit</h2>
            <p className="text-2xl font-bold text-gray-800">₹{category.avgCostPerUnit.toLocaleString()}</p>
            <span className="text-green-600">+0%</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">In Storage</h2>
            <p className="text-2xl font-bold text-gray-800">{category.inStorage}</p>
            <span className="text-green-600">+2%</span>
          </div>
        </div>
      </div>

      {/* Search and Actions */}
      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder="Search items..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/3"
        />
        <div className="flex gap-2">
          <button className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600">
            Add Item
          </button>
          <button className="px-3 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">
            Bulk Upload
          </button>
        </div>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <table className="w-full text-sm text-gray-700">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Asset ID</th>
              <th className="py-2 text-left">Asset Number</th>
              <th className="py-2 text-left">Assignment Date</th>
              <th className="py-2 text-left">Specifications</th>
              <th className="py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assetItems.map((item, index) => (
              <tr key={index} className="border-b">
                <td className="py-2">{item.deviceId}</td>
                <td className="py-2">{item.serialNumber}</td>
                <td className="py-2">{item.assignmentDate || '-'}</td>
                <td className="py-2">{item.specifications}</td>
                <td className="py-2">
                  <Link to={`/asset-inventory/${item.deviceId}/details`} className="text-blue-500 hover:text-blue-700">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-end mt-4">
          <Link to="/asset-inventory" className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50">
            <i className="pi pi-arrow-left mr-2"></i>Return to Asset Inventory
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AssetTablePage;