(function() {

    function Socket(host, subprotocol) {
        this.socket = new WebSocket('ws://' + host, subprotocol);
        this.log = {};
        this.callbacks = {
            message: null,
            open: null,
            close: null,
            error: null
        };

        // bind events - every event is written in a log and runs a callback
        this.socket.onopen = (function() {
            addLog.call(this, 'connection open');
            runCallback.call(this, 'open');
        }).bind(this);

        this.socket.onclose = (function() {
            addLog.call(this, 'connection closed');
            runCallback.call(this, 'close');
        }).bind(this);

        this.socket.onerror = (function(e) {
            addLog.call(this, 'error', e);
            runCallback.call(this, 'error', e);
        }).bind(this);

        this.socket.onmessage = (function(e) {
            if (typeof e.data === 'string') {
                addLog.call(this, 'message', e.data);
                runCallback.call(this, 'message', e.data);
            } else {
                addLog.call(this, 'error', 'Message received from the server was not valid');
            }
        }).bind(this);
    }

    Socket.prototype.close = function() {
        this.socket.close();
    };

    Socket.prototype.send = function(message) {
        if (typeof message === 'string' && this.socket.readyState === 1) {
            this.socket.send(message);
        } else {
            addLog.call(this, 'error', new Error('Socket is not ready or message is not valid'));
        }
    };

    Socket.prototype.on = function(event, callback) {
        if (typeof event !== 'string' || typeof callback !== 'function' || this.callbacks[event] === undefined) {
            throw new Error('Function "on" is missing required arguments.');
        }

        this.callbacks[event] = callback;
    };

    function addLog(type, content) {
        var log = {
            type: type
        };

        // add content to the log if necessary
        if (content) {
            log.content = content;
        }

        this.log[Date.now()] = log;
    }

    function runCallback(type, data) {
        if (this.callbacks[type]) {
            this.callbacks[type](data);
        }
    }

    var socket = new Socket('localhost:8080', 'plain-text');
    socket.on('open', function() {
        $('form').submit(function(e) {
            e.preventDefault();
            socket.send($('input').val());
        });

        $('.disconnect').click(function() {
            socket.close();
        });
    });

    socket.on('message', function(message) {
        $('.heard').append($('<li></li>').text(message));
    });

    socket.on('close', function() {
        showNotification('You were disconnected from the server.');
    });

    socket.on('error', function() {
        showNotification('Sorry, something has gone wrong. Please try again later.');
    });

    function showNotification(text) {
        $('.notification').text(text).removeClass('hidden');
        $('.echo').addClass('hidden');
    }


})();
