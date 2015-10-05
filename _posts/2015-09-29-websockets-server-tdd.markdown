---
layout: post
title:  "TDD of NodeJS WebSocket Server Using Grunt, Mocha, Sinon, Chai, and Rewire"
categories: WebSockets
permalink: /websockets/tdd-nodejs-websocket-server-grunt-mocha-sinon-chai-rewire.html
---
The title sounds like a pretty long sequence of swear words, doesn't it? I thought it might be best to say directly what we'll be dealing with here. Most WebSockets tutorials explain how to make things work. But no matter how hard I searched, I couldn't find a suitable source explaining how to tackle **test driven development** when working with this API. In this article, I'd like to share my journey of learning **WebSockets** while sticking to TDD with you.

We'll be talking about a very specific set-up for testing WebSocket server using some popular tools such as **mocha and sinon**. I'm sure you can find it helpful even if you're using different set-up though. Most of the times, the problems you will face can be aproached in a very similar way, no matter what particular solution you are using.

#Libraries and Packages

I decided to use this particular set-up for TDD after years of writing and debugging tests; partly out of convenience (it's what I'm used to), partly because experience taught me to be careful about **how to write tests**. Let me elaborate a little bit on why I chose some of these libraries; if you want to know how to code it, and trust my judgement, feel free to skip this section :)

First great rule when writing unit tests should be that all **dependencies are mocked**. It makes perfect sense if you imagine that you're running a test for your module and aren't really interested if other modules, and especially third-party dependencies are broken. I can't stress enough how crucial this point is; unless you've experienced the hell of trying to debug a test connected to 20 different modules, it's hard to appreciate this **life-saving principle**. When writing modules in Node, you can use [Rewire][rewire]'s getters and setters to set dependencies of the module you're testing.

[Karma][karma] (made by the [AngularJS][angular] team) is very popular for **running JS tests**, no matter if it is for specific framework or "plain" javascript files. Although that's the test framework I've always used while working within team, I've recently realised it has its downsides and wanted to try [Mocha][mocha] for a change. Karma tests are all **browser-based**. If you work in a team of 5 people, and each has a preference for different browser in various versions, you sometimes end up with tests failing on your machine and working perfectly fine elsewhere (and vice versa). That's why I chose Mocha that CAN be run in a browser but it also works well in the terminal.

Using the rest is really a **matter of habit**. I've been working with these tools for years and never had any problem with them - so why complicate things?

#NPM

When starting a new project, I like beginning with setting things up so that I don't have to worry about them at a later stage. Let's start by sketching what **dependencies** we'll need: obviously **Mocha, Grunt and Load-Grunt-Tasks** (to run the tests), **Sinon, Chai, and Rewire**.

{% highlight json %}
{
    "devDependencies": {
        "chai": "^2.3.0",
        "grunt": "0.4.5",
        "grunt-mocha-test": "^0.12.7",
        "load-grunt-tasks": "^3.1.0",
        "mocha": "^2.2.4",
        "rewire": "^2.3.4",
        "sinon": "^1.14.1"
    },
    "dependencies": {
        "websocket": "^1.0.19"
    }
}
{% endhighlight %}

The only **production dependency** we require is the [websocket library][websocket-library] introduced in [one of the previous articles][server-tutorial].

#Grunt Up

We'll be using **Grunt to run Mocha tests**. I chose it over [MakeFile][makefile] just because Grunt is normally used for minifying and jshint and didn't want to introduce something new. Our **Gruntfile.js** will be very thin for this particular task:

{% highlight javascript %}
module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        mochaTest: {
            src: ['src/*.spec.js'],
            options: {
                reporter: 'spec'
            }
        }
    });

};
{% endhighlight %}

It only asks Mocha to load specs of our modules, and use a "beautified" output in terminal when we're running the tests (that's what the **reporter option** is for).

#Run It

After you do you `npm install`, you can run `grunt mochaTest` and see everything green and passing - that is, the 0 tests that we've written!

#Basic Server

To begin with, we need to start by creating a **basic server** that will always **return 404**, no matter what request we send it. This is how a sketch of the spec could look:

{% highlight javascript %}
/**
 * server.spec.js
 * Basic server test suite
 */
'use strict';

describe('server', function() {
    var sinon = require('sinon');
    var expect = require('chai').expect;

    it('should return a 404 response');
});
{% endhighlight %}

When **writing the test**, we'll use the server from our module, and send it an http request and check that it returns **status code 404**.

{% highlight javascript %}
describe('server', function() {
    var sinon = require('sinon');
    var expect = require('chai').expect;
    var http = require('http');
    //given you have created server.js file in the same folder
    var server = require('./server');

    it('should return a 404 response', function(done) {
        //create server, and make it listen on port 8181
        server().listen(8181);

        //send request to our server
        http.get('http://localhost:8181', function(res) {
            expect(res.statusCode).to.equal(404);
            done();
        });
    });
});
{% endhighlight %}

If you haven't bumped into `done()` yet, here's a quick explanation for it. Http requests are **asynchronous**, and so we need to let the test know it has to wait for a response. The function `done` says "wait 2 seconds and if done() has not been run, the test failed". If you would've removed `done()`, this test will be passing even though we haven't written the module yet!

If you now run the tests, you'll see something like this:

{% highlight javascript %}
0 passing (8ms)
1 failing

1) server should return a 404 response:
    TypeError: object is not a function
    at Context.<anonymous> (server.spec.js:10:9)
{% endhighlight %}

Step by step, **let's make it pass**. I suppose we should start by exporting a function in `server.js`.

{% highlight javascript %}
/**
 * server.js
 * Basic server returning 404
 */
'use strict';

module.exports = function() {};
{% endhighlight %}

When we run it, we find out we're still missing something.

{% highlight javascript %}
0 passing (7ms)
1 failing

1) server should return a 404 response:
   TypeError: Cannot call method 'listen' of undefined
    at Context.<anonymous> (src/server.spec.js:10:18)
{% endhighlight %}

That tells us this function should return an http server. Let's make it:

{% highlight javascript %}
var http = require('http');

module.exports = function() {
    return http.createServer();
};
{% endhighlight %}

So we have a server now but we're not getting any response from it.

{% highlight javascript %}
0 passing (2s) //notice the 2s timeout
1 failing

1) server should return a 404 response:
     Error: timeout of 2000ms exceeded. Ensure the done() callback is being called in this test.
{% endhighlight %}

We'll tell the server then to always return 404:

{% highlight javascript %}
return http.createServer(function(request, response) {
    response.writeHead(404);
    response.end();
});
{% endhighlight %}

And we're done!

{% highlight javascript %}
1 passing (16ms)
{% endhighlight %}

#One to Rule Them All

The way we wrote the code has one drawback however. We are creating a **new instance of server** every single time someone asks for it. Shouldn't we always **return the same instance** though? Let's write a test for that, in the same `describe` block as the previous one.

{% highlight javascript %}
it('should only be created once', function() {
        //it's a little hacky but hey - it does what we need
        var instance = server();
        instance.nonsense = 'anything';

        expect(server().nonsense).to.equal('anything');
    });
});
{% endhighlight %}

That fails as expected:

{% highlight javascript %}
1 passing (18ms)
1 failing

1) server, should only be created once:
    AssertionError: expected undefined to equal 'anything'
    at Context.<anonymous> (src/server.spec.js:22:38)
{% endhighlight %}

We can tweak our code in a way that gets the server created only if it wasn't created before.

{% highlight javascript %}
'use strict';
var http = require('http');
var server;

module.exports = function() {
    if (!server) {
        server = http.createServer(function(request, response) {
            response.writeHead(404);
            response.end();
        });
    }
    return server;
};
{% endhighlight %}

Voila!

{% highlight javascript %}
2 passing (18ms)
{% endhighlight %}

#WebSocket Server

The server we created above was a warm-up excercise - now we get down to **the real thing**. Here's a spec of what we want to achieve:

{% highlight javascript %}
'use strict';

describe('websocket server:', function() {
    var sinon = require('sinon');
    var expect = require('chai').expect;

    describe('server', function() {
        it('creates http server');
        it('starts listening at port 8080');
        it('creates a new WebSocket server on top of the http server');
        it('gets returned by the init function');
    });

    describe('when it receives a message from client,', function() {
        it('sends echo of the message back');
    });
});
{% endhighlight %}

We can start by selecting `.only` the first test, and getting that one to pass.

{% highlight javascript %}
it.only('creates http server');
{% endhighlight %}

And here comes the fun part! Our `websocket-server.js` will require `server.js`. But by no means we want to test `server.js` here - we've already done that! This is where [rewire][rewire] comes in as an irreplacable helper. We'll get `websocket-server` with **rewire**, and set **our own http server** as the base.

{% highlight javascript %}
//we require also these modules
var http = require('http');
var rewire = require('rewire');
var WebSocketServer = rewire('./websocket-server'); //notice rewiring
{% endhighlight %}

Mocking the http server is required before every test. It'll be better to use `beforeEach` to set things up instead of directly in our spec. We can also initialise the tested server directly here as we also need to do that before every test.

{% highlight javascript %}
//complete list of dependencies inside our describe block
var sinon = require('sinon');
var expect = require('chai').expect;
var http = require('http');
var rewire = require('rewire');
var WebSocketServer = rewire('./websocket-server');
var ws = require('websocket');

var httpServer;
var httpServerStub;
var server;

beforeEach(function() {
    //mock basic server
    httpServer = http.createServer(function(request, response) {
        response.end();
    });
    sinon.spy(httpServer, 'listen');
    httpServerStub = sinon.stub().returns(httpServer);
    WebSocketServer.__set__('Server', httpServerStub);

    //initialise tested server
    server = WebSocketServer.init();
});
{% endhighlight %}

A few words of explanation: we create http server, and (because our basic server is a function) also a **stub that returns this server**. Finally, we set our module variable to be this stub.

#Creating HTTP server and listening at port 8080

After such thorough preparation, the test itself will be very simple:

{% highlight javascript %}
it.only('creates http server', function() {
    expect(httpServerStub.called).to.equal(true);
});
{% endhighlight %}

In `beforeEach`, our code expects the WebSocket server to have an init function exported in the module. We can add that and module's dependencies  before running the test for the first time.

{% highlight javascript %}
/**
 * websocket-server.js
 * Simple echo WebSocket NodeJS server
 */
var Server = require('./server');
var WebSocketServer = require('websocket').server;

function init() {}

module.exports = {
    init: init
};
{% endhighlight %}

Running the test, we get an assertion error:

{% highlight javascript %}
0 passing (9ms)
1 failing

1) websocket server: creates http server:
    AssertionError: expected false to equal true
{% endhighlight %}

After creating http server from our previous made module...

{% highlight javascript %}
function init() {
    var server = Server();
}
{% endhighlight %}

...the test passes.

{% highlight javascript %}
1 passing (7ms)
{% endhighlight %}

The second test is very similar to this one - we'll only need to check that this server starts listening at port 8080. Deleting `.only` at the first test and adding it to the second one, we get:

{% highlight javascript %}
it.only('starts listening at port 8080', function() {
    expect(httpServer.listen.calledWith(8080)).to.equal(true);
});
{% endhighlight %}

To make this test pass, we only make a small change:

{% highlight javascript %}
function init() {
    var server = Server().listen(8080);
}
{% endhighlight %}

And we see another test turn green.

{% highlight javascript %}
1 passing (9ms)
{% endhighlight %}

#Creating WebSocket Server

Our next test is a little bit more tricky because we need to set a few more things up before initialising the server. Namely, we'll need to set a spy on the library server so that we can track that it was initialised with the right parameters.

In the `beforeEach` block we've written, add a spy to the library server and re-set the module variable so that it gets updated with the newer version. This needs to happen before initialising our server.

{% highlight javascript %}
//mock basic server...

//spy on library server
sinon.spy(ws, 'server');
WebSocketServer.__set__('WebSocketServer', ws.server);

server = WebSocketServer.init();
{% endhighlight %}

We're now setting a spy on a library function before every test but we're never removing. That'd cause problems when running other tests. We'll restore the module to its original status `afterEach` test.

{% highlight javascript %}
afterEach(function() {
    ws.server.restore();
});
{% endhighlight %}

And finally the test itself will be rather simple again:

{% highlight javascript %}
it.only('creates a new WebSocket server on top of the http server', function() {
    expect(ws.server.calledWith({
        httpServer: httpServer
    })).to.equal(true);
});
{% endhighlight %}

The library server needs to be called with a parameter `httpServer` which is linked to the basic server, or in this case the mock of it. Too many servers in the game huh?

Only a small change in the code is required to make the test pass:

{% highlight javascript %}
function init() {
    var server = Server().listen(8080);
    var webSocketServer = new WebSocketServer({
        httpServer: server
    });
}
{% endhighlight %}

And we're green again!

{% highlight javascript %}
1 passing (11ms)
{% endhighlight %}

This specific test is an example where we need to write a lot of code in the spec file in order to write one (indented 3 lines) of "actual" code to make it pass. No matter how crazy that seems though, writing tests is still super-useful and we shouldn't be daunted by this.

#Return

We all know that every function simply *needs* to return something, right? Well maybe not every single one but initialisation of a server probably should.

{% highlight javascript %}
//remember to remove ".only" from the previous test
it.only('gets returned by the init function', function() {
    expect(server).to.include.keys('domain', 'connections', 'pendingRequests', 'config');
});
{% endhighlight %}

In this test we're just checking that we're getting our new server returned after initialisation by testing that it has the right parameters a WebSocket server should have. Of course that's a little hacky but it's just about the simplest way to do this. It's also hard to imagine a real-life example where this test would pass if we didn't return the right thing.

Here's the whole `init()` function that gets this test passing like the others:

{% highlight javascript %}
function init() {
    var server = Server().listen(8080);
    var webSocketServer = new WebSocketServer({
        httpServer: server
    });

    return webSocketServer;
}
{% endhighlight %}

#Server Done - Or Is It?

Running all tests we've written for the WebSocket server, a sudden wall of errors hits us. At the bottom of the issues is this:

{% highlight javascript %}
1) websocket server: "before each" hook:
    Uncaught Error: listen EADDRINUSE
{% endhighlight %}

That means that we're trying to listen on a port that is already taken. Although it seems like a lot of trouble, the solution is immediately at hand.If we close the httpServer every time, we free the port 8080 again and the next tests can use it again.

We'll do that in an `afterEach` block:

{% highlight javascript %}
afterEach(function() {
    ws.server.restore();
    httpServer.close();
});
{% endhighlight %}

We see all tests are now passing - our server describe block is finished!

{% highlight javascript %}
websocket server:
  server
  ✓ creates http server
  ✓ starts listening at port 8080
  ✓ creates a new WebSocket server on top of the http server
  ✓ gets returned by the init function

4 passing (17ms)
{% endhighlight %}

That's all great but our server won't be able to do much apart from running. In the next section, we'll have a look at the last test: "if I send a message to the server, I receive an echo of it back".

#Echoing Messages

This part was the tricky one that made me stop my efforts of developing and sent me for weeks on StackOverflow and Google looking for **the perfect solution**. After a couple of weeks, I concluded it simply doesn't exist.

We've gone to quite some measure to make sure that all our dependencies are mocked. Theoretically, we should test the message by running the server in some sort of a **sandbox**, testing what outputs it has if we give it certain input. Eg if I send it a message, it sends me the same message back.

Unfortunately, that sort of **dependency mocking is not possible**. And that's why we now have to drop all good intentions and get our hands dirty with testing server by creating a WebSocket. This socket sends a message to the server and checks that this socket receives the right information back.

{% highlight javascript %}
describe.only('when it receives a message from client,', function() {
    it.only('sends echo of the message back', function(done) {
        //create a WebSocket
        var socket = new ws.w3cwebsocket('ws://localhost:8080', 'plain-text');
        var message = 'This is the message';

        //send message to server once it's open
        socket.onopen = function open() {
            socket.send(message);
        };

        //check that we then get the same message back
        socket.onmessage = function check(response) {
            expect(response.data).to.equal(message);
            done();
        };
    });
});
{% endhighlight %}

It's not the shortest test ever but it's pretty straightforward in what it does. Once you know the concept, it's actually very easy to apply it to any similar problem.

In the server code, we wait for a socket to connect (checking that it has the right sub-protocol), and then wait for a message form it. When it send us something, we send it right back.

We'll add this to out init function:

{% highlight javascript %}
webSocketServer.on('request', function(request) {
    var socket = request.accept('plain-text');

    socket.on('message', function(message) {
        socket.sendUTF(message.utf8Data);
    });
});
{% endhighlight %}

When running the test, we see it passing; it's interesting to note that the time for this test is much higher than normally. Testing servers this way really isn't ideal and I hope that a more slick solution will be soon found.

{% highlight javascript %}
1 passing (26ms)
{% endhighlight %}

#All Together

Now comes the dreaded and sometimes elevating moment of running all tests at once. Remove `.only` and see what it does.

{% highlight javascript %}
websocket server:
    server
      ✓ creates http server
      ✓ starts listening at port 8080
      ✓ creates a new WebSocket server on top of the http server
      ✓ gets returned by the init function
    when it receives a message from client,
      ✓ sends echo of the message back

5 passing (41ms)
{% endhighlight %}

It's like magic! All tests are passing and if you now try this server out, you'll see it works as expected.

Have a look at my [demo repository][demo] with all the code written above to see the whole picture.

#That's All Folks

With this tutorial at end, I've exhausted all topics I wanted to write about in this series. There are so many amazing sources on WebSockets if you want to know more and there's no point in repeating what other (infinitely smarter) people have written.

Check out [my github repository][repo] of my slightly more complex WebSocket testing project fi you want to get an inspiration of what you could write.

If you have any questions, comments or just want to chat, get in touch! See below my contact details.

PS: If you know of testing servers without having to send them requests please let me know!

[server-tutorial]: {% post_url 2015-09-28-websockets-server %}
[websocket-library]: https://www.npmjs.com/package/websocket
[rewire]: https://github.com/jhnns/rewire
[karma]: http://karma-runner.github.io/
[angular]: https://angularjs.org/
[mocha]: http://mochajs.org/
[makefile]: http://stackoverflow.com/questions/14613642/how-to-run-the-make-command-for-mocha-test-for-node-js-application
[repo]: https://github.com/lithin/web-sockets
[demo]: https://github.com/lithin/tdd-websockets-demo