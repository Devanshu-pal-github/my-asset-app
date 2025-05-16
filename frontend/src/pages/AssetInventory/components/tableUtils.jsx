export const paginate = (data, currentPage, itemsPerPage) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.slice(startIndex, startIndex + itemsPerPage);
  };
  
  export const sortData = (data, sortField, sortOrder) => {
    return [...data].sort((a, b) => {
      const valueA = a[sortField] || '';
      const valueB = b[sortField] || '';
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }
      return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
    });
  };
  
  export const filterData = (data, filter, fields) => {
    if (!filter) return data;
    const lowerFilter = filter.toLowerCase();
    return data.filter((item) =>
      fields.some((field) => {
        const value = item[field] || '';
        return value.toString().toLowerCase().includes(lowerFilter);
      })
    );
  };