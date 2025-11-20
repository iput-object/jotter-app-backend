const folderModel = require("./folder.model");
const { isObjectId } = require("../../utils/regex");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const path = require("path");

const syncFolderCount = async (folderId, increment) => {
  await folderModel.findByIdAndUpdate(folderId, {
    $inc: { folderCount: increment },
  });
};

const syncFolderSize = async (folderId, count = 1, size) => {
  await folderModel.findByIdAndUpdate(folderId, {
    $inc: { size: size, fileCount: count },
  });
};

const getFolderById = async (userId, _id) => {
  if (!isObjectId(_id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "MongoDB Folder id required.");
  }
  return await folderModel.findOne({
    userId,
    _id,
    isTrashed: false,
    isLocked: false,
  });
};

const createFolder = async (userId, data) => {
  const { name, parent } = data;

  let relativePath = "/";

  if (parent) {
    const parentFolder = await getFolderById(userId, parent);
    if (!parentFolder) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Parent folder not found.");
    }
    relativePath = path.join(parentFolder.path, name);
  } else {
    relativePath = name;
  }

  const existing = await folderModel.findOne({
    userId,
    parent: parent || null,
    name,
  });
  if (existing)
    throw new ApiError(httpStatus.CONFLICT, "Folder already exists");

  if (parent) await syncFolderCount(parent, 1);
  const folder = await folderModel.create({
    userId,
    name,
    path: relativePath,
    parent: parent || null,
  });

  return folder;
};

module.exports = {
  getFolderById,
  createFolder,
  syncFolderCount,
  syncFolderSize,
};
