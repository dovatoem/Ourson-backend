var express = require('express');
var router = express.Router();

require('../models/connection');
const AdultRecipe = require('../models/adultRecipes');
const BabyRecipe = require('../models/babyRecipes');

module.exports = router;
