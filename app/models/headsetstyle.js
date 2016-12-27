var mongoose = require('mongoose');

var headsetStyleSchema = mongoose.Schema({
  value: String,
  label: String
});

module.exports = mongoose.model('HeadsetStyle', headsetStyleSchema);
