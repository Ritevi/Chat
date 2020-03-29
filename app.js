var express = require('express');
var createError = require('http-errors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var config = require('./config');
var log = require('./libs/log')(module);
var HttpError = require('./error').HttpError;
var session = require('express-session');
var mongoose = require('mongoose');
var favicon = require('serve-favicon');
var errorhandler = require('errorhandler');
var bodyParser = require('body-parser');


var app = express();


app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap



app.use(cookieParser());

var sessionStore = require('./libs/sessionStore');

app.use(session({
    secret:config.get('session:secret'),
    key:config.get('session:key'),
    cookie: config.get('session:cookie'),
    store:sessionStore
}));// после куки парсера



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', require('ejs-locals'));
//app.set('views', __dirname + '/templates');
app.set('view engine', 'ejs');
if (app.get('env')=='development') {
  app.use(logger('dev'));
}
else {
  app.use(logger('combined'));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(bodyParser.urlencoded());
require('./routes/index')(app);





app.get('/favicon.ico', (req, res) => res.status(204));
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  if (typeof err == 'number') {
    err = HttpError(err);
  }
  if (err instanceof HttpError) {
    res.sendHttpError(err);
  } else {
    if (app.get('env') == 'development')
    {
      errorhandler()(err, req, res, next);
    } else {
      err = new HttpError(500);
      res.sendHttpError(err);
    }
  }
});

module.exports = app;
