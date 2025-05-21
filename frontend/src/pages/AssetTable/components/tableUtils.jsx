import logger from "../../../utils/logger";

export const paginate = (data, page, itemsPerPage) => {
  if (!Array.isArray(data)) {
    logger.error("Invalid data passed to paginate function", { data });
    return [];
  }
  const start = (page - 1) * itemsPerPage;
  return data.slice(start, start + itemsPerPage);
};

export const sortData = (data, field, order) => {
  if (!Array.isArray(data)) {
    logger.error("Invalid data passed to sortData function", { data });
    return [];
  }

  logger.debug("Sorting data", { field, order, dataLength: data.length });

  return [...data].sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // Handle null/undefined values
    if (valA === null || valA === undefined) valA = "";
    if (valB === null || valB === undefined) valB = "";

    // Handle date fields
    const dateFields = ["current_assignment_date", "purchase_date", "warranty_until", "created_at", "updated_at"];
    if (dateFields.includes(field)) {
      const dateA = valA ? new Date(valA).getTime() : 0;
      const dateB = valB ? new Date(valB).getTime() : 0;
      return order === "asc" ? dateA - dateB : dateB - dateA;
    }

    // Handle numeric fields
    if (typeof valA === "number" && typeof valB === "number") {
      return order === "asc" ? valA - valB : valB - valA;
    }

    // Handle string fields
    const strA = valA.toString().toLowerCase();
    const strB = valB.toString().toLowerCase();

    // Handle asset_id field specially to sort numerically if possible
    if (field === "asset_id") {
      const numA = parseInt(strA.replace(/\D/g, ""));
      const numB = parseInt(strB.replace(/\D/g, ""));
      if (!isNaN(numA) && !isNaN(numB)) {
        return order === "asc" ? numA - numB : numB - numA;
      }
    }

    return order === "asc"
      ? strA.localeCompare(strB)
      : strB.localeCompare(strA);
  });
};

export const filterData = (data, searchTerm, fields) => {
  if (!Array.isArray(data)) {
    logger.error("Invalid data passed to filterData function", { data });
    return [];
  }

  if (!searchTerm) return data;

  logger.debug("Filtering data", {
    searchTerm,
    fields,
    dataLength: data.length,
  });

  const normalizedSearchTerm = searchTerm.toLowerCase().trim();

  return data.filter((item) =>
    fields.some((field) => {
      const value = item[field];
      if (value === null || value === undefined) return false;

      // Handle date fields
      if (
        field.includes("date") &&
        (typeof value === "string" || value instanceof Date)
      ) {
        try {
          const date = new Date(value);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
          return formattedDate.toLowerCase().includes(normalizedSearchTerm);
        } catch (error) {
          logger.error("Error formatting date for filtering", {
            field,
            value,
            error,
          });
          return false;
        }
      }

      // Handle specifications object
      if (field === "specifications" && typeof value === "object") {
        return Object.entries(value).some(([key, val]) =>
          `${key}: ${val}`.toLowerCase().includes(normalizedSearchTerm)
        );
      }

      // Handle regular fields
      return value.toString().toLowerCase().includes(normalizedSearchTerm);
    })
  );
};