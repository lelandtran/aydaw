var express = require('express');
var passport = require('passport');
var session = require('express-session');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();
var GitHubStrategy = require('passport-github2').Strategy;

var GITHUB_CLIENT_ID = "85cf4f7639313a6f10a4";
var GITHUB_CLIENT_SECRET = "b62b4279e42e9cc2244808eccbe39cb080c56f34";


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete GitHub profile is serialized
//   and deserialized.
passport.serializeUser(function(user, done){
	done(null, user);
});

passport.deserializeUser(function(obj, done){
	done(null, obj);
});

// Use the GitHubStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and GitHub
//   profile), and invoke a callback with a user object.
passport.use(new GitHubStrategy({
	clientID: GITHUB_CLIENT_ID,
	clientSecret: GITHUB_CLIENT_SECRET,
	callbackURL: "http://127.0.0.1:3000/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, done){
  	//asynchronous verification, for effect...
  	process.nextTick(function() {
  		// To keep the example simple, the user's GitHub profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the GitHub account with a user record in your database,
      // and return that user instead.
  		return done(null, profile);
  	})
  }
))


app.set('views', './assets/views');
app.engine('handlebars', exphbs({defaultLayout: 'layout', layoutsDir:__dirname+'/assets/views/layouts'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended : true }));
app.use(bodyParser.json());
app.use(session({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
	console.log('Request URL:', req.originalUrl);
	next();
}, function (req, res, next) {
	console.log('Request Type:', req.method);
	next();
});

app.get('/', function(req, res) {
   res.render('index', {title: 'Indexxx'});
});

app.get('/repo', ensureAuthenticated, function(req, res){
	var sendReq = request('https://www.google.com', function (error, response, body){
		if (!error && response.statusCode == 200){
			console.log(body);
		}
	});
	console.log(sendReq);
	res.render('repo', { user : req.user });
});

app.get('/login', function(req, res){
	res.render('login', { user : req.user });
});

app.get('/auth/github',
	passport.authenticate('github', { scope: [ 'user:email', 'repo:status' ] }),
	function(req, res){
		// The request will be redirected to GitHub for authentication, so this
    	// function will not be called.
	});

app.get('/auth/github/callback', 
	function(req, res, next){ console.log('auth callback'); next(); },
	passport.authenticate('github', { failureRedirect: '/login' }),
	function(req, res){
		res.redirect('/');
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});



app.use(function (req, res, next) {
  res.status(404).send('Sorry cant find that!')
});
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
});

app.listen(3000, function() {
   console.log('Example app listening on port 3000!');
});

function ensureAuthenticated(req, res, next){
	if (req.isAuthenticated()){ return next(); }
	res.redirect('/login');
}