require('dotenv').config();

var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var usersRouter = require('./routes/users');
var recipesRouter = require('./routes/recipes');
var tastedFoodsRouter = require('./routes/tastedFoods');

var app = express();

const cors = require('cors');
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/recipes', recipesRouter);
app.use('/tastedFoods', tastedFoodsRouter);

module.exports = app;
