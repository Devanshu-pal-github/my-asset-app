import React from "react";

const FilterBar = ({
  searchText,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) => {
  const categoryOptions = [
    { label: "All Categories", value: null },
    ...categories.map((cat) => ({
      label: cat.category_name,
      value: cat.category_name,
    })),
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-4 items-center">
      <div className="relative flex-1 min-w-[100px]">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          fill="currentColor"
          viewBox="0 0 24 24"
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        >
          <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
        <input
          type="text"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search categories..."
          className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <select
          value={selectedCategory === null ? "null" : selectedCategory}
          onChange={(e) =>
            onCategoryChange(e.target.value === "null" ? null : e.target.value)
          }
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {categoryOptions.map((option) => (
            <option
              key={option.value || "null"}
              value={option.value === null ? "null" : option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default FilterBar;