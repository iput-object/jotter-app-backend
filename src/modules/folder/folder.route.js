const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const folderValidation = require("./folder.validation");
const folderController = require("./folder.controller");

const router = express.Router();

router
  .route("/")
  .get(
    auth("user"),
    validate(folderValidation.getFolderContents),
    folderController.getFolderContents
  )
  .post(
    auth("user"),
    validate(folderValidation.createFolder),
    folderController.folderCreate
  )
  .patch(
    auth("user"),
    validate(folderValidation.renameFolder),
    folderController.folderRename
  )
  .delete(
    auth("user"),
    validate(folderValidation.deleteFolder),
    folderController.folderDelete
  );
router.patch(
  "/move",
  auth("user"),
  validate(folderValidation.moveFolder),
  folderController.folderMove
);

router.get(
  "/:folderId",
  auth("user"),
  validate(folderValidation.folderDetails),
  folderController.getFolder
);


router.delete(
  "/permanent",
  auth("user"),
  validate(folderValidation.deleteFolder),
  folderController.folderDeletePermanent
);

module.exports = router;
