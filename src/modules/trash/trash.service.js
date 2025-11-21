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
    path: "/Trash",
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
      const isFolder = item.type && item.type === "folder";
      if (!isFolder) {
        const fileItem = await fileModel.findOne({
          userId,
          _id: item.id,
          isTrashed: true,
        });
        if (!fileItem) return { id: item.id, status: "not found" };
        await fileService.hardDeleteFile(fileItem);
      } else {
        const folder = await folderModel.findOne({
          userId,
          _id: item.id,
          isTrashed: true,
        });
        if (!folder) return { id: item.id, status: "not found" };
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
  return Promise.all(
    items.map(async (item) => {
      const isFolder = item.type === "folder";
      const model = isFolder ? folderModel : fileModel;

      let doc = await model
        .findOne({ _id: item.id, userId })
        .populate("parent");
      if (!doc) return { id: item.id, status: "Not Found" };

      doc.isTrashed = false;
      if (!doc.parent || doc.parent.isTrashed) {
        doc.parent = null;
        doc.path = doc.name || doc.originalName;
      } else {
        doc.path = path.join(doc.parent.path, doc.name || doc.originalName);
      }

      await doc.save();

      return { id: item.id, status: "Recovered Successfully" };
    })
  );
};

module.exports = {
  getTrashedContents,
  clearTrash,
  recoverTrashedItem,
  permanentDelete,
};
