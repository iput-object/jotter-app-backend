const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { toJSON, paginate } = require("../../libs/plugins");
const { roles } = require("../../config/roles");

const lockerSchema = mongoose.Schema(
  {
    securityQuestion: {
      type: String,
      default: null,
    },
    securityAnswer: {
      type: String,
      default: null,

      trim: true,
    },
    pin: {
      type: String,
      default: null,

      trim: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
      trim: true,
      default: null,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid email");
        }
      },
    },
    avatar: {
      type: String,
      required: [true, "Image is must be Required"],
      default: "/uploads/users/user.png",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: false,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error(
            "Password must contain at least one letter and one number"
          );
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
    },
    oneTimeCode: {
      type: String,
      required: false,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isResetPassword: {
      type: Boolean,
      default: false,
    },
    fcmToken: {
      // onlly use for firebase push notification / mobile focus*
      type: String,
      required: false,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    locker: {
      type: lockerSchema,
      default: () => ({}),
    },
    storage: {
      total: {
        type: Number,
        default: 1024 * 1024 * 1024 * 16,
      },
      used: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};
userSchema.statics.isPhoneNumberTaken = async function (
  phoneNumber,
  excludeUserId
) {
  const user = await this.findOne({ phoneNumber, _id: { $ne: excludeUserId } });
  return !!user;
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
};

userSchema.methods.isLockerPinMatch = async function (pin) {
  return bcrypt.compare(pin, this.locker.pin);
};

userSchema.methods.isLockerAnswerMatch = async function (answer) {
  return bcrypt.compare(answer, this.locker.securityAnswer);
};

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  if (user.isModified("locker.securityAnswer") && user.locker.securityAnswer) {
    user.locker.securityAnswer = await bcrypt.hash(
      user.locker.securityAnswer,
      8
    );
  }

  if (user.isModified("locker.pin") && user.locker.pin) {
    user.locker.pin = await bcrypt.hash(user.locker.pin, 8);
  }

  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
