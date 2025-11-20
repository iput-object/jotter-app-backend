const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const infoController = require("./info.controller");
const infoValidation = require("./info.validation");

const router = express.Router();

router
  .route("/terms")
  .get(auth("common"), infoController.getTermsAndCondition)
  .post(
    auth("admin"),
    validate(infoValidation.aboutContents),
    infoController.modifyTermsAndCondition
  );

router
  .route("/about")
  .get(auth("common"), infoController.getAboutUs)
  .post(
    auth("admin"),
    validate(infoValidation.aboutContents),
    infoController.modifyAboutUs
  );

router
  .route("/privacy")
  .get(auth("common"), infoController.getPrivacyPolicy)
  .post(
    auth("admin"),
    validate(infoValidation.aboutContents),
    infoController.modifyPrivacyPolicy
  );

router
  .route("/support")
  .get(auth("common"), infoController.getSupport)
  .post(
    auth("admin"),
    validate(infoValidation.aboutContents),
    infoController.modifySupport
  );

module.exports = router;
