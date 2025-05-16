import React, { useMemo, memo } from 'react';
import ChartCard from './ChartCard';
import { topEmployeeAssetData } from '../mockData';

/**
 * TopEmployeesTable component 
 * Shows employees with the highest value assets assigned to them
 * Includes sorting and pagination for large datasets
 */
const TopEmployeesTable = ({ 
  data = topEmployeeAssetData, 
  onLoaded, 
  pagination = { page: 1, total_pages: 1, total_count: data.length, limit: 10 },
  onPageChange,
  onSortChange,
  sortField = 'value',
  sortOrder = 'desc',
  loading = false
}) => {
  // Notify parent when component is loaded
  React.useEffect(() => {
    if (onLoaded) onLoaded('employeesTable');
  }, [onLoaded]);
  
  // Calculate total asset value for description
  const totalValue = useMemo(() => {
    return data.reduce((sum, employee) => sum + employee.value, 0);
  }, [data]);
  
  // Memoize the sorted data to prevent unnecessary re-calculations
  const sortedData = useMemo(() => {
    // If we're using server-side sorting, don't sort again
    if (onSortChange) return data;
    
    // Otherwise sort the data client-side
    return [...data].sort((a, b) => {
      const valueA = a[sortField];
      const valueB = b[sortField];
      
      if (typeof valueA === 'string') {
        return sortOrder === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
  }, [data, sortField, sortOrder, onSortChange]);
  
  // Handle sort column click
  const handleSortClick = (field) => {
    if (!onSortChange) return;
    
    const newSortOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newSortOrder);
  };
  
  // Render pagination controls
  const renderPagination = () => {
    if (!pagination || pagination.total_pages <= 1) return null;
    
    const { page, total_pages } = pagination;
    
    // Calculate page range to display (show at most 5 pages)
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(total_pages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return (
      <div className="flex justify-center mt-4">
        <nav className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(1)}
            disabled={page === 1}
            className={`px-2 py-1 rounded ${
              page === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            aria-label="First Page"
          >
            <i className="pi pi-angle-double-left"></i>
          </button>
          
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            className={`px-2 py-1 rounded ${
              page === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            aria-label="Previous Page"
          >
            <i className="pi pi-angle-left"></i>
          </button>
          
          {pageNumbers.map(num => (
            <button
              key={num}
              onClick={() => onPageChange(num)}
              className={`px-3 py-1 rounded-md ${
                page === num
                  ? 'bg-blue-600 text-white'
                  : 'text-blue-600 hover:bg-blue-100'
              }`}
              aria-label={`Page ${num}`}
              aria-current={page === num ? 'page' : undefined}
            >
              {num}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === total_pages}
            className={`px-2 py-1 rounded ${
              page === total_pages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            aria-label="Next Page"
          >
            <i className="pi pi-angle-right"></i>
          </button>
          
          <button
            onClick={() => onPageChange(total_pages)}
            disabled={page === total_pages}
            className={`px-2 py-1 rounded ${
              page === total_pages
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-blue-600 hover:bg-blue-50'
            }`}
            aria-label="Last Page"
          >
            <i className="pi pi-angle-double-right"></i>
          </button>
        </nav>
      </div>
    );
  };

  // Render sort indicator
  const renderSortIndicator = (field) => {
    if (field !== sortField) return null;
    
    return (
      <i className={`pi ${sortOrder === 'asc' ? 'pi-sort-up' : 'pi-sort-down'} ml-1`}></i>
    );
  };

  return (
    <ChartCard 
      title="Top Employees by Asset Value" 
      description={`Employees with highest value assets totaling $${totalValue.toLocaleString()}`}
    >
      <div className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-8">
            <i className="pi pi-spin pi-spinner text-blue-600 text-2xl"></i>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No employee asset data available</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th 
                    scope="col" 
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${onSortChange ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => handleSortClick('name')}
                  >
                    <div className="flex items-center">
                      Employee
                      {renderSortIndicator('name')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${onSortChange ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => handleSortClick('department')}
                  >
                    <div className="flex items-center">
                      Department
                      {renderSortIndicator('department')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${onSortChange ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => handleSortClick('assets')}
                  >
                    <div className="flex items-center">
                      Assets
                      {renderSortIndicator('assets')}
                    </div>
                  </th>
                  <th 
                    scope="col" 
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${onSortChange ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={() => handleSortClick('value')}
                  >
                    <div className="flex items-center">
                      Value
                      {renderSortIndicator('value')}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-500">{employee.department}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                      {employee.assets.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">${employee.value.toLocaleString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {onPageChange && renderPagination()}
      
      {/* Pagination summary */}
      {pagination && pagination.total_count > 0 && (
        <div className="text-xs text-gray-500 mt-2 text-center">
          Showing {Math.min(data.length, pagination.limit)} of {pagination.total_count.toLocaleString()} employees
        </div>
      )}
    </ChartCard>
  );
};

export default memo(TopEmployeesTable); 