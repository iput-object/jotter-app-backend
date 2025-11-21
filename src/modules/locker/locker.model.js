const mongoose = require("mongoose");
const { toJSON, paginate } = require("../../libs/plugins");

const lockerSchema = new mongoose.Schema(
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

    lastUnlockAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

lockerSchema.plugin(toJSON);
lockerSchema.plugin(paginate);

lockerSchema.index({ userId: 1, file: 1 }, { unique: true, sparse: true });
lockerSchema.index({ userId: 1, folder: 1 }, { unique: true, sparse: true });


module.exports = mongoose.model("Locker", lockerSchema);
