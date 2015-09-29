var Server = require('./server');
var WebSocketServer = require('websocket').server;

function init() {
    var server = Server().listen(8080);
    var webSocketServer = new WebSocketServer({
        httpServer: server
    });

    webSocketServer.on('request', function(request) {
        var socket = request.accept('plain-text');

        socket.on('message', function(message) {
            console.log('Received message: ' + message.utf8Data);
            socket.sendUTF(message.utf8Data);
        });
    });

    console.log('Server is up and running!');

    return webSocketServer;
}

module.exports = {
    init: init
};