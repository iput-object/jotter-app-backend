const express = require("express");
const { authRoute } = require("../../auth");
const { userRoute } = require("../../user");
const { infoRoute } = require("../../info");
const { fileRoute } = require("../../file");
const { folderRoute } = require("../../folder");

const router = express.Router();

const defaultRoutes = [
  { path: "/auth", route: authRoute },
  { path: "/users", route: userRoute },
  { path: "/settings", route: infoRoute },
  { path: "/files", route: fileRoute },
  { path: "/folders", route: folderRoute },
];

defaultRoutes.forEach(({ path, route }) => router.use(path, route));

module.exports = router;
