---
layout: post
title:  "W3C WebSocket API"
categories: WebSockets
permalink: /websockets/w3c-websocket-api.html
---
When using [GitHub][github], you’ve probably noticed that it is very quick to show you notifications and new commits, practically real time. Quite a few web apps are now updating their data and **showing notifications instantaneously**. For most part, it isn’t done by polling the server every second or so, or using black magic; instead, they are using WebSockets. GitHub was my original inspiration to try WebSockets out - they seemed to be pushing web to a truly 2.0 version that can seamlessly handle and display any user interaction with the content.

#So what’s all the fuss about?

Without further ado and [wikipedia][wiki-ws] quotations nobody wants to read anyway, let me sum up what these **WebSockets** actually are. They are a simple way of establishing a **bi-directional** communication channel to a server. When such a connection is made, I as a user can update data on the server without having to make a full request, and the server can update my information about the rest of the website and its users at any time, without me having to specifically request it. There, it wasn’t too painful.

This connection can serve for so many different use cases - it can come especially handy when making chat and messenger apps, but also for content management systems that are likely to have a lot of admins connected at once, games and generally **all real-time applications** that should provide easy interaction among users.

#Why should we use WebSockets?

No matter how much it’d make our lives easier when we’re building such apps, this API stays one of the cool technologies that are relatively [widely supported][caniuse] by browsers yet we don’t see them used very often. They’ve been around for so long ([since 2010][ws-spec] when they were first introduced to webkit browsers) so it’s really rather bizarre they never made it to web development mainstream.

I wanted to give them a go anyway - to learn more about them not only theoretically but also to test it myself, using the typical coding standards and workflow as I’m used to, and see if I could implement them later on in my work without too much hassle.

It sometimes was really difficult to find coherent information on WebSockets, and that’s why I decided to write these notes to summarise what I've learnt and maybe help someone out there with getting a smooth intro into the topic. As always, there are some pros to web sockets:

* It’s really **easy to implement** them and do pretty cool things with them
* If you don’t need to support IE8 or 9, you can use their **native implementation without polyfills**
* If you do need to support archaic browsers, you can still do so using one of numerous libraries

and some cons:

* There are some potential security issues (that’s probably one of the reasons why WebSockets never made it to the HTTP2 spec)
* They are **not very friendly to unit testing**
* They are not widely used so it might be tricky to trouble shoot and resolve issues

#Let’s talk about the good stuff

As I mentioned at the beginning of this article, I believe that the possibility of seeing real-time changes to data or content made by other users, is **absolutely crucial in making modern user-friendly web apps**. At the moment, we see way too often that content is out of date. Constantly requesting updates from server is so heavy on the network (which isn’t great if you want to do truly mobile-first apps) that a lot of developers give up and make sure their websites are rather performant than dynamic. WebSockets, the way they are defined now, are a very good (if not perfect) attempt to solve this on-going issue.

As easy as it is to use current [W3C WebSocket API][w3c], it’s really surprising so many people ignore it - or don’t even know that this technology exists. Here’s a proof that **implementing WebSockets is no rocket science**:


{% highlight javascript %}  
// Connect to an echo server; when connected, send a message and listen to the echo
    
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
{% endhighlight %}

And that’s it! You can **[see it in action here][demo]**.

That’s all you need to do in order to send messages to the server and receive data from it. This way, you can notify the user about any changes to the content they’re currently seeing on the page without having to make requests to the server all the time or without reloading the page.

#That’s all great but my client requires support for IE…

You can use WebSockets in **all modern browsers** you can think of, even in IE! The only exception is Opera Mini but let’s face it - it’s not  used by [too many users][opera-mini] so unless your app needs to be accessible by absolutely everyone, it’s fine to use the native API.

In case you do need to support Browsers-Which-Must-Not-Be-Named, you can either fallback to polling for updates or use one of the libraries that can do this for you - [Socket.IO][socket-io] or [SockJS][sock-js] to name a couple.

#Next steps

If you feel like trying WebSockets as well but aren’t sure how to begin, keep an eye on [my twitter][twitter] to see when **more articles are out**. I’d like to share with you some hands-on tutorials. We’ll start with that next time: implementation of W3C WebSockets with node server.

[github]:  http://github.com
[wiki-ws]: https://en.wikipedia.org/wiki/WebSocket
[caniuse]: http://caniuse.com/websockets
[ws-spec]: http://tools.ietf.org/html/draft-hixie-thewebsocketprotocol-75
[opera-mini]: https://www.netmarketshare.com/browser-market-share.aspx?qprid=1&qpcustomb=1
[socket-io]: http:/socket.io/
[sock-js]: https://github.com/sockjs
[twitter]: https://twitter.com/{{ site.twitter_username }}
[w3c]: http://www.w3.org/TR/2011/WD-websockets-20110929/
[demo]: /websockets/demo