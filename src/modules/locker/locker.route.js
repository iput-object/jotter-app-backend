const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const lockerValidation = require("./locker.validation");
const lockerController = require("./locker.controller");
const lockerAuth = require("../../middlewares/lockerAuth");

const router = express.Router();

router.post(
  "/setup",
  auth("user"),
  validate(lockerValidation.register),
  lockerController.setupLocker
);
router.post(
  "/login",
  auth("user"),
  validate(lockerValidation.login),
  lockerController.loginLocker
);

router.get(
  "/status",
  auth("user"),
  lockerAuth(),
  lockerController.getLockerDetails
);

router.get("/recover", auth("user"), lockerController.forgetLocker);
router.post(
  "/reset-pin",
  auth("user"),
  validate(lockerValidation.resetPassword),
  lockerController.resetPassword
);

router.patch(
  "/modify",
  auth("user"),
  lockerAuth(),
  validate(lockerValidation.modify),
  lockerController.modifyLocker
);

// File Management Routes
router
  .route("/files")
  .get(auth("user"), lockerAuth(), lockerController.getItems)
  .post(
    auth("user"),
    lockerAuth(),
    validate(lockerValidation.addToLocker),
    lockerController.addItemToLocker
  )
  .delete(
    auth("user"),
    lockerAuth(),
    validate(lockerValidation.filesArr),
    lockerController.permanentDelete
  )
  .patch(
    auth("user"),
    lockerAuth(),
    validate(lockerValidation.filesArr),
    lockerController.removeItemFromLocker
  );

module.exports = router;
