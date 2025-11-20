const Joi = require("joi");
const { objectId } = require("../../utils/joi");

const getTrashContents = {
  query: Joi.object().keys({
    name: Joi.string(),
    maxSize: Joi.number().min(0),
    minSize: Joi.number().min(0),
  }),
  body: Joi.object().keys({
    parentId: Joi.custom(objectId).allow(null),
  }),
};

const recoverTrashedItem = {
  body: Joi.object().keys({
    items: Joi.array()
      .items(
        Joi.object().keys({
          id: Joi.custom(objectId).required(),
          type: Joi.string().valid("file", "folder").required(),
        })
      )
      .required(),
  }),
};
module.exports = {
  getTrashContents,
  recoverTrashedItem,
  
};
