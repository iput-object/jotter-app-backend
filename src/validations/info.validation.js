const Joi = require("joi");

const aboutContents = {
  body: Joi.object().keys({
    content: Joi.string().required(),
  }),
};

module.exports = {
  aboutContents,
};
