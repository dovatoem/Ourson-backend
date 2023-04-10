const mongoose = require('mongoose');

const dietSchema = mongoose.Schema({
    dietName : String,
    dietType: String,
   });

const Diet = mongoose.model('diets', dietSchema);

module.exports = Diet;
