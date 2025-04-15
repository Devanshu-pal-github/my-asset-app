import React from 'react';
import { useSelector } from 'react-redux';

const FilterBar = ({ searchText, onSearchChange, selectedCategory, onCategoryChange, onAddClick }) => {
  const { categories } = useSelector((state) => state.assetCategories);

  const categoryOptions = [
    { label: 'All Categories', value: null },
    ...categories.map((cat) => ({ label: cat.name, value: cat.name })),
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[200px]">
        <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <select
          value={selectedCategory === null ? 'null' : selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value === 'null' ? null : e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categoryOptions.map((option) => (
            <option key={option.value || 'null'} value={option.value === null ? 'null' : option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <button
        onClick={onAddClick}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center"
      >
        <i className="pi pi-plus mr-2"></i>
        Add Category
      </button>
    </div>
  );
};

export default FilterBar;