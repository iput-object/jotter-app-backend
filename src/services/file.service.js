const httpStatus = require("http-status");
const { Folder, File, User } = require("../models");
const ApiError = require("../utils/ApiError");
const { delFile, isFileExist } = require("../utils/fs");
const { folderService } = require(".");
const { generateFileName } = require("../utils/name");
const path = require("path");

const syncStorage = async (userId, size) => {
  await User.findByIdAndUpdate(userId, { $inc: { "storage.used": size } });
};
const getFileById = async (userId, _id) => {
  return await File.findOne({
    userId,
    _id,
    isArchived: false,
    isLocked: false,
  });
};

const isFileAlreadyExist = async (userId, originalName, folderId) => {
  const file = await File.findOne({
    userId,
    originalName,
    folderId,
    isArchived: false,
    isLocked: false,
  });
  if (file) {
    throw new ApiError(httpStatus.CONFLICT, "File Already Exist");
  }
};

const uploadFile = async (userId, folderId, filesData) => {
  if (folderId) {
    const folderExists = await Folder.exists({ _id: folderId });
    if (!folderExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Parent Folder not found.");
    }
  }

  const payloads = filesData.map((file) => ({
    userId,
    folderId: folderId || null,

    name: file.filename,
    originalName: file.originalname,
    path: file.path,
    fileType: file.mimetype,
    size: file.size,

    metadata: {
      encoding: file.encoding,
      fieldname: file.fieldname,
    },
  }));

  const totalSize = filesData.reduce((sum, file) => sum + file.size, 0);
  await syncStorage(userId, totalSize);

  return await File.insertMany(payloads);
};

const queryFiles = async (userId, filter, options) => {
  const query = {
    userId,
    isArchived: false,
    isLocked: false,
  };

  if (filter.minSize || filter.maxSize) {
    query.size = {};
    if (filter.minSize !== "") query.size.$gte = filter.minSize;
    if (filter.maxSize !== "") query.size.$lte = filter.maxSize;
  }

  // Loop through each filter field and add conditions if they exist
  for (const key of Object.keys(filter)) {
    if (key === "minSize" || key === "maxSize") continue;
    if ((key === "fileType" || key === "originalName") && filter[key] !== "") {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  return await File.paginate(query, options);
};

const deleteFile = async (userId, fileId) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File not found");
  }
  file.isArchived = true;
  return await file.save();
};

const permanentDeleteFile = async (userId, fileId) => {
  // This requires more improvements for stability
  const file = await getFileById(userId, fileId);

  if (!file) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "File not found");
  }

  try {
    await delFile(file.path);
    await syncStorage(userId, -file.size);
    await file.deleteOne();
  } catch (error) {
    throw new ApiError(httpStatus.BAD_GATEWAY, error.message);
  }
};

const getFile = async (userId, fileId) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "File not found");
  }
  return file;
};

const replaceFile = async (userId, fileId, files) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found to replace");
  }
  const fileData = files[0];
  await delFile(file.path);
  const payload = {
    name: fileData.filename,
    originalName: fileData.originalname,
    path: fileData.path,
    fileType: fileData.mimetype,
    size: fileData.size,
    metadata: {
      encoding: fileData.encoding,
      fieldname: fileData.fieldname,
    },
  };

  await syncStorage(userId, -file.size + fileData.size);

  Object.assign(file, payload);
  return await file.save();
};

const renameFile = async (userId, fileId, newName) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found");
  }
  if (file.originalName === newName) {
    return;
  }

  file.originalName = newName;
  return await file.save();
};

const downloadFile = async (userId, fileId) => {
  const file = await getFileById(userId, fileId);
  console.log({ file });
  if (!file || !isFileExist(file.path)) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found");
  }
  return {
    path: file.path,
    name: file.originalName,
    size: file.size,
    type: file.fileType,
  };
};

const copyFile = async (userId, fileId, targetFolder, newName) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found");
  }
  const folder = await folderService.getFolderById(userId, targetFolder);
  if (!folder) {
    throw new ApiError(httpStatus.NOT_FOUND, "Folder not found");
  }

  if (
    file.folderId.toString() === targetFolder.toString() &&
    (!newName || newName === file.originalName)
  ) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "File already exists in target folder"
    );
  }

  const newFileName = generateFileName(newName || file.originalName);
  const folderDir = path.dirname(file.path);
  const newFilePath = path.join(folderDir, newFileName);
  await fs.copyFile(file.path, newFilePath);

  const newFile = {
    userId: userId,
    folderId: targetFolder,
    name: newFileName,
    originalName: newName || file.originalName,
    path: newFilePath,
    size: file.size,
    mimeType: file.mimeType,
    isArchived: false,
    isLocked: false,
  };

  await syncStorage(userId, file.size);

  return await File.create(newFile);
};

const moveFile = async (userId, fileId, targetFolder) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found");
  }
  const folder = await folderService.getFolderById(userId, targetFolder);
  if (!folder) {
    throw new ApiError(httpStatus.NOT_FOUND, "Folder not found");
  }

  if (file.folderId.toString() === targetFolder.toString()) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "File already exists in target folder"
    );
  }

  file.folderId = targetFolder;
  return await file.save();
};

module.exports = {
  uploadFile,
  deleteFile,
  replaceFile,
  renameFile,
  queryFiles,
  permanentDeleteFile,
  getFile,
  downloadFile,
  copyFile,
  moveFile,
};
