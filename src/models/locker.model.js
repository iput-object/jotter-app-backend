const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");

const lockerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    folderId: { type: mongoose.Schema.Types.ObjectId, ref: "Folder" },

    pinHash: { type: String, required: true },

    securityQuestion: { type: String, required: true },

    securityAnswerHash: { type: String, required: true },

    unlockAttempts: { type: Number, default: 0 },

    lockedUntil: { type: Date, default: null },

    lastUnlockAt: { type: Date, default: null },
  },
  { timestamps: true }
);

lockerSchema.plugin(toJSON);
lockerSchema.plugin(paginate);

module.exports = mongoose.model("Locker", lockerSchema);
