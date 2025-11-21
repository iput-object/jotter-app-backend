const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const config = require("./config");
const { tokenTypes } = require("./tokens");
const { userModel } = require("../modules/user");

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }
    const user = await userModel.findById(payload.sub);
    if (!user) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

// Google OAuth Strategy
const googleOptions = {
  clientID: config.google.clientId,
  clientSecret: config.google.clientSecret,
  callbackURL: config.google.callbackUrl,
};

const googleVerify = async (accessToken, refreshToken, profile, done) => {
  try {
    const { id: googleId, emails, displayName, photos } = profile;
    const email = emails[0].value;
    const avatar =
      photos && photos[0] ? photos[0].value : "/uploads/users/user.png";

    let user = await userModel.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = await userModel.create({
        name: displayName,
        email,
        avatar,
        googleId,
        isEmailVerified: true,
        role: "user",
        password: Math.random().toString(36).slice(-12),
      });
      isNewUser = true;
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (photos && photos[0] && !user.avatar.includes("uploads")) {
        user.avatar = avatar;
      }
      user.isEmailVerified = true;
      await user.save();
    }

    return done(null, { user, isNewUser });
  } catch (error) {
    return done(error, false);
  }
};

const googleStrategy = new GoogleStrategy(googleOptions, googleVerify);

module.exports = {
  jwtStrategy,
  googleStrategy,
};
