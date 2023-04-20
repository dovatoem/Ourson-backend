var express = require("express");
var router = express.Router();
const Household = require("../models/households");
const TastedFood = require("../models/tastedFoods");
const User = require("../models/users");

router.get("/", (req, res) => {
  //recuperer l'id de l'user via le token
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user", user);
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    // avec cet id aller chercher l'household correspondant
    Household.findOne({ users: user._id })
      .populate("tastedFoods")
      .then((household) => {
        if (household) {
          res.json({
            result: true,
            recipes: household.tastedFoods,
          });
        } else {
          res.json({
            result: false,
            error: "Household not found",
          });
        }
      });
  });
});

router.get("/foodList", (req, res) => {
  TastedFood.find().then((tastedFood) => {
    if (tastedFood) {
      res.json({
        result: true,
        recipes: tastedFood,
      });
    } else {
      res.json({
        result: false,
        error: "TastedFood not found",
      });
    }
  });
});

router.put("/addTastedFood", (req, res) => {
  //recuperer l'id de l'user via le token
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user", user);
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    // Avec cet id aller chercher l'household correspondant
    Household.findOne({ users: user._id }).then((household) => {
      if (household) {
        Household.updateOne(
          { _id: household._id },
          { $push: { tastedFoods: req.body.tastedFoodID } }
        )
          .populate("tastedFoods")
          .then((data) => {
            if (data.modifiedCount > 0) {
              console.log("ok");
              Household.findOne({ _id: household._id })
                .populate("tastedFoods")
                .then((data) => {
                  res.json({
                    result: true,
                    recipes: data.tastedFoods,
                  });
                });
            } else {
              res.json({
                result: false,
                error: "Household not found",
              });
            }
          });
      }
    });
  });
});

router.put("/removeTastedFood", (req, res) => {
  //recuperer l'id de l'user via le token
  User.findOne({ token: req.body.token }).then((user) => {
    console.log("user", user);
    if (user === null) {
      res.json({ result: false, error: "User not found" });
      return;
    }
    // Avec cet id aller chercher l'household correspondant
    Household.findOne({ users: user._id }).then((household) => {
      if (household) {
        Household.updateOne(
          { _id: household._id },
          { $pull: { tastedFoods: req.body.tastedFoodID } }
        )
          .populate("tastedFoods")
          .then((data) => {
            if (data.modifiedCount > 0) {
              console.log("ok");
              Household.findOne({ _id: household._id })
                .populate("tastedFoods")
                .then((data) => {
                  res.json({
                    result: true,
                    recipes: data.tastedFoods,
                  });
                });
            } else {
              res.json({
                result: false,
                error: "Household not found",
              });
            }
          });
      }
    });
  });
});

module.exports = router;
