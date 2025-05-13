import React, { memo, useMemo } from 'react';
import ChartCard from './ChartCard';
import { topEmployeeAssetData } from '../mockData';

/**
 * Top Employees by Asset Value table
 * Shows employees with the highest value of assigned assets
 */
const TopEmployeesTable = () => {
  // Sort the data by value in descending order - memoized to prevent recalculation
  const sortedData = useMemo(() => 
    [...topEmployeeAssetData].sort((a, b) => b.value - a.value),
    []
  );

  return (
    <ChartCard 
      title="Top Employees by Asset Value" 
      description="Employees with the highest value of assigned assets"
    >
      <div className="overflow-x-auto" style={{ maxHeight: '400px' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assets
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((employee) => (
              <tr key={employee.id} className={employee.id % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {employee.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.assets}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  ${employee.value.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
};

export default memo(TopEmployeesTable); 