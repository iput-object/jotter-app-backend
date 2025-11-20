const httpStatus = require("http-status");
const response = require("../../config/response");
const catchAsync = require("../../utils/catchAsync");
const trashService = require("./trash.service");
const pick = require("../../utils/pick");

const getTrashContents = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "maxSize", "minSize"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await trashService.getTrashedContents(
    req.user.id,
    req.body.parentId,
    filter,
    options
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Trash Contents Retrieved!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const clearTrash = catchAsync(async (req, res) => {
  await trashService.clearTrash(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "Trash Cleared!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});

const recoverTrashedItem = catchAsync(async (req, res) => {
  const items = req.body.items;
  const result = await trashService.recoverTrashedItem(req.user.id, items);
  res.status(httpStatus.OK).json(
    response({
      message: "Trashed Item Recovered!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const permanentDelete = catchAsync(async (req, res) => {
  const items = req.body.items;
  await trashService.permanentDelete(req.user.id, items);
  res.status(httpStatus.OK).json(
    response({
      message: "Items Permanently Deleted!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});
module.exports = {
  getTrashContents,
  clearTrash,
  recoverTrashedItem,
  permanentDelete,
};
