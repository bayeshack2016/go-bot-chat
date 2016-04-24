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

//Weather
var WEATHER_API_KEY = '16acf95c142f6e5cc451e78523aa78b9';
var WEATHER_API_URL = 'https://api.forecast.io/forecast/';

app.get('/', function(req, res){
    res.send('Go Bot');
});

app.get('/db', function(req, res) {
  
  MongoClient.connect('mongodb://db_user:password@ds019101.mlab.com:19101/heroku_4kgl924v', function(err, db) {
    var col = db.collection('sessions');
    col.insertOne({id:1}, function(err, r) {
        res.send("doc");
      db.close();
  });
});
});

app.get('/clear', function(req, res) {
  MongoClient.connect('mongodb://db_user:password@ds019101.mlab.com:19101/heroku_4kgl924v', function(err, db) {
    var col = db.collection('sessions');
    col.drop()
    db.close();
    res.send('clear');
  });
});

app.get('/weather', function(req, res) {
  handleWeatherRequest(37.7751648,-122.3986424, function(data){
    res.send(data);
  });
});


function handleWeatherRequest(lat, lon, callback) {
  request.get(WEATHER_API_URL + WEATHER_API_KEY + '/' + lat + ',' + lon, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      callback(body);
    }
  });
}

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
        if (!event.message && !event.postback) {
          res.sendStatus(200);
          return;
        }
        console.log(JSON.stringify(messaging_events));
        MongoClient.connect('mongodb://db_user:password@ds019101.mlab.com:19101/heroku_4kgl924v', function(err, db) {
            var col = db.collection('sessions');
            col.findOne({id:sender}, function(err, doc) {
                if (doc) {
                    console.log(JSON.stringify(doc));
                    switch(doc.step) {
                        case 1:
                            col.updateOne({id:sender},{ $set: { step : 2 } }, function(err, r) {
                                if (event.postback && event.postback.payload) {
                                    sendTextMessage(sender, "Where are you?");
                                }
                            });
                            break;
                        case 2:
                            
                            col.updateOne({id:sender},{ $set: { step : 3 } }, function(err, r) {
                                if (event.message && event.message.text) {
                                  sendTransitButtonMessage(sender);
                                }
                            });
                            break;
                        case 3:
                          col.updateOne({id:sender},{ $set: { step : 3 } }, function(err, r) {
                                if (event.postback && event.postback.payload) {
                                    sendParksMessage(sender);
                                }
                            });
                            break;
                        default:
                            sendIntialMessage(sender);
                    }
                } else {
                    if (event.message && event.message.text) {
                        col.insertOne({id:sender, step:1}, function(err, r) {
                            if (event.message && event.message.text) {
                                sendActivityButtonMessage(sender);
                            }
                        });
                    }
                }
                db.close();
            });

        });
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

function sendActivityButtonMessage(sender) {
  var buttons = [
    {
      "type":"postback",
      "title":"Biking",
      "payload":"{'value': 'Biking', 'step': 'activity'}"
    },
    {
      "type":"postback",
      "title":"Hiking",
      "payload":"{'value': 'Hiking', 'step': 'activity'}"
    },
    {
      "type":"postback",
      "title":"Swimming",
      "payload":"{'value': 'Swimming', 'step': 'activity'}"
    }
  ];
  
  sendButtonMessage(sender, "What do you want to do?", buttons);
}

function sendTransitButtonMessage(sender) {
  var buttons = [
    {
      "type": "postback",
      "title": "Car",
      "payload": "{'value': 'driving', 'step': 'transportation'}"
    },
    {
      "type": "postback",
      "title": "Transit",
      "payload": "{'value': 'transit', 'step': 'transportation'}"
    },
    {
    "type": "postback",
    "title": "Walk",
    "payload": "{'value': 'walking', 'step': 'transportation'}"
    }
  ];
  
  sendButtonMessage(sender, "How are you getting there?", buttons);
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
                    "payload":"Biking"
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

function sendParksMessage(sender) {
  messageData = {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type":"generic",
        "elements":[
          {
            "title":"Marin Headlands",
            "image_url":"http://www.donate.nationalparks.org/sites/default/files/styles/shared_photo_medium/public/9_0.jpeg?itok=GPU5p85P",
            "subtitle":"5 miles away",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://petersapparel.parseapp.com/view_item?item_id=100",
                "title":"Go Now!"
              },
              {
                "type":"web_url",
                "url":"https://petersapparel.parseapp.com/buy_item?item_id=100",
                "title":"Share"
              },
              {
                "type":"postback",
                "title":"Bookmark Park",
                "payload":"USER_DEFINED_PAYLOAD_FOR_ITEM100"
              }              
            ]
          },
          {
            "title":"Golden Gate",
            "image_url":"http://i.huffpost.com/gen/1709434/images/o-GOLDEN-GATE-BRIDGE-facebook.jpg",
            "subtitle":"10 miles away",
            "buttons":[
              {
                "type":"web_url",
                "url":"https://petersapparel.parseapp.com/view_item?item_id=101",
                "title":"Go Now!"
              },
              {
                "type":"web_url",
                "url":"https://petersapparel.parseapp.com/buy_item?item_id=101",
                "title":"Share"
              },
              {
                "type":"postback",
                "title":"Bookmark Park",
                "payload":"USER_DEFINED_PAYLOAD_FOR_ITEM101"
              }              
            ]
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

function sendButtonMessage(sender, text, buttons) {
    messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type":"button",
                "text":text,
                "buttons":buttons
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