const fs = require("fs");
const ApiError = require("./ApiError");
const httpStatus = require("http-status");
const { fromPairs } = require("lodash");
const createFolder = (path) => {
  if (!fs.existsSync(path)) {
    try {
      fs.mkdirSync(path, { recursive: true });
    } catch (err) {
      throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }
  }
};

const delFolder = (path) => {
  if (fs.existsSync(path)) {
    try {
      fs.rmdirSync(path);
    } catch (err) {
      throw new ApiError(httpStatus.BAD_REQUEST, err.message);
    }
  }
};

const delFile = async (path) => {
  if (fs.existsSync(path)) {
    try {
      fs.unlinkSync(path);
    } catch (err) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
  }
};

const cpFile = async (from, path) => {
  if (fs.existsSync(from)) {
    try {
      fs.copyFileSync(from, path);
    } catch (err) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
  }
};

const isFileExist = (filePath) => {
  return fs.existsSync(filePath);
};

module.exports = {
  createFolder,
  delFolder,
  delFile,
  isFileExist,
  cpFile,
};
