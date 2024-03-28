var express = require("express");
var nodemailer = require("nodemailer");
var mailGen = require("mailgen");
var roomModel = require("../models/RoomModel");
var roomTypeModel = require("../models/RoomTypeModel");
var reservationModel = require("../models/ReservationModel");
var userModel = require("../models/UserModel");
var dateFormat = require("handlebars-dateformat");
var { checkUser } = require("../middlewares/authMiddleware");
var handlebars = require("hbs");
var router = express.Router();

handlebars.registerHelper("dateFormat", dateFormat);

const mailGenerator = new mailGen({
  theme: "default",
  product: {
    name: "Web TJ Hotel",
    link: "https://example.com",
    copyright: "Copyright © 2024 WEB TJ HOTEL",
  },
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: "ha29042002@gmail.com",
    pass: "qkgfmnzzbobcapky",
  },
});

router.get("/confirmation", async (req, res) => {
  res.render("reservation/confirmation");
});

router.get("/confirmation/:id", checkUser, async (req, res) => {
  try {
    var user = req.user;
    if (!user) {
      res.redirect("/user/login");
    } else {
      var roomId = req.params.id;
      var room = await roomModel.findById(roomId).populate("roomType");
      var roomType = await roomTypeModel.find({});
      res.render("reservation/confirmation", { room, roomType });
    }
  } catch (err) {
    console.log(err);
  }
});

//Lỗi thông báo (có thể sửa lại thành pop up là thông báo lỗi rồi ấn pay là thành công)
router.post("/confirmation/:id", checkUser, async (req, res) => {
  try {
    var roomId = req.body.roomId;
    var checkIn = new Date(req.body.checkIn);
    var checkOut = new Date(req.body.checkOut);
    var user = req.user;
    var room = await roomModel.findById(roomId);
    var userId = await userModel.findById(user);
    var today = new Date();
    var total = totalPrice(room.price, checkIn, checkOut);
    console.log("Room: " + roomId);
    console.log("User: " + user);
    if (room.status === "unavailable") {
      throw new Error("Room is in use");
    } else if (checkIn.getDate() === checkOut.getDate()) {
      throw new Error("Same-day reservations are not possible");
    } else if (checkIn.getDate < today) {
      throw new Error("Can't reserve past dates");
    } else {
      var newReservation = {
        roomNumber: roomId,
        user: userId,
        checkIn: checkIn,
        checkOut: checkOut,
        status: "pending",
        totalPrice: total,
      };
    }
    var a = await reservationModel.create(newReservation);
    console.log("Create success! " + a);
    var response = {
      body: {
        name: user.username,
        info: "Confirm the booking",
        table: {
          data: [
            {
              RoomNumber: room.roomNumber,
              CheckIn: checkIn.toLocaleDateString("vi-VN"),
              CheckOut: checkOut.toLocaleDateString("vi-VN"),
              Price: "$" + room.price,
              TotalPrice: "$" + total,
            },
          ],
          columns: {
            // Optionally, customize the column widths
            customWidth: {
              item: "20%",
              Price: "15%",
            },
            // Optionally, change column text alignment
            customAlignment: {
              Price: "right",
            },
          },
        },
        action: {
          instructions: "Your booking has now been confirmed!",
          button: {
            color: "#22BC66", // Optional action button color
            text: "View the booking",
            link: "https://mailgen.js/confirm?s=d9729feb74992cc3482b350163a1a010",
          },
        },
        outro:
          "Need help, or have questions? Just reply to this email, we'd love to help.",
      },
    };
    const mail = mailGenerator.generate(response);
    const mailOptions = {
      from: {
        name: "Web TJ Hotel",
        address: "<ha29042002@gmail.com>",
      }, // sender address
      to: user.email, // user's email
      subject: "Confirm the booking", // Subject line
      html: mail, // html body
    };
    var b = await transporter.sendMail(mailOptions);
    console.log("Email has been send!" + b);
    res.redirect("/reservation/history");
  } catch (err) {
    console.log("Error: " + err);
    res.render("reservation/confirmation", { error: err.message });
  }
});

function totalPrice(price, checkIn, checkOut) {
  var oneDay = 24 * 60 * 60 * 1000;
  let diffDays;
  if (checkIn < checkOut) {
    diffDays = Math.round(Math.abs((checkIn - checkOut) / oneDay));
  } else {
    diffDays = Math.round(Math.abs((checkOut - checkIn) / oneDay));
  }
  var total = price * diffDays;
  return total;
}

router.get("/history", checkUser, async (req, res) => {
  try {
    var user = req.user;
    if (!user) {
      res.redirect("/user/login");
    } else {
      var reservation = await reservationModel.find({ user: user }).populate({
        path: "roomNumber",
        model: "room",
        populate: {
          path: "roomType",
          model: "roomType",
        },
      });
    }
  } catch (err) {
    console.log(err);
  }
  res.render("reservation/history", { reservation });
});

module.exports = router;
