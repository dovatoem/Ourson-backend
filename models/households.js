const mongoose = require('mongoose');

const householdSchema = mongoose.Schema({
  hhSize: Number,
  kidsCount: Number,
  kids: [kidsSchema],
  diet: [{ type: mongoose.Schema.Types.ObjectId, ref: 'diets' }],
  weeklyRecipes: [{ baby: { type: mongoose.Schema.Types.ObjectId, ref: 'babyRecipes' }, adult: { type: mongoose.Schema.Types.ObjectId, ref: 'adultRecipes' }}],
  likedRecipes:  [{ baby: { type: mongoose.Schema.Types.ObjectId, ref: 'babyRecipes' }, adult: { type: mongoose.Schema.Types.ObjectId, ref: 'adultRecipes' }}], 
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users' }], 
  Date: Date, 
  tastedFoods: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tastedFoods' }]
});

const Household = mongoose.model('households', householdSchema);

module.exports = Household;