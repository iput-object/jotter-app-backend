const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const trashValidation = require("./trash.validation");
const trashController = require("./trash.controller");

const router = express.Router();

router
  .route("/")
  .get(
    auth("user"),
    validate(trashValidation.getTrashContents),
    trashController.getTrashContents
  )
  .delete(auth("user"), trashController.clearTrash)
  .post(
    auth("user"),
    validate(trashValidation.recoverTrashedItem),
    trashController.recoverTrashedItem
  );
router.delete(
  "/permanent",
  auth("user"),
  validate(trashValidation.recoverTrashedItem),
  trashController.permanentDelete
);

module.exports = router;
