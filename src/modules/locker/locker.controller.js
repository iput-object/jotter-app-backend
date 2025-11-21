const httpStatus = require("http-status");
const pick = require("../../utils/pick");
const ApiError = require("../../utils/ApiError");
const catchAsync = require("../../utils/catchAsync");
const response = require("../../config/response");
const lockerService = require("./locker.service");
const { tokenService } = require("../token");
// Auth & Locker Management
const setupLocker = catchAsync(async (req, res) => {
  const result = await lockerService.setupLocker(req.user.id, req.body);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Locker setup successfully",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: {},
    })
  );
});

const loginLocker = catchAsync(async (req, res) => {
  const user = await lockerService.loginLocker(req.user.id, req.body.pin);
  const tokens = await tokenService.generateLockerAuthTokens(user, "locker");
  res.status(httpStatus.OK).json(
    response({
      message: "Locker login successful",
      status: "OK",
      statusCode: httpStatus.OK,
      data: { user, tokens },
    })
  );
});

const getLockerDetails = catchAsync(async (req, res) => {
  const user = await lockerService.getLockerDetails(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "Locker details fetched successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: user,
    })
  );
});

const forgetLocker = catchAsync(async (req, res) => {
  const locker = await lockerService.getLockerDetails(req.user.id);
  res.status(httpStatus.OK).json(
    response({
      message: "Locker Recovery Details fetched successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: locker,
    })
  );
});

const modifyLocker = catchAsync(async (req, res) => {
  const result = await lockerService.modifyLocker(req.user.id, req.body);
  res.status(httpStatus.OK).json(
    response({
      message: "Locker modified successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await lockerService.resetLockerPassword(
    req.user.id,
    req.body.securityAnswer,
    req.body.newPin
  );
  res.status(httpStatus.OK).json(
    response({
      message: "Locker password reset successfully",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

// File Operations Starts Here
const addItemToLocker = catchAsync(async (req, res) => {
  const item = await lockerService.addItemToLocker(req.user.id, req.body.items);
  res.status(httpStatus.CREATED).json(
    response({
      message: "Item added to locker",
      status: "OK",
      statusCode: httpStatus.CREATED,
      data: item,
    })
  );
});

const removeItemFromLocker = catchAsync(async (req, res) => {
  const result = await lockerService.removeFromLocker(
    req.user.id,
    req.body.items
  );
  res.status(httpStatus.OK).json(
    response({
      message: result.message,
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const getItems = catchAsync(async (req, res) => {
  const options = pick(req.query, ["sortBy", "limit", "page"]);
  const result = await lockerService.getLockedContents(
    req.user.id,
    req.body.parentId,
    options
  );

  res.status(httpStatus.OK).json(
    response({
      message: "Locked items retrieved",
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

const permanentDelete = catchAsync(async (req, res) => {
  const result = await lockerService.deleteFilesPermanently(
    req.user.id,
    req.body.items
  );

  res.status(httpStatus.OK).json(
    response({
      message: result.message,
      status: "OK",
      statusCode: httpStatus.OK,
      data: result,
    })
  );
});

module.exports = {
  // Auth & Locker Management
  setupLocker,
  loginLocker,
  getLockerDetails,
  forgetLocker,
  modifyLocker,
  resetPassword,
  // File Operations
  addItemToLocker,
  removeItemFromLocker,
  getItems,
  permanentDelete,
};
