const path = require("path");
const httpStatus = require("http-status");
const fileModel = require("./file.model");
const { userService } = require("../user");
const { folderService, folderModel } = require("../folder");
const ApiError = require("../../utils/ApiError");
const fs = require("../../utils/fs");
const { generateFileName } = require("../../utils/name");
const { isObjectId } = require("../../utils/regex");
const mongoose = require("mongoose");

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

const hardDeleteFile = async (file) => {
  await fs.delFile(file.cloudPath);
  await userService.syncStorage(file.userId, -file.size);
  await file.deleteOne();
};

const uploadFiles = async (userId, folderId, filesData) => {
  let relativePath = "/";

  if (folderId) {
    const folderExists = await folderService.getFolderById(userId, folderId);
    if (!folderExists) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Parent Folder not found.");
    }
    relativePath += folderExists.path;
  }

  const finalPayloads = [];

  for (const file of filesData) {
    let finalName = file.originalname;
    const parent = folderId || null;
    const ext = path.extname(finalName);
    const base = path.basename(finalName, ext);

    let counter = 1;
    while (
      await fileModel.findOne({ userId, parent, originalName: finalName })
    ) {
      finalName = `${base} (${counter})${ext}`;
      counter++;
    }

    finalPayloads.push({
      userId,
      parent,
      name: file.filename,
      originalName: finalName,
      path: path.join(relativePath, finalName),
      cloudPath: file.path,
      fileType: file.mimetype,
      size: file.size,
      metadata: {
        encoding: file.encoding,
        fieldname: file.fieldname,
      },
    });
  }

  const totalSize = finalPayloads.reduce((sum, f) => sum + f.size, 0);

  if (folderId && finalPayloads.length > 0) {
    await folderService.syncFolderSize(
      folderId,
      finalPayloads.length,
      totalSize
    );
  }

  await userService.syncStorage(userId, totalSize);

  return await fileModel.insertMany(finalPayloads);
};

// AI COOKED
const queryFiles = async (userId, filter, options) => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    order = "desc",
  } = options;

  // Base match: files not trashed or locked
  const matchQuery = {
    userId: new mongoose.Types.ObjectId(userId),
    isTrashed: false,
    isLocked: false,
  };

  // Size filter
  if (filter.minSize || filter.maxSize) {
    matchQuery.size = {};
    if (filter.minSize !== "") matchQuery.size.$gte = filter.minSize;
    if (filter.maxSize !== "") matchQuery.size.$lte = filter.maxSize;
  }

  // Other filters
  for (const key of Object.keys(filter)) {
    if (key === "minSize" || key === "maxSize") continue;
    if (
      (key === "fileType" || key === "originalName" || key === "path") &&
      filter[key] !== ""
    ) {
      matchQuery[key] = { $regex: filter[key], $options: "i" };
    } else if (filter[key] !== "") {
      matchQuery[key] = filter[key];
    }
  }

  const skip = (page - 1) * limit;
  const sortOrder = order === "asc" ? 1 : -1;

  const aggPipeline = [
    { $match: matchQuery },

    // Recursively get all parent folders
    {
      $graphLookup: {
        from: "folders",
        startWith: "$parent",
        connectFromField: "parent",
        connectToField: "_id",
        as: "ancestors",
        restrictSearchWithMatch: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
    },

    // Add flag if any ancestor is trashed
    {
      $addFields: {
        hasTrashedParent: {
          $anyElementTrue: {
            $map: { input: "$ancestors", as: "a", in: "$$a.isTrashed" },
          },
        },
        hasLockedParent: {
          $anyElementTrue: {
            $map: { input: "$ancestors", as: "a", in: "$$a.isLocked" },
          },
        },
      },
    },

    // Only keep files with no trashed ancestors
    { $match: { hasTrashedParent: false, hasLockedParent: false } },

    // Sort
    { $sort: { [sortBy]: sortOrder } },

    // Pagination
    { $skip: skip },
    { $limit: limit },
  ];

  const docs = await fileModel.aggregate(aggPipeline);

  // Get total count for pagination
  const totalDocsAgg = await fileModel.aggregate([
    { $match: matchQuery },
    {
      $graphLookup: {
        from: "folders",
        startWith: "$parent",
        connectFromField: "parent",
        connectToField: "_id",
        as: "ancestors",
        restrictSearchWithMatch: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
    },
    {
      $addFields: {
        hasTrashedParent: {
          $anyElementTrue: {
            $map: { input: "$ancestors", as: "a", in: "$$a.isTrashed" },
          },
        },
      },
    },
    { $match: { hasTrashedParent: false } },
    { $count: "total" },
  ]);

  const totalResults = totalDocsAgg[0] ? totalDocsAgg[0].total : 0;
  const totalPages = Math.ceil(totalResults / limit);

  return {
    result: docs,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

const deleteFiles = async (userId, files) => {
  const { addToTrash } = require("../trash/trash.service");

  const response = await Promise.all(
    files.map(async (fileId) => {
      return await addToTrash(userId, fileId, true);
    })
  );
  return response;
};

const permanentDeleteFiles = async (userId, files) => {
  const response = await Promise.all(
    files.map(async (file) => {
      const doc = await getFileById(userId, file);
      if (!doc) return { id: file, status: "File not found" };
      try {
        await hardDeleteFile(doc);
      } catch (error) {
        throw new ApiError(httpStatus.BAD_GATEWAY, error.message);
      }
      return { id: file, status: "Deleted Successfully" };
    })
  );
  return response;
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

      await fs.delFile(doc.cloudPath);

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
      await userService.syncStorage(userId, sizeDiff);

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

  file.path = path.join(path.dirname(file.path), newName);
  file.originalName = newName;
  return await file.save();
};

const downloadFile = async (userId, fileId) => {
  const file = await fileModel.findOne({ userId, _id: fileId });
  console.log({ file });
  if (!file || !fs.isFileExist(file.cloudPath)) {
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
  const { targetFolder, files } = operations;

  let folderPath = "";
  if (targetFolder) {
    const folder = await folderService.getFolderById(userId, targetFolder);
    if (!folder) throw new ApiError(httpStatus.NOT_FOUND, "Folder not found");
    folderPath = folder.path;
  }

  const result = await Promise.all(
    files.map(async (fileId) => {
      const file = await getFileById(userId, fileId);
      if (!file) throw new ApiError(httpStatus.NOT_FOUND, "File not found");

      let baseName = file.originalName;
      let existingFile = await fileModel.findOne({
        userId,
        parent: targetFolder,
        originalName: baseName,
      });

      let counter = 1;
      while (existingFile) {
        const ext = path.extname(baseName);
        const nameWithoutExt = path.basename(baseName, ext);
        baseName = `${nameWithoutExt} (${counter})${ext}`;
        existingFile = await fileModel.findOne({
          userId,
          parent: targetFolder,
          originalName: baseName,
        });
        counter++;
      }

      const newCloudName = generateFileName(baseName);
      const folderDir = path.dirname(file.cloudPath);
      const newFilePath = path.join(folderDir, newCloudName);
      await fs.cpFile(file.cloudPath, newFilePath);

      const relativePath = targetFolder
        ? path.join(folderPath, baseName)
        : baseName;

      const newFile = {
        userId,
        parent: targetFolder || null,
        name: newCloudName,
        originalName: baseName,
        path: relativePath,
        cloudPath: newFilePath,
        size: file.size,
        fileType: file.fileType,
        isTrashed: false,
        isLocked: false,
      };

      await userService.syncStorage(userId, file.size);

      return fileModel.create(newFile);
    })
  );

  return result;
};

const moveFiles = async (userId, operations) => {
  const { targetFolder, files } = operations;

  let folderPath = "";
  if (targetFolder) {
    const folder = await folderService.getFolderById(userId, targetFolder);
    if (!folder) {
      throw new ApiError(httpStatus.NOT_FOUND, "Folder not found");
    }
    folderPath = folder.path;
  }

  const result = await Promise.all(
    files.map(async (fileId) => {
      const file = await getFileById(userId, fileId);
      if (!file) throw new ApiError(httpStatus.NOT_FOUND, "File not found");

      if (file.parent?.toString() === targetFolder?.toString()) {
        throw new ApiError(
          httpStatus.CONFLICT,
          "File already exists in target folder"
        );
      }

      file.parent = targetFolder || null; // Set parent to null if targetFolder is null
      file.path = targetFolder
        ? path.join(folderPath, file.originalName)
        : file.originalName;

      return file.save();
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
  getFileById,
  hardDeleteFile,
};
