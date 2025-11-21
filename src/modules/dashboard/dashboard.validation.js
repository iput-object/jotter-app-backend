const Joi = require("joi");

const getRecent = {
  query: Joi.object().keys({
    limit: Joi.number().integer().min(1).max(50).optional(),
    shuffle: Joi.boolean().optional(),
  }),
};

const getByCategory = {
  params: Joi.object().keys({
    category: Joi.string()
      .valid("images", "videos", "documents", "audio", "archives", "others")
      .required(),
  }),
  query: Joi.object().keys({
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
};

const getAllFiles = {
  query: Joi.object().keys({
    type: Joi.string().valid("notes", "images", "pdfs", "folders", "all").optional(),
    sortBy: Joi.string().optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    page: Joi.number().integer().min(1).optional(),
  }),
};

module.exports = {
  getRecent,
  getByCategory,
  getAllFiles,
};
