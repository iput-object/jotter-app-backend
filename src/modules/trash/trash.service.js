const { fileModel, fileService } = require("../file");
const { folderModel, folderService } = require("../folder");

const paginateArray = require("../../utils/pagination");
const fs = require("../../utils/fs");

const createTrashDirectory = async (userId) => {
  const dir = folderModel.findOne({
    userId,
    name: "Trash",
    parent: null,
  });
  if (dir) return dir;
  const folder = folderModel.create({
    name: "Trash",
    path: "Trash",
    userId,
  });
  return folder;
};

const getTrashedContents = async (userId, parentId, filter, options) => {
  const query = {
    userId,
    isTrashed: true,
    isLocked: false,
  };

  if (parentId) query.parent = parentId;

  if (filter.minSize || filter.maxSize) {
    query.size = {};
    if (filter.minSize !== "") query.size.$gte = filter.minSize;
    if (filter.maxSize !== "") query.size.$lte = filter.maxSize;
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

const clearTrash = async (userId) => {
  const fileItems = await fileModel.find({ userId, isTrashed: true });
  await Promise.all(fileItems.map((file) => fs.delFile(file.cloudPath)));
  await fileModel.deleteMany({ userId, isTrashed: true });
  await folderModel.deleteMany({ userId, isTrashed: true });
};

const permanentDelete = async (userId, items) => {
  const result = await Promise.all(
    items.map(async (item) => {
      if (item.type === "file") {
        const fileItem = await fileModel.findOne({
          userId,
          _id: item.id,
          isTrashed: true,
        });
        if (!fileItem) return { id: item.id, status: "not found" };
        await fileService.hardDeleteFile(fileItem);
      } else {
        await folderService.hardDeleteTree(item.id, {
          userId,
          isTrashed: true,
        });
      }
      return { id: item.id, status: "deleted" };
    })
  );
  return result;
};

const recoverTrashedItem = async (userId, items) => {
  const result = await Promise.all(
    items.map(async (item) => {
      if (item.type === "folder") {
        const folder = await folderModel.findById(item.id).populate("parent");
        if (!folder) return { id: item.id, status: "Folder Not Found" };
        folder.isTrashed = false;
        if (folder.parent && folder.parent.isTrashed) {
          const trashDir = await createTrashDirectory(userId);
          folder.parent = trashDir._id;
          folder.path = path.join(trashDir.path, folder.name);
        }
        await folder.save();
      } else {
        const file = await fileModel.findById(item.id).populate("parent");
        if (!file) return { id: item.id, status: "File Not Found" };
        file.isTrashed = false;
        if (file.parent && file.parent.isTrashed) {
          const trashDir = await createTrashDirectory(userId);
          file.parent = trashDir._id;
          file.path = path.join(trashDir.path, file.originalName);
        }
        await file.save();
      }

      return { id: item.id, type: "Recovered SuccussFully" };
    })
  );
  return result;
};
module.exports = {
  getTrashedContents,
  clearTrash,
  recoverTrashedItem,
  permanentDelete,
};
