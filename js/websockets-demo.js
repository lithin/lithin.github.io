(function() {
    var socket = new WebSocket('ws://echo.websocket.org');

    socket.onopen = function() {
        console.log('connection with server was established');
        socket.send(JSON.stringify('Thanks for having me here!'));
    };

    socket.onclose = function() {
        console.log('connection with server was closed');
    };

    socket.onerror = function(e) {
        console.log('an error occured', e);
    };

    socket.onmessage = function(message) {
        console.log('received a message from server:', JSON.parse(message.data));
    };
})();
