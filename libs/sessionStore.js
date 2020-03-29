var mongoose = require('mongoose');
var config = require('../config');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var sessionStore = new MongoStore({mongoose_connection: mongoose.connection,url :config.get('mongoose:url') });

module.exports = sessionStore;