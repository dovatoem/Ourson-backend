const mongoose = require("mongoose");

const kidsSchema = mongoose.Schema({
  kidName: String,
  ageMonths: Number,
});

const shoppingListSchema = mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String,
  checked: Boolean,
});

const householdSchema = mongoose.Schema({
  hhSize: Number,
  kidsCount: Number,
  kids: [kidsSchema],
  diet: { type: mongoose.Schema.Types.ObjectId, ref: "diets" },
  weeklyRecipes: [
    {
      baby: { type: mongoose.Schema.Types.ObjectId, ref: "babyRecipes" },
      adult: { type: mongoose.Schema.Types.ObjectId, ref: "adultRecipes" },
    },
  ],
  likedRecipes: [
    {
      baby: { type: mongoose.Schema.Types.ObjectId, ref: "babyRecipes" },
      adult: { type: mongoose.Schema.Types.ObjectId, ref: "adultRecipes" },
    },
  ],
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  createdAt: Date,
  tastedFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: "tastedFoods" }],
  foodList: [{ type: mongoose.Schema.Types.ObjectId, ref: "tastedFoods" }],
  shoppingList: [shoppingListSchema],
});

const Household = mongoose.model("households", householdSchema);

module.exports = Household;
