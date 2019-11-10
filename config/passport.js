const User = require("../models/User");
const { appSecret } = require("./constants");
const { Strategy, ExtractJwt } = require("passport-jwt");

module.exports = passport => {
  const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: appSecret
  };
  passport.use(
    new Strategy(opts, async (payload, done) => {
      await User.findById(payload._id)
        .then(user => {
          return user ? done(null, user) : done(null, false);
        })
        .catch(err => console.log(err));
    })
  );
};
