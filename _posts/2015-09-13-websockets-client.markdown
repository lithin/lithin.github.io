---
layout: post
title:  "WebSocket Client - Part II"
categories: WebSockets
permalink: /websockets/websocket-client-ii.html
---

After extending WebSocket API with our own implementation in [Part I][part-i], Part II will focus on user interaction with the socket. We'll do more html and css and jquery so it should be a little bit of a break after the javascript marathon of [Part I][part-i].

#Let's Get Started

...by building the UI! (Because it's the most straightforward part of our work.)

This is about all HTML we'll need for now:

{% highlight html %}
<!doctype html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <style>
    .hidden: {
        display: none;
    }
    </style>
    <script defer src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.3/jquery.min.js"></script>
    <script defer src="websocket.js"></script>
    <script defer src="client.js"></script>
</head>

<body>

<div class="echo">
    <ul class="heard"></ul>
    <form>
        <input type="text" />
        <button type="submit">Send</button>
    </form>
    <button class="disconnect">Disconnect</button>
</div>

<div class="notification hidden"></div>

</body>

</html>
{% endhighlight %}

Just a few notes here: we should include [all our javascript with defer attribute][script-defer], and set a style that will enable us to hide/show elements on the page without using too much jQuery. In the body, we should have an empty list of received messages (`.heard`), input for sending messages, and a disconnect button that will close the WebSocket channel. In addition to that, we should have a space for showing notifications to the user - if something goes terribly wrong or when the connection is closed.

#Kicking Off the Client

You're probably pretty familiar with our WebSocket API by now but if you need a refresh, have a peak here. We'll use our API to connect to the server, and when the connection is open, do some interesting (?) stuff. Such as sending messages - you didn't expect we could start [importing wine][wine], did you?

{% highlight javascript %}
/**
 * client.js
 * UI handler for the WebSocket example
 * Initialises Socket and connects html elemnts to javascript events
 */

var socket = new Socket('echo.websocket.org');
socket.on('open', function() {
    socket.send('hello!');
});
{% endhighlight %}

We'll obviously want to (and will be able to) do much more with the socket but you get the idea from this example of how we can use it.

#When the Socket Is Ready
When our page is loaded, we'd like to create a new socket. Apart from that, we can't really do much until the socket is open. Although theoretically we can add handlers to our html elements, waiting until the socket is open and ready for use is probably a better idea.

When connection to the server is established, we should add event handlers for sending messages and disconnecting from the server.

{% highlight javascript %}
var socket = new Socket('echo.websocket.org');

socket.on('open', function() {
    $('form').submit(function(e) {
        e.preventDefault();
        socket.send($('input').val());
    });

    $('.disconnect').click(function() {
        socket.close();
    });
});
{% endhighlight %}

This script will suffice to send messages - now we need to make sure we can also show the ones we receive.

#Showing received messages

As we've done most of the hard work for parsing message text elswhere, we can just append an element to our list of "heard" messages.

{% highlight javascript %}
socket.on('message', function(message) {
    $('.heard').append($('<li></li>').text(message));
});
{% endhighlight %}

#Disconnecting

Although the handler for disconnecting has already been done, we haven't really handled the closing event itself. It'd probably be a good idea to hide the UI and show a notification when that happens:

{% highlight javascript %}
socket.on('close', function() {
    showNotification('You were disconnected from the server.');
});

function showNotification(text) {
    $('.notification').text(text).removeClass('hidden');
    $('.echo').addClass('hidden');
}
{% endhighlight %}

#In Case Something Goes Terribly Wrong

Handling errors will be very similar - and here comes the reason why `showNotification` is useful as a function.

{% highlight javascript %}
socket.on('error', function() {
    showNotification('Sorry, something has gone wrong. Please try again later.');
});
{% endhighlight %}

#Done!

And it's done! You can see the [finished code for client here][code], and a working demo (if you haven't ran it locally yet) [here][demo].

That was pretty easy, wasn't it? But obviously this is only one part of the equation. So far, we've been using a third-party server but what if we want to use our own server? In the next article, you'll learn how to do exactly that - we'll build a simple NodeJS server that will send back an echo just like the WebSockets test server does.

[script-defer]:  http://www.w3schools.com/tags/att_script_defer.asp
[wine]: https://www.youtube.com/watch?v=CRL1SeTJ1rk
[code]: /websockets/client
[demo]: /websockets/client-demo
[part-i]: {% post_url 2015-08-17-websockets-socket %}
