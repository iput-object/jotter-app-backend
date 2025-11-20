const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { sendEmailVerification } = require("../../config/email");
const unlinkImages = require("../../common/unlinkImage");
const userModel = require("./user.model");

const createUser = async (userBody) => {
  if (await userModel.isEmailTaken(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }
  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  if (userBody.role === "user" || userBody.role === "admin") {
    sendEmailVerification(userBody.email, oneTimeCode);
  }
  return userModel.create({ ...userBody, oneTimeCode });
};

const queryUsers = async (filter, options) => {
  const query = {};

  // Loop through each filter field and add conditions if they exist
  for (const key of Object.keys(filter)) {
    if (
      (key === "name" || key === "email" || key === "username") &&
      filter[key] !== ""
    ) {
      query[key] = { $regex: filter[key], $options: "i" }; // Case-insensitive regex search for name
    } else if (filter[key] !== "") {
      query[key] = filter[key];
    }
  }

  const users = await userModel.paginate(query, options);

  // Convert height and age to feet/inches here...

  return users;
};

const getUserById = async (id) => {
  return userModel.findById(id);
};

const getUserByEmail = async (email) => {
  return userModel.findOne({ email });
};

const updateUserById = async (userId, updateBody, files) => {
  const user = await getUserById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (
    updateBody.email &&
    (await userModel.isEmailTaken(updateBody.email, userId))
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already taken");
  }

  if (files && files.length > 0) {
    updateBody.photo = files;
  } else {
    delete updateBody.photo; // remove the photo property from the updateBody if no new photo is provided
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

const deleteUserById = async (userId) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }
  await user.remove();
  return user;
};

const isUpdateUser = async (userId, updateBody) => {
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const oneTimeCode =
    Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;

  if (updateBody.role === "user" || updateBody.role === "admin") {
    sendEmailVerification(updateBody.email, oneTimeCode);
  }

  Object.assign(user, updateBody, {
    isDeleted: false,
    isSuspended: false,
    isEmailVerified: false,
    isResetPassword: false,
    isPhoneNumberVerified: false,
    oneTimeCode: oneTimeCode,
  });
  await user.save();
  return user;
};

const syncStorage = async (userId, size) => {
  await userModel.findByIdAndUpdate(userId, { $inc: { "storage.used": size } });
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  isUpdateUser,
  syncStorage,
};
