var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = new express();

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

var APP_TOKEN = 'CAAbDDNjq7MgBAIl5VLzC23NrA9WFDy9TA12cE0WrQ2IvBlGvl1EfIJng5hE4c8g0EzFWZClEZAIAAj8tVpMEfxdX1NEvZA8ZA22nC58W4o138F8GqaybXzAsIS6I0ZA07vH9PkqZBdVZAZArkjWdU5vHMeZAJ9l4CGLbWf9oEG3oZADZAMNkCxFUDeBfRTSLI6QdJVpZBIo02qAz9gZDZD';
var VERIFY_TOKEN = 'go_bot_verify_me';

app.get('/', function(req, res){
    res.send('Go Bot');
});


/* WebHooks */
app.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
})

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
});