// app.js

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const db = require("./db");
// mongoose.connect('mongodb://localhost/userInfo', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  colorPreference: String,
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.json());
app.use(cookieParser());
// Set up CORS with options
const corsOptions = {
  origin: true,
  credentials: true, // Allow credentials (cookies)
  exposedHeaders: "*",
};
//   cors({credentials: true, origin: true, exposedHeaders: '*'})

app.use(cors(corsOptions));
// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// Secret key for JWT
const secretKey = "wycMIFSgXnYp47ERBdTpeIWOFGGrpdOZ";

// Middleware for JWT token verification
const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;
  console.log(req, "req");
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, secretKey, (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // If token is valid, store the decoded token in the request object
    req.user = decodedToken;
    next(); // Continue to the next middleware or route handler
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
    // Generate JWT token
    
    const token = jwt.sign({ username: user.username }, secretKey);
    // Set the JWT token in an HttpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: true, // Set to true for HTTPS
      sameSite: "none", // Adjust this based on your requirements
    });
    res.status(200).json({ message: "Sign-in successful", user,token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Logout route (clears the JWT cookie)
app.get("/logout", (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ message: "Logout successful" });
});

app.put("/preferences/:username", verifyToken, async (req, res) => {
  const username = req.params.username;
  const { colorPreference } = req.body;

  // Ensure the user making the request matches the requested username
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
