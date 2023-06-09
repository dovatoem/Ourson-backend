var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Household = require("../models/households");
const Diet = require("../models/diets");
const { checkBody } = require("../modules/checkBody");
const bcrypt = require("bcrypt");
const uid2 = require("uid2");

// Save admin user in users collection
router.post("/signup", (req, res) => {
  if (!checkBody(req.body, ["firstName", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // Check if the user has not already been registered
  User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
    (data) => {
      if (data === null) {
        const hash = bcrypt.hashSync(req.body.password, 10);
        const newUser = new User({
          firstName: req.body.firstName,
          email: req.body.email,
          password: hash,
          token: uid2(32),
          type: "admin",
        });
        newUser.save().then((newDoc) => {
          res.json({
            result: true,
            token: newDoc.token,
            firstName: newDoc.firstName,
            email: newDoc.email,
            type: newDoc.type,
          });
        });
      } else {
        // User already exists in database
        res.json({ result: false, error: "User already exists" });
      }
    }
  );
});

// signin user and get household info
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // get user id
  User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
    (user) => {
      if (user === null) {
        res.json({ result: false, error: "User not found" });
        return;
      } else if (bcrypt.compareSync(req.body.password, user.password)) {
        // via user id get household info
        Household.findOne({ users: user._id })
          .populate("users")
          .populate("diet")
          .populate({
            path: "weeklyRecipes",
            populate: [{ path: "adult" }, { path: "baby" }],
          })
          .populate({
            path: "likedRecipes",
            populate: [{ path: "adult" }, { path: "baby" }],
          })
          .then((household) => {
            if (household) {
              res.json({ result: true, user, household });
            } else {
              res.json({ result: false, error: "household not found" });
            }
          });
      } else {
        res.json({ result: false, error: "Wrong password" });
      }
    }
  );
});

// create a household for an admin user
router.post("/profile", (req, res) => {
  if (!checkBody(req.body, ["hhSize", "kidsCount"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // find user in users collection to set foreign key relation
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user", user);
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }

    // check if the user already has a household
    Household.findOne({ users: user._id }).then((household) => {
      if (household) {
        res.json({ result: false, error: "Household already exists" });
        return;
      } else {
        const kids = [];
        for (let i = 1; i <= req.body.kidsCount; i++) {
          kids.push({
            kidName: req.body.kidsArray[0][`kidName${i}`],
            ageMonths: req.body.kidsArray[0][`ageMonths${i}`],
          });
        }

        // find diet in diets collection to set foreign key relation
        Diet.findOne({ dietName: req.body.dietName }).then((diet) => {
          console.log("diet", diet);
          if (diet === null) {
            const newHH = new Household({
              hhSize: req.body.hhSize,
              kidsCount: req.body.kidsCount,
              kids: kids,
              diet: null,
              users: user._id,
              createdAt: new Date(),
            });
            newHH.save().then((newDoc) => {
              res.json({ result: true, household: newDoc });
            });
          } else {
            const newHH = new Household({
              hhSize: req.body.hhSize,
              kidsCount: req.body.kidsCount,
              kids: kids,
              diet: diet._id,
              users: user._id,
              createdAt: new Date(),
            });
            newHH.save().then((newDoc) => {
              res.json({ result: true, household: newDoc });
            });
          }
        });
      }
    });
  });
});

// Save a guest user in users collection and in households collection
router.post("/signupGuest", (req, res) => {
  if (!checkBody(req.body, ["firstName", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  // Check if the guest has not already been registered
  User.findOne({ email: { $regex: new RegExp(req.body.email, "i") } }).then(
    (data) => {
      if (data === null) {
        const hash = bcrypt.hashSync(req.body.password, 10);
        const newUser = new User({
          firstName: req.body.firstName,
          email: req.body.email,
          password: hash,
          token: uid2(32),
          type: "guest",
        });
        newUser.save().then((guest) => {
          // Find in users collection the admin user for this guest user and get admin id
          User.findOne({ token: req.body.token }).then((admin) => {
            if (admin === null) {
              res.json({
                result: false,
                error: "Admin not found in users collection",
              });
              return;
            }
            // Thanks to admin id find in households collection the household created by admin user
            Household.findOne({ users: admin._id }).then((household) => {
              if (household === null) {
                res.json({
                  result: false,
                  error: "Admin not found in Household",
                });
                return;
              }
              if (household.users.includes(guest._id)) {
                res.json({
                  result: false,
                  error: "Guest already in household",
                });
                return;
              }
              console.log(household.users);
              household.users.push(guest._id);
              household.save();
              console.log(household.users);
              res.json({
                result: true,
                household: household,
              });
            });
          });
        });
      } else {
        // Guest already exists in database
        res.json({
          result: false,
          error: "Guest already exists in users collection",
        });
      }
    }
  );
});

module.exports = router;
