var express = require("express");
var router = express.Router();
var userModel = require("../models/UserModel");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var validator = require("email-validator");
const { verifyToken, checkAdmin } = require("../middlewares/authMiddleware");

var salt = 10;
var timeOut = 1000 * 60 * 60 * 24;
const createToken = (id, username) => {
  return jwt.sign({ id, username }, "han_04");
};

router.get("/register", function (req, res) {
  res.render("user/register", { layout: "empty_layout" });
});

router.post("/register", async (req, res) => {
  try {
    var username = req.body.username;
    var email = req.body.email;
    var pass = req.body.password;
    var isValid = validator.validate(email);
    var hash = bcrypt.hashSync(pass, salt);
    if (!username) {
      throw new Error("Please enter username");
    } else if (!email) {
      throw new Error("Please enter email");
    } else if (!isValid) {
      throw new Error("Invalid email");
    } else if (!pass) {
      throw new Error("Please enter password");
    } else {
      var newUser = {
        username,
        email,
        password: hash,
        role: "user",
      };
      var user = await userModel.create(newUser);
      const token = createToken(user._id, user.username);
      //1. đặt tên cookie, 2. Giá trị lưu vào cookie
      res.cookie("access_token", token, {
        //Chỉ gắn cookie khi là http
        httpOnly: true,
        maxAge: timeOut,
      });
      res.redirect("/user/login");
    }
  } catch (err) {
    return res.render("user/register", {
      error: err.message,
    });
  }
});

router.get("/login", async (req, res) => {
  res.render("user/login", { layout: "empty_layout" });
});

router.post("/login", async (req, res) => {
  try {
    var userLogin = req.body;
    var user = await userModel.findOne({ email: userLogin.email });
    var hash = bcrypt.compareSync(userLogin.password, user.password);
    if (!user) {
      res.status(400).json({ error: "email not found!" });
    } else {
      if (hash) {
        const token = createToken(user._id, user.username);
        // //1. đặt tên cookie, 2. Giá trị lưu vào cookie
        res.cookie("access_token", token, {
          //Chỉ gắn cookie khi là http
          httpOnly: true,
          maxAge: timeOut,
        });
        res.redirect("/");
      } else {
        console.log("login failed! " + err);
      }
    }
  } catch (err) {
    res.status(500).send("Internal server error " + err);
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.redirect("/");
});

module.exports = router;
