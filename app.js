var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = new express();

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

var PAGE_ACCESS_TOKEN = 'CAAbDDNjq7MgBAIl5VLzC23NrA9WFDy9TA12cE0WrQ2IvBlGvl1EfIJng5hE4c8g0EzFWZClEZAIAAj8tVpMEfxdX1NEvZA8ZA22nC58W4o138F8GqaybXzAsIS6I0ZA07vH9PkqZBdVZAZArkjWdU5vHMeZAJ9l4CGLbWf9oEG3oZADZAMNkCxFUDeBfRTSLI6QdJVpZBIo02qAz9gZDZD';
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
});

app.post('/webhook/', function (req, res) {
    messaging_events = req.body.entry[0].messaging
    for (i = 0; i < messaging_events.length; i++) {
        event = req.body.entry[0].messaging[i]
        sender = event.sender.id
        if (event.message && event.message.text) {
            text = event.message.text
            sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
        }
    }
    res.sendStatus(200)
});

/* Helpers */
function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('Error: ', response.body.error)
        }
    })
}

// Spin up the server
app.listen(app.get('port'), function() {
    console.log('running on port', app.get('port'))
});