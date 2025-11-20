const Joi = require("joi");
const { objectId } = require("../../utils/joi");

const uploadFile = {
  body: Joi.object().keys({
    files: Joi.optional(),
    folderId: Joi.custom(objectId).optional(),
  }),
};

const queryFiles = {
  query: Joi.object().keys({
    originalName: Joi.string().optional(),
    fileType: Joi.string().optional(),
    path: Joi.string().optional(),
    maxSize: Joi.number().optional(),
    minSize: Joi.number().optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().optional(),
    page: Joi.number().optional(),
  }),
};

const paramFileId = {
  params: Joi.object().keys({
    fileId: Joi.custom(objectId).required(),
  }),
};

const filesArray = {
  body: Joi.object().keys({
    files: Joi.array().required(),
  }),
};

const renameFile = {
  params: Joi.object().keys({
    fileId: Joi.custom(objectId).required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
  }),
};

const moveOrCopy = {
  params: Joi.object().keys({
    fileId: Joi.custom(objectId).required(),
  }),
  body: Joi.object().keys({
    targetFolder: Joi.custom(objectId).required(),
    name: Joi.string(),
  }),
};
module.exports = {
  uploadFile,
  queryFiles,
  paramFileId,
  renameFile,
  moveOrCopy,
  filesArray,
};
