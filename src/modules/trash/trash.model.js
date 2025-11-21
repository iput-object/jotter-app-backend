const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../libs/plugins");

const trashSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
    },

    file: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "File",
    },

    type: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },
  },
  { timestamps: true }
);

trashSchema.plugin(toJSON);
trashSchema.plugin(paginate);

trashSchema.index({ userId: 1, file: 1 }, { unique: true, sparse: true });
trashSchema.index({ userId: 1, folder: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model("Trash", trashSchema);
