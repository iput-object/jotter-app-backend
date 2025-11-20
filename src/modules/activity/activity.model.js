const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "upload",
        "download",
        "delete",
        "share",
        "restore",
        "move",
        "rename",
      ],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    resourceType: {
      type: String,
      enum: ["file", "folder"],
      required: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

activityLogSchema.plugin(toJSON);
activityLogSchema.plugin(paginate);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
