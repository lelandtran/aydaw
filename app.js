var express = require('express');
var exphbs = require('express-handlebars');
var app = express();


app.set('views', './assets/views');
app.engine('handlebars', exphbs({defaultLayout: 'layout', layoutsDir:__dirname+'/assets/views/layouts'}));
app.set('view engine', 'handlebars');

app.use(express.static('public'));
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
