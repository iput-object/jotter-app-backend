const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },

    name: { type: String, required: true },

    originalName: { type: String, required: true },

    path: { type: String, required: true },

    fileType: { type: String, required: true },

    size: { type: Number, required: true },

    isArchived: { type: Boolean, default: false },

    isLocked: { type: Boolean, default: false },

    metadata: { type: Object, default: {} },

    lastAccessedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

fileSchema.plugin(toJSON);
fileSchema.plugin(paginate);

module.exports = mongoose.model("File", fileSchema);
