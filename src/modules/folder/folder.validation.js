const Joi = require("joi");
const { objectId } = require("../../utils/joi");

const createFolder = {
  body: Joi.object().keys({
    name: Joi.string().required().min(1),
    parent: Joi.custom(objectId),
  }),
};
module.exports = {
  createFolder,
};
