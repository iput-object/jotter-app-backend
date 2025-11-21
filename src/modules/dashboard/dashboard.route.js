const express = require("express");
const auth = require("../../middlewares/auth");
const validate = require("../../middlewares/validate");
const dashboardController = require("./dashboard.controller");
const dashboardValidation = require("./dashboard.validation");

const router = express.Router();

router.get("/homepage", auth("user"), dashboardController.getHomepage);
router.get("/types/all", auth("user"), dashboardController.getAllFileTypes);
router.get("/types/:type", auth("user"), dashboardController.getItemsByTypes);
router.get(
  "/recent/items",
  auth("user"),
  validate(dashboardValidation.getRecent),
  dashboardController.getRecentItems
);
router.get(
  "/files/by-category",
  auth("user"),
  dashboardController.getFilesByCategory
);
router.get(
  "/files/category/:category",
  auth("user"),
  validate(dashboardValidation.getByCategory),
  dashboardController.getFilesBySpecificCategory
);
router.get("/storage", auth("user"), dashboardController.getStorageStats);
router.get("/stats", auth("user"), dashboardController.getDetailedStats);
module.exports = router;
