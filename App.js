// app.js

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require('dotenv').config()
const cors = require("cors");
const app = express();
const db = require("./db");



const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  colorPreference: String,
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.json());
app.use(cookieParser());
const corsOptions = {
  origin: true,
  credentials: true,
  exposedHeaders: "*",
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

const secretKey = "wycMIFSgXnYp47ERBdTpeIWOFGGrpdOZ";


const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  jwt.verify(token.replace("Bearer ", ""), secretKey, (err, decodedToken) => {
    console.log(err,'err')
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = decodedToken;
    next();
  });
};

// Routes

// Sign-up route
app.post("/signup", async (req, res) => {
  const { username, password, colorPreference } = req.body;
  try {
    const user = new User({ username, password, colorPreference });
    await user.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Sign-in route
app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username, password });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign({ username: user.username }, secretKey, {
      expiresIn: '1h',
    });
    
    const bearerToken = `Bearer ${token}`; 
    res.cookie("jwt", bearerToken, {
      httpOnly: true,
      secure: true, 
      sameSite: "none", 
      maxAge: 3600000,
    });
    res.status(200).json({ message: "Sign-in successful", user,bearerToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/check-auth", verifyToken, async(req, res) => {
  const { username } = req.user;
  const user = await User.findOne({ username });
  const { colorPreference } = user;
  res.status(200).json({ message: "Authenticated",username,colorPreference });
});

app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logout successful" });
});

app.put("/preferences/:username", verifyToken, async (req, res) => {
  const username = req.params.username;
  const { colorPreference } = req.body;

  if (username !== req.user.username) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const user = await User.findOneAndUpdate(
      { username },
      { colorPreference },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Color preference updated successfully", user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
