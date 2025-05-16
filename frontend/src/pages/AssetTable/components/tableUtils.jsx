export const paginate = (data, page, itemsPerPage) => {
    const start = (page - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  };
  
  export const sortData = (data, field, order) => {
    return [...data].sort((a, b) => {
      const valA = a[field] || "";
      const valB = b[field] || "";
      if (order === "asc") {
        return valA.toString().localeCompare(valB.toString());
      }
      return valB.toString().localeCompare(valA.toString());
    });
  };
  
  export const filterData = (data, searchTerm, fields) => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      fields.some((field) =>
        item[field]?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };