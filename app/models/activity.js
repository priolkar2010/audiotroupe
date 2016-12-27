var mongoose = require('mongoose');

var activityTypeSchema = mongoose.Schema({
  value: String,
  label: String
});

module.exports = mongoose.model('ActivityTypes', activityTypeSchema);
