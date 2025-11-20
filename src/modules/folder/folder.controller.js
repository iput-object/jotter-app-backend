const httpStatus = require("http-status");
const response = require("../../config/response");
const catchAsync = require("../../utils/catchAsync");
const folderService = require("./folder.service");

const createFolder = catchAsync(async (req, res) => {
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

module.exports = {
  createFolder,
};
