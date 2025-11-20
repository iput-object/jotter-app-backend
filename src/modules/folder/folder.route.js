const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const folderValidation = require("./folder.validation");
const folderController = require("./folder.controller");

const router = express.Router();

router
  .route("/")
  .post(
    auth("user"),
    validate(folderValidation.createFolder),
    folderController.createFolder
  );

module.exports = router;
