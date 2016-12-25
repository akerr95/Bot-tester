"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV === 'development');

console.log(process.env.NODE_ENV);
var connector = useEmulator ? new builder.ChatConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
}) : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

var bot = new builder.UniversalBot(connector);

bot.dialog('/', function (session) {
    session.send('Alec said ' + session.message.text);
});
function status(request,reply){
     connector.listen(request.raw.req,request.raw.res);
     return reply("ok");
}
if (useEmulator) {
     var restify = require('restify');
    var server = restify.createServer();
    server.listen(8080, function() {
        console.log('test bot endpont at http://localhost:8080/api/messages');
    });
    server.post('/api/messages', connector.listen());  
   
} else {
    module.exports = { default: connector.listen() }
}
