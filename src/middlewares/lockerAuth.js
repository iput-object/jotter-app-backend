const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

module.exports = () => {
  return (req, res, next) => {
    const authHeader = req.headers["lockerauthorization"];
    if (!authHeader) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized")
      );
    }
    const user = req.user;
    let activity;
    let decodedData;
    if (authHeader) {
      jwt.verify(authHeader, config.jwt.secret, (err, decoded) => {
        if (err) {
          throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
        }
        decodedData = decoded;
      });
      activity = decodedData?.activity;
    }

    if (activity !== "locker" || (!user && user.id === decodedData.sub)) {
      return next(
        new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized")
      );
    }
    console.log("locker auth is working somehow");
    next();
  };
};
