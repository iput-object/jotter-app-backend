const httpStatus = require("http-status");
const response = require("../../config/response");
const catchAsync = require("../../utils/catchAsync");
const folderService = require("./folder.service");
const pick = require("../../utils/pick");

const folderCreate = catchAsync(async (req, res) => {
  const folder = await folderService.createFolder(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Created!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: folder,
    })
  );
});

const folderRename = catchAsync(async (req, res) => {
  const folder = await folderService.renameFolder(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Renamed!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: folder,
    })
  );
});

const folderDelete = catchAsync(async (req, res) => {
  const folder = await folderService.deleteFolder(
    req.user.id,
    req.body.folders
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Deleted!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: folder,
    })
  );
});

const folderMove = catchAsync(async (req, res) => {
  const folder = await folderService.moveFolder(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Moved!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: folder,
    })
  );
});

const getFolder = catchAsync(async (req, res) => {
  const folder = await folderService.getFolderById(
    req.user.id,
    req.params.folderId
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Details!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: folder,
    })
  );
});

const folderDeletePermanent = catchAsync(async (req, res) => {
  const folder = await folderService.deleteFolderPermanent(
    req.user.id,
    req.body.folders
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Deleted Permanently!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: folder,
    })
  );
});

const getFolderContents = catchAsync(async (req, res) => {
  const filter = pick(req.query, ["name", "maxSize", "minSize", "path"]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await folderService.getFolderContents(
    req.user.id,
    req.body.parentId,
    filter,
    options
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Folder Contents Retrieved!",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

module.exports = {
  folderCreate,
  getFolderContents,
  folderRename,
  folderDelete,
  folderDeletePermanent,
  folderMove,
  getFolder,
};
