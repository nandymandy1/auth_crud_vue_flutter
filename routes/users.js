const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");
const router = require("express").Router();
const { appSecret } = require("../config/constants");

/**
 * @DESC To Register a New User
 * @ACCESS Public
 * @TYPE POST
 * @BODY { firstName*, lastName*, email*, password*, username* }
 * @ROUTE /api/users/register
 */
router.post("/register", async (req, res) => {
  try {
    let { username, email } = req.body;

    // Validation for the username
    let userByUsername = await User.findOne({ username });
    if (userByUsername) {
      return res
        .status(400)
        .json({ msg: "Username is already taken.", success: false });
    }

    // Validation for the email
    let userByEmail = await User.findOne({ email });
    if (userByEmail) {
      return res.status(400).json({
        msg: "Email is already registered. Did you forget password.",
        success: false
      });
    }

    let newUser = new User({
      ...req.body
    });

    const hashedPassword = await bcrypt.hash(newUser.password, 12);
    newUser.password = hashedPassword;
    await newUser.save();
    return res
      .status(201)
      .json({ msg: "Registration Successful", success: true });
  } catch (err) {
    return res.status(408).json({
      msg: "Unable to register the user please try again.",
      success: false
    });
  }
});

/**
 * @DESC To Authenticate User
 * @ACCESS Public
 * @TYPE POST
 * @BODY { password*, username* }
 * @ROUTE /api/users/login
 */
router.post("/login", async (req, res) => {
  try {
    let { username, password } = req.body;
    let user = await User.findOne({ username });
    // Check if the username is registred in database
    if (!user) {
      return res
        .status(404)
        .json({ msg: "Username not found.", success: false });
    }

    // Match the password
    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(406).json({ msg: "Invalid password.", success: false });
    }
    let token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        username: user.username
      },
      appSecret,
      { expiresIn: "4h" }
    );

    return res.status(202).json({
      success: true,
      user_id: user._id,
      tokenExpiration: 4,
      token: `Bearer ${token}`,
      msg: "Hurry! You are logged in."
    });
  } catch (err) {
    return res
      .status(408)
      .json({ msg: "Unable to login. Please try again.", success: false });
  }
});

/**
 * @DESC To Get Authenticated User's Profile
 * @ACCESS Private
 * @TYPE GET
 * @ROUTE /api/users/auth-profile
 */
router.get(
  "/auth-profile",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    let user = optimizeUserObject(req.user);
    return res.json(user);
  }
);

/**
 * @DESC To Get User by Username
 * @ACCESS Public
 * @TYPE GET
 * @QUERY { username* }
 * @ROUTE /api/users?username=
 */

/**
 * @DESC To Get Users
 * @ACCESS Public
 * @TYPE GET
 * @ROUTE /api/users
 */
router.get("/", async (req, res) => {
  let users = await User.find();
  let revampedUsers = users.map(user => {
    return optimizeUserObject(user);
  });
  return res.json(revampedUsers);
});

const optimizeUserObject = user => {
  return {
    username: user.username,
    email: user.email,
    _id: user._id,
    name: `${user.firstName} ${user.lastName}`
  };
};

module.exports = router;
