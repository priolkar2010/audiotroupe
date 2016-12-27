var mongoose = require('mongoose');

var musicTypeSchema = mongoose.Schema({
  value: String,
  label: String
});

module.exports = mongoose.model('MusicType', musicTypeSchema);
