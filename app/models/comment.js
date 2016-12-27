var mongoose = require('mongoose');

var commentModelSchema = mongoose.Schema({
  comment: String,
  subject: String,
  date: Date,
  user: String
});

module.exports = mongoose.model('Comment', commentModelSchema);
