const path = require("path");
const httpStatus = require("http-status");
const fileModel = require("./file.model");
const { userModel } = require("../user");
const { folderService } = require("../folder");
const ApiError = require("../../utils/ApiError");
const { delFile, isFileExist } = require("../../utils/fs");
const { generateFileName } = require("../../utils/name");
const { isObjectId } = require("../../utils/regex");

const syncStorage = async (userId, size) => {
  await userModel.findByIdAndUpdate(userId, { $inc: { "storage.used": size } });
};

const getFileById = async (userId, _id) => {
  if (!isObjectId(_id)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid file ID");
  }
  return await fileModel.findOne({
    userId,
    _id,
    isTrashed: false,
    isLocked: false,
  });
};

const uploadFiles = async (userId, folderId, filesData) => {
  let relativePath;
  if (folderId) {
    const folderExists = await folderService.getFolderById(userId, folderId);
    if (!folderExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Parent Folder not found.");
    }
    relativePath = folderExists.path;
  }

  const payloads = filesData.map((file) => ({
    userId,
    parent: folderId || null,
    name: file.filename,
    originalName: file.originalname,
    path: path.join(relativePath, file.originalName),
    cloudPath: file.path,
    fileType: file.mimetype,
    size: file.size,

    metadata: {
      encoding: file.encoding,
      fieldname: file.fieldname,
    },
  }));

  const totalSize = filesData.reduce((sum, file) => sum + file.size, 0);
  if (parent) await folderService.syncFolderSize(folderId, filesData.length, totalSize);
  await syncStorage(userId, totalSize);

  return await fileModel.insertMany(payloads);
};

const queryFiles = async (userId, filter, options) => {
  const query = {
    userId,
    isTrashed: false,
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
    if (
      (key === "fileType" || key === "originalName" || key === "path") &&
      filter[key] !== ""
    ) {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  return await fileModel.paginate(query, options);
};

const deleteFiles = async (userId, files) => {
  const response = await Promise.all(
    files.map(async (fileId) => {
      const file = await getFileById(userId, fileId);
      if (!file) return null;
      file.isTrashed = true;
      const savedFile = await file.save();
      return { id: savedFile._id, originalName: savedFile.originalName };
    })
  );

  return response.filter(boolean);
};

const permanentDeleteFiles = async (userId, files) => {
  // This requires more improvements for stability
  const response = await Promise.all(
    files.map(async (file) => {
      const doc = await getFileById(userId, fileId);
      if (!doc) return null;
      try {
        await delFile(file.cloudPath);
        await syncStorage(userId, -file.size);
        await doc.deleteOne();
      } catch (error) {
        throw new ApiError(httpStatus.BAD_GATEWAY, error.message);
      }
    })
  );

  return response.filter(boolean);
};

const getFile = async (userId, fileId) => {
  const file = await getFileById(userId, fileId);
  if (!file) {
    throw new ApiError(httpStatus.BAD_GATEWAY, "File not found");
  }
  return file;
};

const replaceFiles = async (userId, operations) => {
  const results = await Promise.all(
    operations.map(async (fileData) => {
      const fileId = fileData?.fieldname;
      const doc = await getFileById(userId, fileId);
      if (!doc) {
        return {
          fileId,
          name: fileData.originalname,
          message: "File not found",
        };
      }

      await delFile(doc.cloudPath);

      const payload = {
        name: fileData.filename,
        originalName: fileData.originalname,
        cloudPath: fileData.path,
        fileType: fileData.mimetype,
        size: fileData.size,
        metadata: {
          encoding: fileData.encoding,
          fieldname: fileData.fieldname,
        },
      };

      const sizeDiff = fileData.size - doc.size;
      await syncStorage(userId, sizeDiff);

      Object.assign(doc, payload);

      const saved = await doc.save();

      return {
        id: saved._id.toString(),
        name: fileData.originalname,
        message: "Replaced Successfully",
      };
    })
  );

  return results;
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
  if (!file || !isFileExist(file.cloudPath)) {
    throw new ApiError(httpStatus.NOT_FOUND, "File not found");
  }
  return {
    cloudPath: file.cloudPath,
    name: file.originalName,
    size: file.size,
    type: file.fileType,
  };
};

const copyFiles = async (userId, operations) => {
  const result = await Promise.all(
    operations.map(async (operation) => {
      const { fileId, newName, targetFolder } = operation;
      const file = await getFileById(userId, fileId);
      if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, "File not found");
      }
      const folder = await folderService.getFolderById(userId, targetFolder);
      if (!folder) {
        throw new ApiError(httpStatus.NOT_FOUND, "Folder not found");
      }
      if (
        file.parent.toString() === targetFolder.toString() &&
        (!newName || newName === file.originalName)
      ) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "File already exists in target folder"
        );
      }

      const newFileName = generateFileName(newName || file.originalName);
      const folderDir = path.dirname(file.cloudPath);
      const newFilePath = path.join(folderDir, newFileName);
      await fs.copyFile(file.cloudPath, newFilePath);
      const relativePath = path.join(folder.path, newName || file.originalName);

      const newFile = {
        userId: userId,
        parent: targetFolder,
        name: newFileName,
        originalName: newName || file.originalName,
        path: relativePath,
        cloudPath: newFilePath,
        size: file.size,
        mimeType: file.mimeType,
        isTrashed: false,
        isLocked: false,
      };

      await syncStorage(userId, file.size);

      return await fileModel.create(newFile);
    })
  );

  return result;
};

const moveFiles = async (userId, operations) => {
  const result = await Promise.all(
    operations.map(async (operation) => {
      const file = await getFileById(userId, operation?.fileId);
      if (!file) {
        throw new ApiError(httpStatus.NOT_FOUND, "File not found");
      }
      const folder = await folderService.getFolderById(
        userId,
        operation?.targetFolder
      );
      if (!folder) {
        throw new ApiError(httpStatus.NOT_FOUND, "Folder not found");
      }
      const relativePath = path.join(folder.path, file.originalName);

      if (file.parent.toString() === targetFolder.toString()) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "File already exists in target folder"
        );
      }

      file.parent = targetFolder;
      file.path = relativePath;
      return await file.save();
    })
  );
  return result;
};

module.exports = {
  uploadFiles,
  deleteFiles,
  replaceFiles,
  renameFile,
  queryFiles,
  permanentDeleteFiles,
  getFile,
  downloadFile,
  copyFiles,
  moveFiles,
};
