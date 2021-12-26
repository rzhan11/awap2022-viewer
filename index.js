#!/usr/bin/nodejs

// -------------- load packages -------------- //
var express = require('express')
var path = require('path');
var hbs = require('hbs');
var fs = require('fs');

var app = express();

// -------------- express initialization -------------- //
app.set('port', process.env.PORT || 8080 );

// tell express that the view engine is hbs
app.set('view engine', 'hbs');

// -------------- express endpoint definition -------------- //

app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

app.get('/', function(req, res){
    console.log("home anon()");
    res.render("home", {
    });
});


app.get('/test', function(req, res){
    console.log("test anon()");
    res.render("test", {
    });
});

app.get('/bar', function(req, res){
    console.log("bar anon()");
    res.render("bar", {
    });
});
// -------------- listener -------------- //
// The listener is what keeps node 'alive.'

var listener = app.listen(app.get('port'), function() {
  console.log('Express server started on port: '+listener.address().port);
});
