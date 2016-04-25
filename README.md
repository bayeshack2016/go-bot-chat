# GO Bot Chat 

A chat bot using Facebook's [Messenger platform](https://messengerplatform.fb.com/).  The bot will ask the user series of questions to provide park recommendations, based on activity, geolocation and method of transportation.

![gobot](/gobot.gif)
## Set up

` npm install `

Set the environmental variables according to your facebook app:

PAGE_ACCESS_TOKEN

VERIFY_TOKEN

Set the mongo connection string for session storage:

MONGO_CONNECTION_STRING

## Debugging locally

`node app`

Application will run on http://localhost:5000/
