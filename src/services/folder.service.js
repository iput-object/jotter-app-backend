const { Folder } = require("../models");

const getFolderById = async (userId, folderId) => {
  return await Folder.findOne({
    userId,
    _id: folderId,
    isArchived: false,
    isLocked: false,
  });
};

module.exports = {
  getFolderById,
};
