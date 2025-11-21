const httpStatus = require("http-status");
const catchAsync = require("../../utils/catchAsync");
const response = require("../../config/response");
const dashboardService = require("./dashboard.service");
const pick = require("../../utils/pick");

const getHomepage = catchAsync(async (req, res) => {
  const homepage = await dashboardService.getHomepageCards(req.user.id);

  res.status(httpStatus.OK).json(
    response({
      message: "Homepage data retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: homepage,
    })
  );
});

const getAllFileTypes = catchAsync(async (req, res) => {
  const files = await dashboardService.getAllFileTypes(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "All File Types",
      status: "OK",
      statusCode: httpStatus.OK,
      data: files,
    })
  );
});

const getItemsByTypes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["fileType"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const overview = await dashboardService.getItemsByType(
    req.user.id,
    filter,
    options
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Dashboard overview retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: overview,
    })
  );
});

const getStorageStats = catchAsync(async (req, res) => {
  const stats = await dashboardService.getStorageStats(req.user.id);

  res.status(httpStatus.OK).json(
    response({
      message: "Storage statistics retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: stats,
    })
  );
});

const getFilesByCategory = catchAsync(async (req, res) => {
  const categories = await dashboardService.getFilesByCategory(req.user.id);

  res.status(httpStatus.OK).json(
    response({
      message: "Files by category retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: categories,
    })
  );
});

const getFilesBySpecificCategory = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["sortBy", "limit", "page"]);
  const files = await dashboardService.getFilesBySpecificCategory(
    req.user.id,
    req.params.category,
    filter
  );

  res.status(httpStatus.OK).json(
    response({
      message: `${req.params.category} files retrieved`,
      status: "OK",
      statusCode: httpStatus.OK,
      data: files,
    })
  );
});

const getDetailedStats = catchAsync(async (req, res) => {
  const stats = await dashboardService.getDetailedStats(req.user.id);

  res.status(httpStatus.OK).json(
    response({
      message: "Detailed statistics retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: stats,
    })
  );
});

const getRecentItems = catchAsync(async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const items = await dashboardService.getRecentItems(req.user.id, limit);

  res.status(httpStatus.OK).json(
    response({
      message: "Recent items retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: items,
    })
  );
});

module.exports = {
  getHomepage,
  getAllFileTypes,
  getItemsByTypes,
  getRecentItems,
  getFilesByCategory,
  getFilesBySpecificCategory,
  getStorageStats,
  getDetailedStats,
};
