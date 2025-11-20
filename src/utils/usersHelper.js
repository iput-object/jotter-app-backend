const mongoose = require("mongoose");

// Assuming you have a 'User' schema defined
const { userModel } = require("../modules/user"); // Import your User model

var user = {};

user.setUserOnline = function (id, callback) {
  userModel.findByIdAndUpdate(
    id,
    { status: "online" },
    { new: true },
    function (err, user) {
      if (err) {
        console.error(err);
        callback(null, err);
      } else {
        callback(user);
      }
    }
  );
};

user.setUserOffline = function (id, callback) {
  userModel.findByIdAndUpdate(
    id,
    { status: "offline" },
    { new: true },
    function (err, user) {
      if (err) {
        console.error(err);
        callback(null, err);
      } else {
        callback(user);
      }
    }
  );
};

module.exports = user;
