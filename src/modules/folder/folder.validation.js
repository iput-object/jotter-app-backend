const Joi = require("joi");
const { objectId } = require("../../utils/joi");

const getFolderContents = {
  query: Joi.object().keys({
    name: Joi.string(),
    maxSize: Joi.number().min(0),
    minSize: Joi.number().min(0),
  }),
  body: Joi.object().keys({
    parentId: Joi.custom(objectId).allow(null),
  }),
};

const createFolder = {
  body: Joi.object().keys({
    name: Joi.string().required().min(1),
    parent: Joi.custom(objectId),
  }),
};

const renameFolder = {
  body: Joi.object().keys({
    folderId: Joi.custom(objectId).required(),
    newName: Joi.string().required().min(1),
  }),
};

const deleteFolder = {
  body: Joi.object().keys({
    folders: Joi.array().items(Joi.custom(objectId)).required(),
  }),
};

const moveFolder = {
  body: Joi.object().keys({
    folderId: Joi.custom(objectId).required(),
    newParentId: Joi.custom(objectId).allow(null),
  }),
};
module.exports = {
  createFolder,
  renameFolder,
  deleteFolder,
  moveFolder,
  getFolderContents,
};
