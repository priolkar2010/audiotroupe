var mongoose = require('mongoose');

var emailTemplateSchema = mongoose.Schema({
    template_id : String,
    user_email : String
});

module.exports = mongoose.model('EmailTemplate', emailTemplateSchema);
