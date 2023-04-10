const mongoose = require('mongoose');

const ingredientsSchema = mongoose.Schema({
	name: String, 
    quantity: Number, 
    unit: String
});

const adultRecipeSchema = mongoose.Schema({
    page_URL : String,
    title: String,
    imageURL : String,
    totalTime: Number,
    portion : Number,
    ingredients : [ingredientsSchema],
    instructions: String,
    diets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'diets' }]
});

const AdultRecipe = mongoose.model('adultRecipes', adultRecipeSchema);

module.exports = AdultRecipe;
