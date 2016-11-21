var express = require('express');
var passport = require('passport');
var session = require('express-session');
var exphbs = require('express-handlebars');
var bodyParser = require('body-parser');
var request = require('request');
var PropertiesReader = require('properties-reader');
var app = express();
var GitHubStrategy = require('passport-github').Strategy;
var properties = PropertiesReader('./secret.properties');

var GITHUB_CLIENT_ID = properties.get('user.github.clientId');
var GITHUB_CLIENT_SECRET = properties.get('user.github.clientSecret');
var oAuthToken = null;

var hbs = exphbs.create({
	extname : '.hbs',
	defaultLayout: 'layout', 
	layoutsDir:__dirname+'/assets/views/layouts',
	partialsDir:__dirname+'/assets/views/partials/',
	helpers: {
		counter : function(index) {return index+1;}
	}
});

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
      oAuthToken = accessToken;
      console.log("accessToken: " + accessToken);
      return done(null, profile);
  	})
  }
));


app.set('views', './assets/views');
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');

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
	var owner = req.query.owner;
	var repo = req.query.repo;
	var since = req.query.since;
	var until = req.query.until;

	owner = owner != "" ? owner : 'lelandtran';
	var reqUrl = repo == "" ? 'https://api.github.com' : 'https://api.github.com/repos/'+owner+'/'+repo+'/commits?';
	reqUrl = since == "" ? reqUrl : reqUrl + 'since='+since;
	reqUrl = until == "" ? reqUrl : reqUrl + 'until='+until;

	console.log('owner: ' + owner + ', repo: ' + repo + ', since: ' + since, 'until: ' + until);
	console.log('reqUrl: ' + reqUrl);
	var requestOps = {
		url: reqUrl,
		headers: {
			'User-Agent' : 'aydaw'
		}
	};
	var httpResponse = null;
	request(requestOps, function (error, response, body){
		if (!error && response.statusCode == 200){
			console.log("body: " + body);
			httpResponse = JSON.parse(body);
			console.log("set httpResponse to: " + JSON.stringify(httpResponse));
			res.render('repo', { reqUrl: reqUrl, resBody : body, commits : httpResponse });
		}
		else {
			console.log("OAUTH-TOKEN: " + JSON.stringify(requestOps.headers));
			console.log("!error: " + !error);
			console.log("body: " + body);
			console.log("statusCode: " + response.statusCode);
			res.json( {error: body});
		}
	});
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