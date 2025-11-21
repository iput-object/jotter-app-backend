const httpStatus = require("http-status");
const response = require("../../config/response");
const catchAsync = require("../../utils/catchAsync");
const pick = require("../../utils/pick");
const fileService = require("./file.service");
const ApiError = require("../../utils/ApiError");

const uploadFiles = catchAsync(async (req, res) => {
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No files uploaded.");
  }

  const file = await fileService.uploadFiles(
    req.user.id,
    req.body.folderId,
    files
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Uploaded",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

const queryFiles = catchAsync(async (req, res) => {
  const filter = pick(req.query, [
    "originalName",
    "fileType",
    "maxSize",
    "minSize",
    "path",
  ]);
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await fileService.queryFiles(req.user.id, filter, options);
  res.status(httpStatus.OK).json(
    response({
      message: "Query Files",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const deleteFiles = catchAsync(async (req, res) => {
  const files = req.body.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No files to Delete.");
  }

  const result = await fileService.deleteFiles(req.user.id, files);
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Deleted",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const permanentDeleteFiles = catchAsync(async (req, res) => {
  const result = await fileService.permanentDeleteFiles(
    req.user.id,
    req.body.files
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Permanent Deleted",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const replaceFiles = catchAsync(async (req, res) => {
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No files to Replace.");
  }
  const file = await fileService.replaceFiles(req.user.id, files);
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Replaced",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

const renameFile = catchAsync(async (req, res) => {
  const file = await fileService.renameFile(
    req.user.id,
    req.params.fileId,
    req.body.name
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Renamed",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

const getFile = catchAsync(async (req, res) => {
  const file = await fileService.getFile(req.user.id, req.params.fileId);
  res.status(httpStatus.OK).json(
    response({
      message: "File Response",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

const downloadFile = catchAsync(async (req, res) => {
  const file = await fileService.downloadFile(req.user.id, req.params.fileId);
  if (!file.name || !file.cloudPath) {
    res.status(httpStatus.FORBIDDEN).json(
      response({
        message: "File Not Found",
        status: "OK",
        statusCode: httpStatus.FORBIDDEN,
        data: file,
      })
    );
  } else {
    res.download(file.cloudPath, file.name);
  }
});

const copyFiles = catchAsync(async (req, res) => {
  const file = await fileService.copyFiles(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Copied",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

const moveFiles = catchAsync(async (req, res) => {
  const file = await fileService.moveFiles(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Moved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

module.exports = {
  uploadFiles,
  queryFiles,
  deleteFiles,
  replaceFiles,
  renameFile,
  permanentDeleteFiles,
  getFile,
  downloadFile,
  copyFiles,
  moveFiles,
};
