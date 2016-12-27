var mongoose = require('mongoose');

var pricePointSchema = mongoose.Schema({
    value : String,
    label : String
});

module.exports = mongoose.model('PricePoint', pricePointSchema);
