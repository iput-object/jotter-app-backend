const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const fileController = require("./file.controller");
const uploader = require("../../middlewares/fileUpload");
const fileValidation = require("./file.validation");

const router = express.Router();

router.patch(
  "/move",
  auth("user"),
  validate(fileValidation.moveOrCopy),
  fileController.moveFiles
);
router.patch(
  "/copy",
  auth("user"),
  validate(fileValidation.moveOrCopy),
  fileController.copyFiles
);

router
  .route("/")
  .post(
    auth("user"),
    uploader(),
    validate(fileValidation.uploadFile),
    fileController.uploadFiles
  )
  .delete(
    auth("user"),
    validate(fileValidation.filesArray),
    fileController.deleteFiles
  );
  
router.get(
  "/query",
  auth("user"),
  validate(fileValidation.queryFiles),
  fileController.queryFiles
);

router.delete(
  "/permanent",
  auth("user"),
  validate(fileValidation.filesArray),
  fileController.permanentDeleteFiles
);

router
  .route("/:fileId")
  .get(
    auth("common"),
    validate(fileValidation.paramFileId),
    fileController.getFile
  )
  .patch(
    auth("user"),
    validate(fileValidation.renameFile),
    fileController.renameFile
  );

router.get(
  "/:fileId/download",
  auth("user"),
  validate(fileValidation.paramFileId),
  fileController.downloadFile
);
router.put(
  "/replace",
  auth("user"),
  uploader(),
  validate(fileValidation.uploadFile),
  fileController.replaceFiles
);

module.exports = router;
