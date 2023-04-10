var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const Household = require('../models/households');
const Diet = require('../models/diets');
const { checkBody } = require('../modules/checkBody');
const bcrypt = require('bcrypt');
const uid2 = require('uid2');

router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['firstName', 'email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const newUser = new User({
        firstName: req.body.firstName,
        email: req.body.email,
        password: hash,
        token: uid2(32),
        type: 'admin',
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, token: newDoc.token, firstName: newDoc.firstName, email: newDoc.email, type: newDoc.type });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});

router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ email: req.body.email }).then(data => {
    if (bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token, firstName: data.firstName, email: data.email, type: data.type });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

module.exports = router;
