const Joi = require("joi");

const register = {
  body: Joi.object().keys({
    pin: Joi.string().required(),
    securityQuestion: Joi.string().required().trim().min(10).max(255),
    securityAnswer: Joi.string().required().trim().min(2).max(255),
  }),
};

const login = {
  body: Joi.object().keys({
    pin: Joi.string().required(),
  }),
};

const resetPassword = {
  body: Joi.object().keys({
    securityAnswer: Joi.string().required(),
    newPin: Joi.string().required(),
  }),
};

const modify = {
  body: Joi.object().keys({
    pin: Joi.string(),
    newPin: Joi.string(),
    securityQuestion: Joi.string().trim().min(10).max(255),
    securityAnswer: Joi.string().trim().min(2).max(255),
  }),
};

module.exports = {
  register,
  login,
  modify,
  resetPassword,
};
