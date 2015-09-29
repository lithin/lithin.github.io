---
layout: post
title:  "WebSocket Client - Part I"
categories: WebSockets
permalink: /:categories/:title.html
---
In the previous article, I've summed up why I think WebSockets are definitely worth a try. Let's carry on with **building our own client** by adding functionality to the WebSocket API step by step so that we can create an abstraction layer between the server and the client. That's what we'll do in **Part I** of this article; in [Part II][part-ii], we'll write the client javascript and some UI so that we can see our script in action.

#Demo and code

We're going to build a client that will communicate with [the test echo server][server]. The user will be able to send messages to the server and see the echo on the same page. [See for yourself][client-demo] how it should work.

As you could see in the simple demo from [the previous article][intro], it can be a matter of only a few lines to implement WebSockets. If we want to use a little more **modular approach** however, we might need to write a little more.

For those of you who prefer to jump ahead and learn about things straight from the finished code, [you can find it here][code]. For the rest, I've written detailed instruction that not only focus on the socket but also on some architectural elements of our project.

#First Things First - Architecture

Let's say we'd like to extend the [WebSocket from the demo][demo] (which is sending messages to an echo server) with a **log of all activities** and to add a way of **reporting errors**.

From architectural point of view, our WebSocket object doesn't need to know anything at all about the UI - all it has to do is to connect to the remote server when created, send messages when asked to, and run registered event handlers when an error occurs or when a new message from the server is received. This way, it can serve as a **mediator between the server and our UI**. It will handle all necessary "back-end stuff" so we can focus on the user experience in our actual client file.

To build such a structure, we'll need two javascript files: one for the WebSocket implementation itself (can be seen as a very simple library), and one for a set of controls for our UI (this one will also require jQuery).

In this article, we'll focus on writing the library.

#Extending WebSocket API

When building the socket mediator, our goal is to **extend the WebSocket API** in such a way that we can implement as many sockets as we want on our page, with some methods that will enable us to:

* connect to a specified server,
* disconnect,
* send message, and
* register callbacks for any WebSocket event.

We can then start with a simple object-oriented[^1] structure:

{% highlight javascript %}
/** 
 * socket.js
 * Object extending the WebSocket API
 * Serves as a mediator between client and the WebSocket server
 */

function Socket(host) {
    // automatically connect to the server when called
}

Socket.prototype.close = function() {
    // disconnect  
};

Socket.prototype.send = function(message) {
    // send message  
};

Socket.prototype.on = function(type, callback) {
    // register callback  
};
{% endhighlight %}

This object can be then used in our client to connect to the server and communicate with it as long as we want to.

#Constructing

Whenever we *construct* a new socket, we'd like to make a **connection to the server** and create a new **log** for the socket so that we have a place where we can store all events happening over time. Additionally, we'll also add a **callbacks** storage that we'll fill with data as we carry on writing the constructor.

{% highlight javascript %}
/**
 * socket.js
 * Constructor connects to a server and hooks callbacks and logs into place
 */
function Socket(host) {
    this.socket = new WebSocket('ws://' + host);
    this.log = {};
    this.callbacks = {};
}
{% endhighlight %}

The very first line in our constructor initialises handshake with the specified server, and the connection is then established asynchronously.

#Opening WebSocket

There are four main event methods in the API: *onopen*, *onmessage*, *onclose*, and *onerror*. When the handshake with server is processed, the `onopen` method is fired.

{% highlight javascript %}
function Socket(host) {
    // ...

    this.callbacks = {
        open: null
    };

    // when connection to the server is established
    this.socket.onopen = (function() {
        // log this event with timestamp
        var log = {
            type: 'connection open'
        };
        this.log[Date.now()] = log;
        
        // run callback if it's registered
        if (this.callbacks.open) {
            this.callbacks.open();
        }
    }).bind(this);
}
{% endhighlight %}

There are two things to point out in the code above. What the function does when a connection is open is quite obvious from the comments. What isn't that clear is why we're binding `this` and why we need to define the callback as `null` by default.

The reason we need to bind `this` to the `onopen` function is that by default, `this` in WebSocket API methods is the WebSocket itself, not our encapsulating object. 

Secondly, we don't really *need* to define `this.callbacks.open` as `null` right now but it'll come in handy later on. When we're writing the function which registers new callbacks, I'll get back to this point.

#Closing the Socket

When the socket is closed, we'd like to do a couple of things that are very similar to when we open it - log the event, and call event handler if it is registered.

{% highlight javascript %}
function Socket(host) {
    // ...

    this.callbacks = {
        open: null,
        close: null
    };

    // when connection to the server is closed
    this.socket.onclose = (function() {
        // log this event with timestamp
        var log = {
            type: 'connection closed'
        };
        this.log[Date.now()] = log;
        
        // run callback if it's registered
        if (this.callbacks.close) {
            this.callbacks.close();
        }
    }).bind(this);
}
{% endhighlight %}

#DRY it all up

We see a lot of repetition in the code snippet above; `onopen` and `onclose` are practically doing the same thing. Let's DRY it up a bit by creating `addLog` and `runCallback` functions.

{% highlight javascript %}
function Socket(host) {
    // ...

    this.socket.onopen = (function() {
        addLog.call(this, 'connection open');
        runCallback.call(this, 'open');
    }).bind(this);

    this.socket.onclose = (function() {
        addLog.call(this, 'connection closed');
        runCallback.call(this, 'close');
    }).bind(this);
}

function addLog(type) {
    var log = {
        type: type
    };

    this.log[Date.now()] = log;
}

function runCallback(type) {
    if (this.callbacks[type]) {
        this.callbacks[type];
    }
}
{% endhighlight %} 

Our new functions `addLog` and `runCallback` should not be accessible by the client so we won't bind them to the prototype. Instead, we `call` them from `onclose` and `onopen` directly, passing the object's `this` so that they know which callbacks and log to access.

#Error Handling

The `onerror`, as you can guess, will be very similar with one exception. When logging the event or running callback, we'd like to pass it the error so that debugging is easier for us ad the client can display relevant information to the user.

{% highlight javascript %}
function addLog(type, content) {
    var log = {
        type: type
    };

    // add content to the log if necessary
    if(content) {
        log.content = content;
    }

    this.log[Date.now()] = log;
}

function runCallback(type, data) {
    if (this.callbacks[type]) {
        this.callbacks[type](data);
    }
}
{% endhighlight %} 

With the helper functions modified this way, we can implement the error function as follows:

{% highlight javascript %}
function Socket(host) {
    // ...

    this.socket.onerror = (function(e) {
        // log error and pass it to the callback function
        addLog.call(this, 'error', e);
        runCallback.call(this, 'error', e);
    }).bind(this);
}
{% endhighlight %}

#Receiving a Message

I intentionally left the most interesting event handler to the end. Apart from running a callback and logging the message, `onmessage` needs to check if valid message was received so that our code doesn't throw random errors (and it also helps us to protect the client from potentially dangerous messages).

{% highlight javascript %}
function Socket(host) {
    // ...

    this.socket.onmessage = (function(e) {
        // validate data from server before logging it and running a callback
        var data = e.data;

        if(typeof data === 'string') {
            addLog.call(this, 'message', data);
            runCallback.call(this, 'message', data);
        } else {
            addLog.call(this, 'error', 'Message received from the server was not valid');
        }
    }).bind(this);
}
{% endhighlight %}

Phew! One big chunk of our work is done! But it wouldn't be much of a socket unless we are able to send messages, right?

#Sending Stuff (for lack of better words)

If you've read this far - well done and don't worry! We're nearly done :)

When sending a message, we need to validate the input first. That way, we'll make sure that the server will receive exactly what it expects.

{% highlight javascript %}
Socket.prototype.send = function() {
    if (typeof message === 'string' && this.socket.readyState === 1) {
        // note that all communication between client and server is passed as string
        this.socket.send(message);
    } else {
        addLog.call(this, 'error', new Error('Socket is not ready or message is not valid'));
    }
};
{% endhighlight %}

In this piece of code, one thing deserves a comment. WebSocket has defined states (`readyState`) that range from `opening` to `closed`. There's only one state that signals that the socket is open and ready to send a receive messages - `open`, or `1`. You can learn more about [ready states here][ready-state] if you'd like to know more.

#"Subscribing" to an Event

One of our last steps is adding a method to our API that will make it possible to add an event callback to our socket. This method will be used by the client to "hook into" events running in the socket so that it can display relevant messages to the user. In terms of JS patterns, we can talk here about slightly modified [observer pattern][observer-pattern] where the client is the observer in question.

We'd like to design our method in a way so that the client can add only valid types of callbacks. That means a client can register an event handler for the `open` event but not for random `foo`.

As the socket can be used only by one client from a practical point of view, we don't need to enable more than one callback for the event. That's why callback function don't need to be stored in an array.

{% highlight javascript %}
Socket.prototype.on = function(event, callback) {
    if (typeof event !== 'string' || typeof callback !== 'function' || this.callbacks[event] === undefined) {
        throw new Error('Function "on" is missing required arguments.');
    }

    this.callbacks[event] = callback;
};
{% endhighlight %}

#Closing the Socket

The very last method to be written is super simple. All we need to do is to ask the socket to disconnect itself and close - or in other words, we just expose the WebSocket `close` method to the client.

{% highlight javascript %}
Socket.prototype.close = function() {
    this.socket.close();
};
{% endhighlight %}

And this is it!

#What's Next?

I appreciate that the step by step approach can leave a little bit of confusion so [here's the whole thing together][code]. In the end, it's not too long - I only wanted to explain how we get that code in detail.

Of course this version of WebSocket implementation has some loose ends and can be still improved but I'll leave that up to you and your own experiments ;) Try to **think of one enhancement**, and tweak the code to **make it**. That way, you'll get a hands on experience with WebSockets without having to build the whole thing from scratch.

In the [follow-up article][part-ii], we'll learn how to plug this code into an html page. See you then!

#Footnotes

[^1]: I feel there's a war between people who love OOP and [others][anti-oop] who reject it as an overly complicated way of coding. I stand somewhere in between - I think using OOP can be useful if we're creating something that should be easily replicated; on the other hand, sometimes it simply makes more sense to use good ol' functional programming. That's why you'll see OOP approach in this article but for the client itself, we will stick to less structured code.

[intro]: {% post_url 2015-08-08-websockets-intro %}
[demo]: /websockets/demo
[observer-pattern]: http://addyosmani.com/resources/essentialjsdesignpatterns/book/#observerpatternjavascript
[anti-oop]: http://mollyrocket.com/casey/stream_0019.html
[ready-state]: http://www.w3.org/TR/2011/WD-websockets-20110929/#dom-websocket-readystate
[code]: /websockets/socket-js
[server]: https://www.websocket.org/echo.html
[client-demo]: /websockets/client-demo
[part-ii]: {% post_url 2015-09-13-websockets-client %}