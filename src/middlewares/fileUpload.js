const multer = require("multer");
const path = require("path");
const ApiError = require("../utils/ApiError");
const httpStatus = require("http-status");
const { generateFileName } = require("../utils/name");
const { createFolder } = require("../utils/fs");

module.exports = () => {
  return (req, res, next) => {
    const remainingQuota = req.user.storage.total - req.user.storage.used;

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const rootPath = path.join(__dirname, "..", "..", "drive");
        const uploadPath = path.join(rootPath, req.user.id);

        try {
          createFolder(uploadPath);
        } catch (err) {
          return cb(
            new ApiError(
              httpStatus.INTERNAL_SERVER_ERROR,
              "Directory creation failed"
            )
          );
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        const finalName = generateFileName(file.originalname);
        cb(null, finalName);
      },
    });

    const upload = multer({
      storage,
      limits: { fileSize: remainingQuota },
    });

    upload.any()(req, res, (err) => {
      if (err) return next(err);
      next();
    });
  };
};
