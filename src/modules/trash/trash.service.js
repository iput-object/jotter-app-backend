const trashModel = require("./trash.model");
const { fileModel, fileService } = require("../file");
const { folderModel, folderService } = require("../folder");
const path = require("path");

const addToTrash = async (userId, resourcesId, isFile = true) => {
  const model = isFile ? fileModel : folderModel;
  const type = isFile ? "file" : "folder";

  const item = await model.findOne({
    userId,
    _id: resourcesId,
    isTrashed: false,
  });
  if (!item)
    return { success: false, id: resourcesId, status: `${type} not found.` };
  if (item.parent) {
    if (isFile) {
      await folderService.syncFolderSize(item.parent, -1, -item.size);
    } else {
      await folderService.syncFolderCount(item.parent, -1, -item.size);
    }
  }
  item.isTrashed = true;
  await item.save();
  await trashModel.create({
    userId,
    [type]: resourcesId,
    type: type,
  });
  return {
    success: true,
    id: resourcesId,
    status: `${type} added to the trash.`,
  };
};

const getTrashedContents = async (userId, options) => {
  const query = {
    userId,
  };
  options.populate = "file,folder";
  if (!options.sortBy) options.sortBy = "createdAt:desc";
  console.log(options);
  return await trashModel.paginate(query, options);
};

const clearTrash = async (userId) => {
  const trashItems = await trashModel
    .find()
    .populate("file")
    .populate("folder");
  await Promise.all(
    trashItems.map(async (item) => {
      if (item.type === "file") {
        const file = await fileModel.findOne({
          userId,
          _id: item.file,
          isTrashed: true,
        });

        if (file) await fileService.hardDeleteFile(file);
      } else {
        await folderService.hardDeleteTree(item.folder, {
          userId,
        });
      }
      await trashModel.findByIdAndDelete(item._id);
    })
  );
};

const permanentDelete = async (userId, items) => {
  const result = await Promise.all(
    items.map(async (item) => {
      const trashItem = await trashModel.findOne({ userId, _id: item });
      if (trashItem.type === "file") {
        const file = await fileModel.findOne({
          userId,
          _id: trashItem.file,
          isTrashed: true,
        });
        await fileService.hardDeleteFile(file);
      } else {
        await folderService.hardDeleteTree(trashItem.folder, {
          userId,
        });
      }
      return {
        success: true,
        id: item,
        status: "Item Deleted from Trash",
      };
    })
  );
  return result;
};

const recoverTrashedItem = async (userId, items) => {
  return Promise.all(
    items.map(async (item) => {
      const trashItem = await trashModel.findOne({ userId, _id: item });
      let model;
      if (trashItem.type === "file") {
        model = await fileModel
          .findOne({
            userId,
            _id: trashItem.file,
            isTrashed: true,
          })
          .populate("parent");
      } else {
        model = await folderModel
          .findOne({
            userId,
            _id: trashItem.folder,
            isTrashed: true,
          })
          .populate("parent");
      }

      model.isTrashed = false;
      if (!model.parent || model.parent.isTrashed) {
        model.parent = null;
        model.path = model.originalName || model.name;
      } else {
        model.path = path.join(
          model.parent.path,
          model.originalName || model.name
        );
      }

      await model.save();
      await trashModel.findByIdAndDelete(item);
      return {
        success: true,
        id: item,
        status: "Item Recovered from Trash",
      };
    })
  );
};

module.exports = {
  getTrashedContents,
  clearTrash,
  recoverTrashedItem,
  permanentDelete,
  addToTrash,
};
