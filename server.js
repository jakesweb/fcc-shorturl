'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var validUrl = require('valid-url');

var app = express();
app.use(bodyParser.urlencoded({extended: 'false'}));
app.use(bodyParser.json());

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);
var Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_URI);

// url schema
var urlSchema = new Schema({
  original_url: String,
  short_url: Number
});

var URL = mongoose.model('URL', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/delete/records", function(req,res) {
  URL.remove(function(error,data) {
    if (error) return console.error(error);
    res.json({ removed: data });
  });
});

app.get("/api/shorturl/:url", function(req,res) {
  URL.findOne({ short_url: req.params.url }).exec(function(error,data) {
    if (error) console.error(error);
    res.setHeader('Location', data.original_url);
    res.statusCode = 302;
    res.end();
  });
});

app.post("/api/shorturl/new", function(req,res,next) {
  if (!validUrl.isUri(req.body.url)) {
    res.json({ error: 'Invalid URL' });
  } else {
    URL.count(function(error,data) {
      if (error) return console.error(error);
      var url = new URL({ original_url: req.body.url, short_url: data + 1 });
      
      url.save(function(error,data) {
        if (error) return console.error(error);
        URL.findById(data._id).select('-_id original_url short_url').exec(function(error,data) {
          if (error) return console.error(error);
          res.send(data);
        });   
      });
    });  
  }
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});