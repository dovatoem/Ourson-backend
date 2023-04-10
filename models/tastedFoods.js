const mongoose = require('mongoose');

const tastedFoodSchema = mongoose.Schema({
    name : String,
    type: String,
   });

const TastedFood = mongoose.model('tastedFoods', tastedFoodSchema);

module.exports = TastedFood;
