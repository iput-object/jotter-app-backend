const termsConditionsModel = require("./termsConditions.model");
const aboutUsModel = require("./aboutUs.model");
const privacyPolicyModel = require("./privacyPolicy.model");
const supportModel = require("./support.model");

const modifyTermsAndCondition = async (data) => {
  await termsConditionsModel.deleteMany();
  return await termsConditionsModel.create(data);
};

const modifyAboutUs = async (data) => {
  await aboutUsModel.deleteMany();
  return await aboutUsModel.create(data);
};

const modifyPrivacyPolicy = async (data) => {
  await privacyPolicyModel.deleteMany();
  return await privacyPolicyModel.create(data);
};

const modifySupport = async (data) => {
  await supportModel.deleteMany();
  return await supportModel.create(data);
};

const getTermsAndCondition = async () => {
  return await termsConditionsModel.findOne();
};

const getAboutUs = async () => {
  return await aboutUsModel.findOne();
};

const getPrivacyPolicy = async () => {
  return await privacyPolicyModel.findOne();
};

const getSupport = async () => {
  return await supportModel.findOne();
};

module.exports = {
  modifyTermsAndCondition,
  modifyAboutUs,
  modifyPrivacyPolicy,
  modifySupport,
  getTermsAndCondition,
  getAboutUs,
  getPrivacyPolicy,
  getSupport,
};
