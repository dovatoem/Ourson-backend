const mongoose = require("mongoose");

const kidsSchema = mongoose.Schema({
  kidName: String,
  ageMonths: Number,
});

const householdSchema = mongoose.Schema({
  hhSize: Number,
  kidsCount: Number,
  kids: [kidsSchema],
  diet: { type: mongoose.Schema.Types.ObjectId, ref: "diets" },
  weeklyRecipes: [
    {
      baby: { type: mongoose.Schema.Types.ObjectId, ref: "babyrecipes" },
      adult: { type: mongoose.Schema.Types.ObjectId, ref: "adultrecipes" },
    },
  ],
  likedRecipes: [
    {
      baby: { type: mongoose.Schema.Types.ObjectId, ref: "babyrecipes" },
      adult: { type: mongoose.Schema.Types.ObjectId, ref: "adultrecipes" },
    },
  ],
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  createdAt: Date,
  Tastedfoods: [{ type: mongoose.Schema.Types.ObjectId, ref: "tastedfoods" }],
});

const Household = mongoose.model("households", householdSchema);

module.exports = Household;
