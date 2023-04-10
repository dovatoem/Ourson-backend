const mongoose = require('mongoose');

const dietSchema = mongoose.Schema({
    name : String,
    type: String,
   });

const Diet = mongoose.model('diets', dietSchema);

module.exports = Diet;
