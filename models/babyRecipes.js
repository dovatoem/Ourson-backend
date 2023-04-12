const mongoose = require("mongoose");

const ingredientsSchema = mongoose.Schema({
  name: String,
  quantity: Number,
  unit: String,
});

const babyRecipeSchema = mongoose.Schema({
  page_URL: String,
  title: String,
  usage: String,
  ageMonths: Number,
  imageURL: String,
  totalTime: Number,
  portion: Number,
  ingredients: [ingredientsSchema],
  instructions: String,
  diets: [{ type: mongoose.Schema.Types.ObjectId, ref: "diets" }],
});

const BabyRecipe = mongoose.model("babyRecipes", babyRecipeSchema);

module.exports = BabyRecipe;
