const jwt = require("jsonwebtoken");
const brcypt = require("bcryptjs");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
// @desc Register new user
// @route GET /api/users
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please fill in all fields");
  }

  //check if user exists
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  //hash password
  const salt = await brcypt.genSalt(10);
  const hashedPassword = await brcypt.hash(password, salt);

  //Create user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  //   console.log(`User payload - ${user}`.red.underline);

  if (!user) {
    res.status(400);
    throw new Error("Invalid User data");
  }

  return res.status(201).json({
    _id: user.id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

// @desc Authenticate a user
// @route GET /api/users/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  //check for user email
  const user = await User.findOne({ email });

  if (user && (await brcypt.compare(password, user.password))) {
    return res.status(200).json({
      _id: user.id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error("Invalid credentials");
  }
});

// @desc Get user data
// @route GET /api/users/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
  const { _id, name, email } = await User.findById(req.user.id);

  res.status(200).json({ id: _id, name, email });

  res.json({ message: "User Data" });
});

//Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = { registerUser, loginUser, getMe };
