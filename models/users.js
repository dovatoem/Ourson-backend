const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  firstName: String,
  email: String,
  password: String,
  token: String, 
  type: String
});

const User = mongoose.model('users', userSchema);

module.exports = User;
