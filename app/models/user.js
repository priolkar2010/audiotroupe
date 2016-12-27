var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

var Order = mongoose.Schema({
  status: String,
  models: [String],
  date: Date,
  orderId: String,
  recommendationId: String,
  trackingNumber: String
});

var Recommendation = mongoose.Schema({
  models: [String],
  status: String,
  date: Date

});

var ShippingAddress = {
  address1: String,
  address2: String,
  city: String,
  state: String,
  zipcode: String
};

var BillingAddress = {
  address1: String,
  address2: String,
  city: String,
  state: String,
  zipcode: String
};


// define the schema for our user model
var userSchema = mongoose.Schema({
  email: String,
  password: String,
  fb_id: String,
  fb_token: String,
  fb_email: String,
  name: String,
  timezone: String,
  activity_value: [String],
  price_point_value: [String],
  contact_best_time: String,
  age_range: String,
  locale: String,
  headset_style_value: [String],
  visitCount: Number,
  music_value: [String],
  profileUpdated: String,
  phone_number: String,
  status: String,
  recommendation: [Recommendation],
  account_created: Date,
  order: [Order],
  shippingAddress: ShippingAddress,
  billingAddress: BillingAddress,
  credit_card_token: String,
  customer_token: String

});

userSchema.methods.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.generateTokenHash = function(token) {
  return bcrypt.hashSync(token, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
