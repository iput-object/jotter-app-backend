const Joi = require("joi");
const { objectId } = require("../../utils/joi");

const getTrashContents = {
  query: Joi.object().keys({
    name: Joi.string(),
    maxSize: Joi.number().min(0),
    minSize: Joi.number().min(0),
  }),
};

const recoverTrashedItem = {
  body: Joi.object().keys({
    items: Joi.array().items(Joi.custom(objectId).required()).required(),
  }),
};
module.exports = {
  getTrashContents,
  recoverTrashedItem,
};
