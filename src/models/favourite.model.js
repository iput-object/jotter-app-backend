const mongoose = require("mongoose");
const { toJSON, paginate } = require("./plugins");


const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },

    resourceType: { type: String, enum: ["file", "folder"], required: true },

    markedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

favoriteSchema.plugin(toJSON);
favoriteSchema.plugin(paginate);

module.exports = mongoose.model("Favorite", favoriteSchema);
