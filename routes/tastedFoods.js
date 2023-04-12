var express = require("express");
var router = express.Router();

const TastedFood = require("../models/tastedFoods");

router.get("/test", (req, res) => {
    TastedFood.find({}).then((food) => {
      res.json({ food });
          })})

module.exports = router;
