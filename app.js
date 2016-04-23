var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

var app = new express();

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));

// Process application/json
app.use(bodyParser.json());

//FB settings
var PAGE_ACCESS_TOKEN = 'CAAbDDNjq7MgBAIl5VLzC23NrA9WFDy9TA12cE0WrQ2IvBlGvl1EfIJng5hE4c8g0EzFWZClEZAIAAj8tVpMEfxdX1NEvZA8ZA22nC58W4o138F8GqaybXzAsIS6I0ZA07vH9PkqZBdVZAZArkjWdU5vHMeZAJ9l4CGLbWf9oEG3oZADZAMNkCxFUDeBfRTSLI6QdJVpZBIo02qAz9gZDZD';
var VERIFY_TOKEN = 'go_bot_verify_me';

//Mongo - mongodb://<dbuser>:<dbpassword>@ds019101.mlab.com:19101/heroku_4kgl924v
var MONGO_DB = 'heroku_4kgl924v';
var MONGO_USER = 'db_user';
var MONGO_PASSWORD = 'password';

var MongoClient = require('mongodb').MongoClient;

//API
var API_URL = 'https://go-bot-api.herokuapp.com/';

app.get('/', function(req, res){
    res.send('Go Bot');
});

app.get('/db', function(req, res) {
  
  MongoClient.connect('mongodb://db_user:password@ds019101.mlab.com:19101/heroku_4kgl924v', function(err, db) {
    res.send("Connected correctly to server.");
    db.close();
  });
});

app.get('/api', function(req, res){
  request.get(API_URL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.send(body);
    }
  });
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
            sendIntialMessage(sender);
        } else if (event.postback && event.postback.payload) {
          res.send(JSON.stringify(event.postback.payload));
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

function sendIntialMessage(sender) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type":"button",
                "text":"What do you want to do?",
                "buttons":[
                  {
                    "type":"postback",
                    "title":"Biking",
                    "payload":{"value": "Biking", "step": "Activity"}
                  },
                  {
                    "type":"postback",
                    "title":"Hiking",
                    "payload":"Hiking"
                  },
                  {
                    "type":"postback",
                    "title":"Swimming",
                    "payload":"Swimming"
                  }
                ]
          }
        }
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