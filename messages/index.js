"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var builder_cognitiveservices = require("botbuilder-cognitiveservices");

var useEmulator = (process.env.NODE_ENV === 'development');

/**
 * interface IWebResponse {
 *     end(): this;
 *     send(status: number, body?: any): this;
 *     send(body: any): this;
 *     status(code: number): this;
 * }
 */
function responseWrapper(res) {
    return {
        end() {
            res.end();
            return this;
        },

        send(statusOrBody, maybeBody, callback) {
            var responseCode = 200;
            var responseBody = maybeBody;

            if (typeof statusOrBody == 'number') {
                responseCode = statusOrBody;
                responseBody = maybeBody;
            } else {
                responseBody = statusOrBody;
            }

            if (typeof responseBody != 'string') {
                responseBody = JSON.stringify(responseBody);
            }

            res.writeHead(responseCode);
            res.setHeader("Content-Type", "application/json");
            res.write(responseBody, callback);
            res.end();
            return this;
        },

        status(code) {
            res.writeHead(code);
            return this;
        }
    };
}

/**
 * 
 * interface IWebRequest {
 *     body: any;
 *     headers: {
 *         [name: string]: string;
 *     };
 *     on(event: string, ...args: any[]): void;
 * }
 * 
 */
function requestWrapper(request) {
    return {
        body: request.payload,
        headers: request.headers,
        on(event, listener) {
            request.raw.req.on(event, listener);
            return this;
        }
    };
}


var connector = useEmulator ? new builder.ChatConnector({
    appId: process.env.APPID,
    appPassword: process.env.PASSWORD,
}) : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});


var bot = new builder.UniversalBot(connector);

var recognizer = new builder_cognitiveservices.QnAMakerRecognizer({
    knowledgeBaseId:process.env.QnAKnowledgebaseId, 
    subscriptionKey: process.env.QnASubscriptionKey
});

var basicQnAMakerDialog = new builder_cognitiveservices.QnAMakerDialog({
    recognizers: [recognizer],
                defaultMessage: 'No match! Try changing the query terms!',
                qnaThreshold: 0.3}
);

bot.dialog('/', basicQnAMakerDialog);
function status(request,reply){
      
        var wrappedResponse = responseWrapper(request.raw.res);
        var wrappedRequest = requestWrapper(request);
        botconnect(wrappedRequest,wrappedResponse);
}
var botconnect = connector.listen();
if (useEmulator) {
  var Hapi = require("hapi");
  var server =new Hapi.Server();
  
  server.connection({port:3987});
  
  server.route({
    method: "POST",
    path: '/api/messages',
    handler:status
});
 server.register({
    register: require("good"),
    options: {
        reporters: {
            console: [{
                module: "good-squeeze",
                name: "Squeeze",
                args: [{
                    response: '*',
                    log: '*'
                }]
            }, {
                module: "good-console",
            }, "stdout"]
        }
    }
}, (err) => {
    if (err) {
        throw err;
    }
    server.start((err) => {

        if (err) {
            throw err;
        }

        server.log('info', 'Server running at: ' + server.info.uri);
    });
});
   
   
} else {
    module.exports = { default: connector.listen() };
}
