var express = require('express');
var app = express();

// ----------------------------------------
// dotenv
// ----------------------------------------
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// ----------------------------------------
// Body Parser
// ----------------------------------------
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// ----------------------------------------
// Method Override
// ----------------------------------------
app.use((req, res, next) => {
  var method;
  if (req.query._method) {
    method = req.query._method;
    delete req.query._method;
  } else if (typeof req.body === 'object' && req.body._method) {
    method = req.body._method;
    delete req.body._method;
  }

  if (method) {
    method = method.toUpperCase();
    req.method = method;
  }

  next();
});

// ----------------------------------------
// Public
// ----------------------------------------
app.use(express.static(`${__dirname}/public`));

// ----------------------------------------
// Logging
// ----------------------------------------
var morgan = require('morgan');
app.use(morgan('tiny'));
app.use((req, res, next) => {
  ['query', 'params', 'body'].forEach(key => {
    if (req[key]) {
      var capKey = key[0].toUpperCase() + key.substr(1);
      var value = JSON.stringify(req[key], null, 2);
      console.log(`${capKey}: ${value}`);
    }
  });
  next();
});

// ----------------------------------------
// Sessions/Cookies
// ----------------------------------------
var cookieSession = require('cookie-session');

app.use(
  cookieSession({
    name: 'session',
    keys: ['asdf1234567890qwer']
  })
);

// ----------------------------------------
// Flash Messages
// ----------------------------------------
var flash = require('express-flash-messages');
app.use(flash());

// ----------------------------------------
// Mongoose
// ----------------------------------------
var mongoose = require('mongoose');
app.use((req, res, next) => {
  if (mongoose.connection.readyState) {
    next();
  } else {
    require('./mongo')(req).then(() => next());
  }
});

// ----------------------------------------
// Routes
// ----------------------------------------
var indexRoute = require('./routes/index');
app.use('/', indexRoute);

var cartRoute = require('./routes/cart');
app.use('/cart', cartRoute);

var adminRoute = require('./routes/admin');
app.use('/admin', adminRoute);

// ----------------------------------------
// Template Engine
// ----------------------------------------
var expressHandlebars = require('express-handlebars');

var hbs = expressHandlebars.create({
  partialsDir: 'views/',
  defaultLayout: 'main',
  helpers: {
    isInCart: function(productId, shoppingCart) {
      let inCart = false;

      for (let i = 0; i < shoppingCart.length; i++) {
        let product = shoppingCart[i];
        if (productId === product.id) {
          inCart = true;
          break;
        }
      }

      return inCart;
    },
    subtotal: function(product) {
      return product.price * product.quantity;
    }
  }
});

app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// ----------------------------------------
// Server
// ----------------------------------------
var port = process.env.PORT || process.argv[2] || 3000;
var host = 'localhost';

var args;
process.env.NODE_ENV === 'production' ? (args = [port]) : (args = [port, host]);

args.push(() => {
  console.log(`Listening: http://${host}:${port}`);
});

app.listen.apply(app, args);

module.exports = app;
