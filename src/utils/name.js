const path = require("path");

const generateFileName = (originalName) => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1e9);
  const uniqueSuffix = `${timestamp}-${random}`;
  const nameWithoutExt = path.parse(originalName).name.replace(/\s+/g, "_");
  const ext = path.extname(originalName);
  return `${nameWithoutExt}-${uniqueSuffix}${ext}`;
};

module.exports = {
  generateFileName,
};
