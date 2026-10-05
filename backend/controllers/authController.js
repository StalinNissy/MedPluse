const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "medpulse_default_jwt_secret_key_2026";

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please provide all required fields: name, email, and password."
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists) {
      return res.status(400).json({
        message: "An account with this email address already exists."
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hash
    });

    res.status(201).json({
      message: "Registration successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({
      message: "Server error during registration: " + (error.message || "Unknown error")
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter both email and password."
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      return res.status(400).json({
        message: "Invalid Credentials. User does not exist."
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({
        message: "Invalid Credentials. Incorrect password."
      });
    }

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login: " + (error.message || "Unknown error")
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please enter your registered email address."
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        message: "No account found registered with this email address."
      });
    }

    // Generate 6-digit verification code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.resetPasswordToken = resetCode;
    user.resetPasswordExpires = expires;
    await user.save();

    console.log(`[AUTH] Reset code generated for ${cleanEmail}: ${resetCode}`);

    res.json({
      message: "Reset code generated! Please enter the 6-digit verification code to set a new password.",
      resetCode: resetCode,
      email: cleanEmail
    });
  } catch (error) {
    console.error("Forgot Password error:", error);
    res.status(500).json({
      message: "Server error during password reset request: " + (error.message || "Unknown error")
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({
        message: "Please provide your email address and new password."
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters long."
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    if (resetCode && user.resetPasswordToken) {
      if (user.resetPasswordToken !== resetCode) {
        return res.status(400).json({
          message: "Invalid verification code."
        });
      }
      if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
        return res.status(400).json({
          message: "Verification code has expired. Please request a new code."
        });
      }
    }

    const hash = await bcrypt.hash(newPassword, 10);
    user.password = hash;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({
      message: "Password reset successful! You can now log in with your new password."
    });
  } catch (error) {
    console.error("Reset Password error:", error);
    res.status(500).json({
      message: "Server error resetting password: " + (error.message || "Unknown error")
    });
  }
};