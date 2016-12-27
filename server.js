var express = require('express');
var path = require('path');
var app = express();
var port = process.env.PORT || 9443;
var mongoose = require('mongoose');
var passport = require('passport');
var flash = require('connect-flash');
var https  = require('https');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var fs  = require('fs');
var configDB = require('./config/database.js');
var privateKey   = fs.readFileSync('certs/audiotroupe.key', 'utf8');
var certificate  = fs.readFileSync('certs/audiotroupe.crt', 'utf8');
var credentials  = {key: privateKey, cert: certificate};

app.use('/public', express.static(path.join(__dirname, '/public')));
app.use("/upload", express.static(__dirname + '/upload'));
app.use("/bower_components", express.static(__dirname + '/bower_components'));

mongoose.connect(configDB.url);

require('./config/passport')(passport);

app.use(morgan('dev'));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.set('view engine', 'ejs');

app.use(session({
  secret: 'ilovemusicanddance'
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

var server = https.createServer(credentials, app);

server.listen(port, function(){
  console.log("https server started on port: %s ", port);
});

require('./app/routes.js')(app, passport);

