const folderModel = require("./folder.model");
const { isObjectId } = require("../../utils/regex");
const ApiError = require("../../utils/ApiError");
const httpStatus = require("http-status");
const path = require("path");
const fileModel = require("../file/file.model");
const { userService } = require("../user");
const fs = require("../../utils/fs");
const paginateArray = require("../../utils/pagination");

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

const softDeleteTree = async (userId, rootFolderId) => {
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const currentFolderId = queue.shift();
    await fileModel.updateMany(
      { userId, parent: currentFolderId, isTrashed: false, isLocked: false },
      { isTrashed: true }
    );

    const childFolders = await folderModel.find({
      userId,
      parent: currentFolderId,
      isTrashed: false,
      isLocked: false,
    });
    queue.push(...childFolders.map((f) => f._id));

    await folderModel.updateOne(
      { userId, _id: currentFolderId, isTrashed: false, isLocked: false },
      { isTrashed: true }
    );
  }
};

const hardDeleteTree = async (rootFolderId, extraQuery = {}) => {
  const queue = [rootFolderId];

  while (queue.length > 0) {
    const currentParent = queue.shift();
    const fileQuery = { ...extraQuery, parent: currentParent };
    const files = await fileModel.find(fileQuery);
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.delFile(file.cloudPath);
        } catch (err) {
          console.error(`Failed to delete file ${file.cloudPath}:`, err);
        }
      })
    );
    await fileModel.deleteMany(fileQuery);
    const folderQuery = { ...extraQuery, parent: currentParent };
    const childFolders = await folderModel.find(folderQuery);
    queue.push(...childFolders.map((f) => f._id));

    await folderModel.deleteMany(folderQuery);
  }
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
    relativePath += name;
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

const renameFolder = async (userId, data) => {
  const { folderId, newName } = data;
  const folder = await getFolderById(userId, folderId);
  if (!folder) {
    throw new ApiError(httpStatus.NOT_FOUND, "Folder not found.");
  }

  if (folder.name === newName) {
    return folder;
  }

  folder.name = newName;
  folder.path = folder.path.replace(folder.name, newName);
  return await folder.save();
};

const deleteFolder = async (userId, folders) => {
  const result = await Promise.all(
    folders.map(async (folderId) => {
      const folder = await getFolderById(userId, folderId);
      if (!folder) return { folderId, status: "Folder not found" };
      await softDeleteTree(userId, folderId);
      if (folder.parent) {
        await syncFolderCount(folder.parent, -1);
        await syncFolderSize(folder.parent, 0, -folder.size);
      }
      return { folderId, status: "Folder deleted" };
    })
  );
  return result;
};

const moveFolder = async (userId, data) => {
  const { folderId, newParentId } = data;
  const folder = await getFolderById(userId, folderId);
  if (!folder) {
    throw new ApiError(httpStatus.NOT_FOUND, "Folder not found.");
  }
  const newParent = await getFolderById(userId, newParentId);
  if (!newParent) {
    throw new ApiError(httpStatus.NOT_FOUND, "New parent folder not found.");
  }
  if (folder.parent) {
    await syncFolderCount(folder.parent, -1);
    await syncFolderSize(folder.parent, 0, -folder.size);
  }
  folder.parent = newParentId;
  folder.path = path.join(newParent.path, folder.name);
  await syncFolderCount(newParentId, 1);
  await syncFolderSize(newParentId, 0, folder.size);

  return await folder.save();
};

const deleteFolderPermanent = async (userId, folders) => {
  const result = await Promise.all(
    folders.map(async (folderId) => {
      const folder = await folderModel.findOne({
        userId,
        _id: folderId,
        isTrashed: false,
      });
      if (!folder) return { folderId, status: "Folder not found" };

      await hardDeleteTree(folderId, {
        userId,
        isTrashed: false,
      });

      if (folder.parent) {
        await syncFolderCount(folder.parent, -1);
        await syncFolderSize(folder.parent, 0, -folder.size);
      }
      await userService.syncStorage(userId, -folder.size);

      return { folderId, status: "Folder permanently deleted" };
    })
  );
  return result;
};

const getFolderContents = async (userId, parentId, filter, options) => {
  const query = {
    userId,
    parent: parentId || null,
    isTrashed: false,
    isLocked: false,
  };

  if (filter.minSize || filter.maxSize) {
    query.size = {};
    if (filter.minSize !== "") query.size.$gte = filter.minSize;
    if (filter.mxSize !== "") query.size.$lte = filter.maxSize;
  }

  // Loop through each filter field and add conditions if they exist
  for (const key of Object.keys(filter)) {
    if (key === "minSize" || key === "maxSize") continue;
    if (key === "name" && filter[key] !== "") {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  const folders = await folderModel.find(query);
  const files = await fileModel.find(query);
  const foldersFormatted = folders.map((folder) => ({
    ...folder.toObject(),
    type: "folder",
  }));
  const filesFormatted = files.map((file) => ({
    ...file.toObject(),
    type: "file",
  }));

  const combinedResults = [...foldersFormatted, ...filesFormatted];

  return paginateArray(combinedResults, options);
};

module.exports = {
  getFolderById,
  syncFolderCount,
  syncFolderSize,
  createFolder,
  renameFolder,
  deleteFolder,
  deleteFolderPermanent,
  getFolderContents,
  moveFolder,
  hardDeleteTree,
  softDeleteTree,
};
