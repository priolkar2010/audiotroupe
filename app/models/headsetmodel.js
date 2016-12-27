var mongoose = require('mongoose');

var headsetModelSchema = mongoose.Schema({
    model     		: String,
    make  	  		: String,
    unit_cost 		: String,
    msrp 	      	: String,
    imageName 	  : String,
    description 	: String
});

module.exports = mongoose.model('HeadsetModel', headsetModelSchema);
