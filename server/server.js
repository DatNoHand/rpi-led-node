/**
* LED Controller wit ws + express
* @author Gabriel Selinschek
**/

// Config Vars
var config = require('../config/master_'+env+'.js');

// Other Modules
var fs = require('fs');

// HTTPS Server for WSS
var http = require('http');
var express = require('express');
var app = express();
app.use(express.static(__dirname + '/public'));

// Websocket
var WebSocket = require('ws');
var WebSocketServer = require('ws').Server;

// Port Range for Slaves
var port = config.port;

var httpServer = http.createServer();
httpsServer.listen(config.wss.port);
var wss = new WebSocketServer({ server: httpsServer });

console.log('Listening on '+config.wss.port);

// If the server gets a connection
wss.on('connection', function(ws, req) {
    ws.on('message', (msg) => {

      var valid = false;

      try {
        var msg = JSON.parse(msg);
      } catch   (e){
        ws.send('{"type": "err", "msg": "ERR_SYNTAX"}');
        ws.terminate();
      }
      // If there is no type in the message
      if (!msg.type) {
      ws.send('{"type": "err", "msg": "ERR_SYNTAX"}');
      ws.terminate();
      }

      ws.username = msg.username;
      ws.uid = uuid.v1();

      switch (msg.type) {
        case:
        break;
      }
    });
});

function SendToEveryone(data) {
        wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
                client.send(data);
        }
        });
}

function SendToEveryoneButOrigin(data, ws) {
        wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(data);
                }
        });
}
