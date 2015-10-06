---
layout: post
title:  "WebSocket Bonus - Chat Server And Client"
categories: WebSockets
permalink: /websockets/websocket-bonus-chat.html
---
**WebSockets** are technology ideal for **real-time tasks** - such as a chat room (we all used to know them in the 90s before Facebook). I learnt how to work with the API by building a sample chat, using **NodeJS** for both client and server-side code. I'd like to share the result with you and a few last notes in this bonus article.

#Inspiration

As I wrote earlier, I'd wanted to try **WebSocket API** for ages. Then I finally got around to buying a great [book by Andrew Lombardi][book] that not only explains **how it works** but also shares a few tutorials and ideas. I took his example of a chat and decided to modify it to fit my work style.

#Development

One thing that Andrew didn't really talk about in his book was TDD. That was the only flaw of his book, as I find **test driven development** pretty crucial whenever working on any bigger feature. And although I knew my test project wouldn't need to be scalable or really good in any way, I wanted to do it properly to learn how I could eventually use WebSockets at work.

From that decision, a few requirements stemmed such as using another **Node** library for WebSockets. I also wanted the whole project to be in Node, not only server-side, so I needed to use **browserify** and a few other libraries to help me create something managable and useful.

#Result

It was pretty **tricky to figure out how to do TDD** when using Node AND WebSockets but I got there in the end. WebSocket API itself is very straightforward and easy to use, and all libraries have pretty good documentation.

Have a look at the **code I wrote** in [my github repo][repo]. If you follow the readme, you can check the project out and run it, modify it, do anything with it - and please share you results ;)

[book]: http://shop.oreilly.com/product/0636920030485.do
[repo]: https://github.com/lithin/web-sockets