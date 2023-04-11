const mongoose = require("mongoose");

const tastedFoodSchema = mongoose.Schema({
  name: String,
  type: String,
});

const TastedFood = mongoose.model("tastedfoods", tastedFoodSchema);

module.exports = TastedFood;
