/**
 * Paginate a plain JavaScript array
 * @param {Array} data - The array to paginate
 * @param {Object} options - Pagination options
 * @param {number} [options.page=1] - Current page number
 * @param {number} [options.limit=10] - Number of items per page
 * @param {string} [options.sortBy] - Optional sort rule like 'createdAt:desc'
 * @returns {Object} Paginated result
 */

const paginateArray = (data, options = {}) => {
  const page = parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const limit =
    parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;

  let sortedData = [...data];

  // Handle sorting if specified
  if (options.sortBy) {
    const sortingCriteria = options.sortBy.split(",").map((sortOption) => {
      const [key, order] = sortOption.split(":");
      return { key, order: order === "desc" ? -1 : 1 };
    });

    sortedData.sort((a, b) => {
      for (const { key, order } of sortingCriteria) {
        if (a[key] < b[key]) return -1 * order;
        if (a[key] > b[key]) return 1 * order;
      }
      return 0;
    });
  }

  const totalResults = sortedData.length;
  const totalPages = Math.ceil(totalResults / limit) || 1;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const results = sortedData.slice(startIndex, endIndex);

  return {
    results,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

module.exports = paginateArray;
