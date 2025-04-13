import React, { useState } from 'react';

/**
 * Reusable filter bar for the asset inventory pages
 */
const FilterBar = ({ searchText, onSearchChange, categoryOptions, selectedCategory, onCategoryChange, onAddClick }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [utilizationRate, setUtilizationRate] = useState(50);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');
  const [sortBy, setSortBy] = useState('');

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const applyFilters = () => {
    // Handle filter application logic here
    toggleFilters();
  };

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative">
          <div className="flex items-center">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="pi pi-search text-gray-400"></i>
            </div>
            <input
              type="text"
              value={searchText}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search assets..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-72 md:w-96"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleFilters}
              className="flex items-center px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <i className="pi pi-filter mr-2"></i>
              Filter
            </button>
          </div>
          <button 
            className="flex items-center px-3 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
            onClick={onAddClick}
          >
            <i className="pi pi-plus mr-2"></i>
            Add New Asset
          </button>
        </div>
      </div>
      
      {/* Filter Popup */}
      {showFilters && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="filter-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" aria-hidden="true" onClick={toggleFilters}></div>
            
            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Filter Assets
                      </h3>
                      <button 
                        onClick={toggleFilters}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <i className="pi pi-times"></i>
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Asset Category</label>
                        <select
                          value={selectedCategory === null ? "null" : selectedCategory}
                          onChange={(e) => onCategoryChange(e.target.value === "null" ? null : e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {categoryOptions.map((option) => (
                            <option key={option.label} value={option.value === null ? "null" : option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="text-green-600 mr-2">●</span> Available
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="text-blue-600 mr-2">●</span> In Use
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="text-yellow-600 mr-2">●</span> Maintenance
                          </label>
                          <label className="flex items-center">
                            <input type="checkbox" className="mr-2" />
                            <span className="text-gray-600 mr-2">●</span> Retired
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Utilization Rate</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={utilizationRate}
                          onChange={(e) => setUtilizationRate(e.target.value)}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>0%</span>
                          <span>{utilizationRate}%</span>
                          <span>100%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Added</label>
                        <div className="flex space-x-2">
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Start Date"
                          />
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Asset Value Range (₹)</label>
                        <div className="flex space-x-2">
                          <input
                            type="number"
                            value={minValue}
                            onChange={(e) => setMinValue(e.target.value)}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Min"
                          />
                          <input
                            type="number"
                            value={maxValue}
                            onChange={(e) => setMaxValue(e.target.value)}
                            className="w-1/2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Max"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sortBy"
                              value="newest"
                              checked={sortBy === 'newest'}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="mr-2"
                            />
                            Newest First
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sortBy"
                              value="oldest"
                              checked={sortBy === 'oldest'}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="mr-2"
                            />
                            Oldest First
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sortBy"
                              value="highToLow"
                              checked={sortBy === 'highToLow'}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="mr-2"
                            />
                            Value: High to Low
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="sortBy"
                              value="lowToHigh"
                              checked={sortBy === 'lowToHigh'}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="mr-2"
                            />
                            Value: Low to High
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={applyFilters}
                >
                  Apply Filters
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={toggleFilters}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;