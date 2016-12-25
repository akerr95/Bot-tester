"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
}) : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

console.log( process.env['MicrosoftAppId']);
var bot = new builder.UniversalBot(connector);

bot.dialog('/', function (session) {
    session.send('You said ' + session.message.text);
});

if (useEmulator) {
    var Hapi = require('hapi');
    var server = Hapi.Server();
    
    server.connection({port:8080});
    server.start((err) => {

        if (err) {
            throw err;
        }

        server.log('info', 'Server running at: ' + server.info.uri);
    });
    server.route({
        method: "POST",
        path:'/api/messages',
        handle:connector.listen()
    });
} else {
    module.exports = { default: connector.listen() }
}
