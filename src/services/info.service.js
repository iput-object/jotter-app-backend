const {
  TermsAndCondition,
  AboutUs,
  PrivacyPolicy,
  Support,
} = require("../models");

const modifyTermsAndCondition = async (data) => {
  await TermsAndCondition.deleteMany();
  return await TermsAndCondition.create(data);
};

const modifyAboutUs = async (data) => {
  await AboutUs.deleteMany();
  return await AboutUs.create(data);
};

const modifyPrivacyPolicy = async (data) => {
  await PrivacyPolicy.deleteMany();
  return await PrivacyPolicy.create(data);
};

const modifySupport = async (data) => {
  await Support.deleteMany();
  return await Support.create(data);
};

const getTermsAndCondition = async () => {
  return await TermsAndCondition.findOne();
};

const getAboutUs = async () => {
  return await AboutUs.findOne();
};

const getPrivacyPolicy = async () => {
  return await PrivacyPolicy.findOne();
};

const getSupport = async () => {
  return await Support.findOne();
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
