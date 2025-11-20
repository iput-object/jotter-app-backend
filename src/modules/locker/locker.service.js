const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { userService, userModel } = require("../user");

const setupLocker = async (userId, userBody) => {
  const { pin, securityQuestion, securityAnswer } = userBody;
  const user = await userService.getUserById(userId);
  if (user.locker && user.locker.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Locker is already set up");
  }
  user.locker.pin = pin;
  user.locker.securityQuestion = securityQuestion;
  user.locker.securityAnswer = securityAnswer;
  user.locker.isActive = true;

  await user.save();
  return user;
};

const loginLocker = async (userId, pin) => {
  const user = await userService.getUserById(userId);
  if (!user.locker || !user.locker.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Locker is not set up");
  }

  if (user.locker.attempts >= 3) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Too many incorrect attempts. Locker is locked for 5 min."
    );
  }
  if (!(await user.isLockerPinMatch(pin))) {
    user.locker.attempts += 1;
    if (user.locker.attempts >= 3) {
      user.locker.lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes
    }
    await user.save();
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect PIN");
  }
  user.locker.attempts = 0; // Reset attempts on successful login
  user.locker.lockUntil = null;
  await user.save();
  return user._id;
};

const getLockerDetails = async (userId) => {
  // Include locker but exclude nested fields
  return await userModel.findById(userId).select({
    "locker.pin": 0,
    "locker.securityAnswer": 0,
  });
};

const modifyLocker = async (userId, lockerBody) => {
  const { pin, newPin, securityQuestion, securityAnswer } = lockerBody;
  const user = await userService.getUserById(userId);
  if (!(await user.isLockerPinMatch(pin))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect PIN");
  }
  if (newPin && pin !== newPin) user.locker.pin = newPin;
  if (securityQuestion) user.locker.securityQuestion = securityQuestion;
  if (securityAnswer) user.locker.securityAnswer = securityAnswer;

  await user.save();
  return {};
};

const resetLockerPassword = async (userId, securityAnswer, newPin) => {
  const user = await userService.getUserById(userId);
  if (!user.locker || !user.locker.isActive) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Locker is not set up");
  }

  if (user.locker.attempts >= 3) {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      "Too many incorrect attempts. Locker is locked for 5 min."
    );
  }

  if (!(await user.isLockerAnswerMatch(securityAnswer))) {
    user.locker.attempts += 1;
    if (user.locker.attempts >= 3) {
      user.locker.lockUntil = Date.now() + 5 * 60 * 1000; // Lock for 5 minutes
    }
    await user.save();
    throw new ApiError(httpStatus.UNAUTHORIZED, "Incorrect security answer");
  }
  user.locker.pin = newPin;
  user.locker.attempts = 0;
  user.locker.lockUntil = null;
  await user.save();
  return user;
};
module.exports = {
  setupLocker,
  loginLocker,
  getLockerDetails,
  modifyLocker,
  resetLockerPassword,
};
