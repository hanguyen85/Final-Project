const jwt = require("jsonwebtoken");
const UserModel = require("../models/UserModel");

const verifyToken = async (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.redirect("/user/login");
  }
  try {
    const decodedToken = await jwt.verify(token, "han_04");
    console.log(decodedToken);
    next();
  } catch (err) {
    console.log("Token không hợp lệ: ", err);
    return res.status(401).send("Token không hợp lệ!").redirect("/login");
  }
};

const checkAdmin = async (req, res, next) => {
  const token = req.cookies.access_token;
  if (token) {
    try {
      const decodedToken = await jwt.verify(token, "han_04");
      console.log(decodedToken);
      const user = await UserModel.findById(decodedToken.id);
      if (user.role === "admin") {
        res.locals.user = user;
      } else {
        res.render("user/login");
      }
      next();
    } catch (err) {
      console.log(err.message);
      res.locals.user = null;
      next();
    }
  } else {
    res.locals.user = null;
    next();
  }
};

const checkUser = async (req, res, next) => {
  const token = req.cookies.access_token;
  if (token) {
    try {
      const decodedToken = await jwt.verify(token, "han_04");
      console.log(decodedToken);
      const user = await UserModel.findById(decodedToken.id);
      res.locals.user = user;
      req.user = user;
      next();
    } catch (err) {
      console.log(err.message);
      res.locals.user = null;
      next();
    }
  } else {
    res.locals.user = null;
    next();
  }
};

module.exports = { verifyToken, checkAdmin, checkUser };
