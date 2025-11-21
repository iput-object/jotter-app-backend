const httpStatus = require("http-status");
const ApiError = require("../../utils/ApiError");
const { userService, userModel } = require("../user");
const { fileService, fileModel } = require("../file");
const { folderService, folderModel } = require("../folder");
const lockerModel = require("./locker.model");

const createTrashDirectory = async (userId) => {
  const folder = folderModel.create({
    name: "Vault",
    userId,
  });
  return folder;
};

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

// File operations can be added here

const addItemToLocker = async (userId, items) => {
  const result = await Promise.all(
    items.map(async (item) => {
      const { id, type } = item;
      let model;
      if (type === "file") {
        model = await fileService.getFileById(userId, id);
      } else {
        model = await folderService.getFolderById(userId, id);
      }
      if (!model) return { id, status: `${type} not found` };
      model.isLocked = true;
      await lockerModel.create({
        userId,
        type,
        [type]: id,
      });
      await model.save();
      return { id, status: "Locked Successfully" };
    })
  );
  return result;
};

const removeFromLocker = async (userId, items) => {
  const result = await Promise.all(
    items.map(async (item) => {
      const lockItem = await lockerModel.findOne({
        userId,
        _id: item,
      });
      if (!lockItem) return { id: item, status: "Locker item not found" };
      if (lockItem.type === "file") {
        await fileModel.findByIdAndUpdate(lockItem.file, {
          isLocked: false,
        });
      } else {
        await folderModel.findByIdAndUpdate(lockItem.folder, {
          isLocked: false,
        });
      }
      await lockerModel.deleteOne({ userId, _id: item });
      return { id: item, status: "Unlocked Successfully" };
    })
  );
  return result;
};

const deleteFilesPermanently = async (userId, items) => {
  const result = await Promise.all(
    items.map(async (item) => {
      const lockItem = await lockerModel.findOne({
        userId,
        _id: item,
      });
      if (!lockItem) return { id: item, status: "Locker item not found" };
      if (lockItem.type === "file") {
        const file = await fileModel.findOne({
          userId,
          _id: lockItem.file,
          isLocked: true,
        });
        if (!file) {
          return { id: item, status: "File not found" };
        }
        await fileService.hardDeleteFile(file);
      } else {
        await folderService.hardDeleteTree(lockItem.folder, {
          userId,
          isTrashed: false,
        });
      }

      return {
        id: item,
        status: "Deleted Successfully",
      };
    })
  );
  return result;
};

const getLockedContents = async (userId, parentId, options) => {
  const query = {
    userId,
  };

  if (parentId) {
    query.parent = parentId;
  }
  options.populate = "file,folder";
  return await lockerModel.paginate(query, options);
};

module.exports = {
  setupLocker,
  loginLocker,
  getLockerDetails,
  modifyLocker,
  resetLockerPassword,
  // File operations
  addItemToLocker,
  removeFromLocker,
  deleteFilesPermanently,
  getLockedContents,
};
