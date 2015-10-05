---
layout: post
title:  "WebSocket NodeJS Server"
categories: WebSockets
permalink: /websockets/websocket-nodejs-server.html
---
After building a sample client that was communicating with the test echo server, we can extend our knowledge of **WebSockets** by creating our own **NodeJS server**.

If you prefer to have a look at the code before embarking on the journey, [here it is][codebase]. If you need more explanation, have a read below on what we're actually doing there.

#NodeJS

WebSocket servers can be obviously coded in any language - so why choose NodeJS? For the sake of this tutorial, I'd say because we do everything in **JavaScript** and switching to another language wouldn't help.

But even if it wasn't for this tutorial, I'd still choose **NodeJS** in most cases because I believe it is pretty much **ideal for this task**. Node has the great advantage of being **asynchronous** - which means it can handle "on its own" a lot of different tasks without us having to hassle with threads etc. So as long as you don't need anything very specific, NodeJS server will be able to handle [multiple client connections gracefully and fast][benchmark].

If you've never worked with Node, don't worry - what we're going to be doing here is really simple.

#Installation

Chances are you've already installed Node because it's used for so much more than just server-side scripts. If not, to create a NodeJS server and run it locally, you'll need to [install node][installation] first.

In addition to that, we'll require some sort of a **WebSocket library**. I'm quite keen on [this websocket package][websocket-pkg]. It's probably a little too heavy for what we need to do here but it's useful if you want to write server AND client using Node, and possibly even write some tests.

Please note that you either have to install the WebSocket package in the folder where the rest of the server lives, or install it globally using:

`npm install websocket -g`

That's all we will need for this part of the **WebSocket tutorial**.

#Basic Server

First of all, we need to write a very **generic server** which will serve as a base for our WebSocket server.

Let's have a look at it step by step.

{% highlight javascript %}
/**
 * server.js
 * Basic server which will underline our WebSocket server
 */
var http = require('http');
var server;
{% endhighlight %}

To begin with, we require a Node module which makes creating servers a piece of cake. We also need a variable that will be associated with our server.

{% highlight javascript %}
function Server() {
    return http.createServer(function(request, response) {
        response.writeHead(404);
        response.end();
    });
}
{% endhighlight %}

Then we write a function that has only one purpose: creating a server that always returns response `404 Not Found`. We return an error because we don't want to use it to serve pages at all, and the WebSocket part won't be affected by this response in any way.

{% highlight javascript %}
module.exports = function() {
    if (!server) {
        server = new Server();
    }

    return server;
};
{% endhighlight %}

Finally, we tell Node what we want to return when another file `requires` this module. If we haven't created a server yet, we initialise it and return it. Otherwise, we directly return the already existing server. This way, we won't end up with instances of servers scattered across our codebase.

#WebSocket Server

Our **WebSocket server** will go through the **initial handshake**, and if that is successful, we'll be listening to messages this socket receives. It will log any message (so we can see it in the terminal server-side) and will send it right back.

{% highlight javascript %}
/**
 * websocket-server.js
 * Echo WebSocket server
 */
var Server = require('./server');
var WebSocketServer = require('websocket').server;
{% endhighlight %}

As a typical Node module, it begins by requiring other modules. We need our basic server, and the WebSocket library.

{% highlight javascript %}
function init() {
    var server = Server().listen(8080);
    var webSocketServer = new WebSocketServer({
        httpServer: server
    });

    console.log('Server is up and running!');

    return webSocketServer;
}

module.exports = {
    init: init
};
{% endhighlight %}

Our module will expose the init function which we'll use when we want to run the server. This function creates basic server with port `8080`, and attaches a WebSocket server on top of it.

{% highlight javascript %}
function init() {
    // initialise webSocketServer...

    webSocketServer.on('request', function(request) {
        var socket = request.accept('plain-text');

        socket.on('message', function(message) {
            console.log('Received message: ' + message.utf8Data);
            socket.sendUTF(message.utf8Data);
        });
    });

    // return...
}
{% endhighlight %}

Our WebSocket server will be able to process handshake when it receives a request.

We'll accept only certain types of requests, for security and practical reasons, by specifying a [sub-protocol][sub] "plain-text". This can be named any way you like if you're using your own sub-protocol (like we do here) or some that already exist (such as [STOMP][stomp]). 

After the handshake, we start listening for messages coming from that client, logging them and sending them right back.

#Tweaking Our Client

So we've introduced specific **sub-protocol** in our server and what does the client do? The client needs to reflect this change, it has to tell the server it's going to send messages "encoded" in the right way. The server we wrote can already handle our simple messages but it doesn't know it unless we make that clear. We need to shout out to the server while doing the handshake that the messages will be just fine.

It's actually much simpler to tweak it than to explain the change. In our `socket.js` file, when creating the WebSocket, we'll pass through not only host, but also name of the sub-protocol.

{% highlight javascript %}
function Socket(host) {
    this.socket = new WebSocket('ws://' + host, 'plain-text');

    // the rest of the socket constructor goes on here...
}
{% endhighlight %}

In order to connect to our server instead of the test echo one, we need to make one more change in `client.js`. When asking for a new socket, we swap the host:

{% highlight javascript %}
var socket = new Socket('localhost:8080');
{% endhighlight %}

#Running It Locally

If you want to **run everything locally** now, one last step is required. Let's create a new file in the same folder as the server files.

{% highlight javascript %}
/**
 * run-server.js
 * Use to run our WebSocket server locally on http://localhost:8080
 */
var server = require('./websocket-server').init();
{% endhighlight %}

We can launch the server now from terminal by typing:

{% highlight bash %}
node run-server.js
{% endhighlight %}

If you open your client in the browser and send a few messages, you'll see the same stuff happening as before - **echo of your messages** is added every time you send them. In addition to that, you can also see **log** of all your messages in the **terminal** where your server is running.

Note that if you go to `http://localhost:8080` in your browser, it will respond with 404.

#Conclusion

And that's it! If you want to see server code all together, you can do so [here][codebase]. [In this repository][demo], you can see all the code together, including html and all.

It should be really easy for you now to build on top of this tutorial, to create anything you like. Chat? Notifications? Real-time updates of data? You name it.

Happy coding!

[benchmark]: http://zgadzaj.com/benchmarking-nodejs-basic-performance-tests-against-apache-php
[installation]: https://docs.npmjs.com/getting-started/installing-node
[websocket-pkg]: https://www.npmjs.com/package/websocket
[codebase]: /websockets/server/
[sub]: http://blog.caucho.com/2010/05/07/websockets-and-sub-protocols/
[stomp]: http://jmesnil.net/stomp-websocket/doc/
[demo]: https://github.com/lithin/websocket-server-demo