const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const folderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: { type: String, required: true },

    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },

    path: { type: String, required: true },

    isArchived: { type: Boolean, default: false },

    color: { type: String, default: null },

    fileCount: { type: Number, default: 0 },

    folderCount: { type: Number, default: 0 },

    size: { type: Number, default: 0 },
  },
  { timestamps: true }
);

folderSchema.plugin(toJSON);
folderSchema.plugin(paginate);

module.exports = mongoose.model("Folder", folderSchema);
