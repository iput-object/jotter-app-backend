const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const { fileController } = require("../../controllers");
const uploader = require("../../middlewares/fileUpload");
const { fileValidation } = require("../../validations");

const router = express.Router();

router.post(
  "/",
  auth("user"),
  uploader(),
  validate(fileValidation.uploadFile),
  fileController.uploadFile
);
router.get(
  "/query",
  auth("user"),
  validate(fileValidation.queryFiles),
  fileController.queryFiles
);

router.delete(
  "/:fileId/permanent",
  auth("user"),
  validate(fileValidation.paramFileId),
  fileController.permanentDeleteFile
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
  )
  .delete(
    auth("user"),
    validate(fileValidation.paramFileId),
    fileController.deleteFile
  );

router.get(
  "/:fileId/download",
  auth("user"),
  validate(fileValidation.paramFileId),
  fileController.downloadFile
);

router.patch(
  "/:fileId/copy",
  auth("user"),
  validate(fileValidation.moveOrCopy),
  fileController.copyFile
);
router.patch(
  "/:fileId/move",
  auth("user"),
  validate(fileValidation.moveOrCopy),
  fileController.moveFile
);
module.exports = router;
