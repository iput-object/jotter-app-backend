const httpStatus = require("http-status");
const response = require("../config/response");
const catchAsync = require("../utils/catchAsync");
const pick = require("../utils/pick");
const { fileService } = require("../services");

const uploadFile = catchAsync(async (req, res) => {
  const files = req.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No files uploaded.");
  }

  const file = await fileService.uploadFile(
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

const deleteFile = catchAsync(async (req, res) => {
  await fileService.deleteFile(req.user.id, req.params.fileId);
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Deleted",
      status: "OK",
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});

const permanentDeleteFile = catchAsync(async (req, res) => {
  await fileService.permanentDeleteFile(req.user.id, req.params.fileId);
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Permanent Deleted",
      status: "OK",
      statusCode: httpStatus.OK,
      data: {},
    })
  );
});

const replaceFile = catchAsync(async (req, res) => {
  const file = await fileService.replaceFile(
    req.user.id,
    req.params.fileId,
    res.files
  );
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
  if (!file.name || !file.path) {
    res.status(httpStatus.FORBIDDEN).json(
      response({
        message: "File Not Found",
        status: "OK",
        statusCode: httpStatus.FORBIDDEN,
        data: file,
      })
    );
  } else {
    res.download(file.path, file.name);
  }
});

const copyFile = catchAsync(async (req, res) => {
  const file = await fileService.copyFile(
    req.user.id,
    req.params.fileId,
    ...req.body
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Files Has Been Copied",
      status: "OK",
      statusCode: httpStatus.OK,
      data: file,
    })
  );
});

const moveFile = catchAsync(async (req, res) => {
  const file = await fileService.moveFile(
    req.user.id,
    req.params.fileId,
    req.body.targetFolder
  );
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
  uploadFile,
  queryFiles,
  deleteFile,
  replaceFile,
  renameFile,
  permanentDeleteFile,
  getFile,
  downloadFile,
  copyFile,
  moveFile,
};
