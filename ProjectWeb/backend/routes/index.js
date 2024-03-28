var express = require("express");
var nodemailer = require("nodemailer");
var roomTypeModel = require("../models/RoomTypeModel");
var roomModel = require("../models/RoomModel");
var userModel = require("../models/UserModel");
var reservationModel = require("../models/ReservationModel");
var { checkUser } = require("../middlewares/authMiddleware");
var router = express.Router();

// Hiển thị toàn bộ room type
router.get("/", async (req, res, next) => {
  var romType = await roomTypeModel.find({});
  res.render("index", { title: "Express", romType });
});

// Gửi email
router.get("/contact", function (req, res, next) {
  res.render("contact");
});

// Hiển thị toàn bộ room
router.get("/room", async (req, res) => {
  try {
    const query = {};
    if (req.query.roomTypeFilter) {
      query.roomType = req.query.roomTypeFilter;
    }
    const room = await roomModel.find(query).populate("roomType");
    const roomType = await roomTypeModel.find({});
    res.render("room", { room, roomType });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// router.post("/room/:id", checkUser, async (req, res) => {
//   try {
//     var roomId = req.body.roomId;
//     var checkIn = new Date(req.body.checkIn);
//     var checkOut = new Date(req.body.checkOut);
//     var user = req.user;
//     var room = await roomModel.findById(roomId);
//     var userId = await userModel.findById(user);
//     var today = new Date();
//     var total = totalPrice(room.price, checkIn, checkOut);
//     console.log("Room: " + roomId);
//     console.log("User: " + user);
//     if (room.status === "unavailable") {
//       throw new Error("Room is in use");
//     } else if (checkIn.getDate() === checkOut.getDate()) {
//       throw new Error("Same-day reservations are not possible");
//     } else if (checkIn.getDate < today) {
//       throw new Error("Can't reserve past dates");
//     } else {
//       var newReservation = {
//         roomNumber: roomId,
//         user: userId,
//         checkIn: checkIn,
//         checkOut: checkOut,
//         status: "pending",
//         totalPrice: total,
//       };
//     }
//     var a = await reservationModel.create(newReservation);
//     console.log("Create success! " + a);
//     res.redirect("/reservation/history");
//   } catch (err) {
//     console.log("Error: " + err);
//     return res.render("room", { error: err.message });
//   }
// });

// function totalPrice(price, checkIn, checkOut) {
//   var oneDay = 24 * 60 * 60 * 1000;
//   let diffDays;
//   if (checkIn < checkOut) {
//     diffDays = Math.round(Math.abs((checkIn - checkOut) / oneDay));
//   } else {
//     diffDays = Math.round(Math.abs((checkOut - checkIn) / oneDay));
//   }
//   var total = price * diffDays;
//   return total;
// }

module.exports = router;
