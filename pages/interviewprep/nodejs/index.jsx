'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { FiArrowLeft, FiChevronDown } from 'react-icons/fi';
import styles from '../personal/personal.module.scss'; // reuse the same scss module (same classnames as PersonalQA)

const QUESTIONS = [
  {
    id: 1,
    question: 'What is Node.js? Where can you use it?',
    answer: `Node.js is a JavaScript runtime built on Google's V8 engine — it lets us run JavaScript outside the browser, mainly for backend and networking applications. Its core parts are written in C, C++, and JavaScript.

It's single-threaded, open-source, cross-platform, and uses an event-driven, non-blocking I/O model, which makes it fast and a great fit for real-time apps.

We commonly use it for REST APIs, real-time apps like chat, streaming apps, IoT backends, and microservices.`,
  },
  {
    id: 2,
    question: 'Why use Node.js?',
    answer: `A few solid reasons — it's fast because it runs on V8. Everything is async by default, so the main thread never sits idle waiting for I/O. There's a huge ecosystem — NPM has over a million packages, not just 50k. And it does non-blocking I/O, so it can handle a lot of concurrent connections efficiently with just one thread.`,
  },
  {
    id: 3,
    question: 'How does Node.js work?',
    answer: `In short — our JS code runs on a single main thread. When it hits something async, like a DB call or file read, it hands that task off to libuv, which either uses the OS directly or its own background thread pool. Once that task is done, the callback goes into a queue, and the event loop picks it up and runs it on the main thread. So the main thread never blocks, it just keeps looping and picking up finished work.`,
  },
  {
    id: 4,
    question: 'Why is Node.js single-threaded?',
    answer: `It's a design choice, not something forced by V8. Node runs our JavaScript on one main thread to keep things simple — no locks, no race conditions on shared memory. Heavy or blocking work is offloaded to libuv's background thread pool or the OS, so we still get good performance without the complexity of multi-threaded programming.`,
  },
  {
    id: 5,
    question: 'Why does Node.js use the V8 engine?',
    answer: `V8 is Google's open-source JavaScript engine, written in C++, originally built for Chrome. Node picked it because it's extremely fast — it compiles JS directly to machine code instead of just interpreting it — and it's actively maintained by Google. That performance is a big reason Node.js became popular for server-side code.`,
  },
  {
    id: 6,
    question: 'If Node.js is single-threaded, how does it handle concurrency?',
    answer: `Node internally uses a library called libuv to manage all the async work. libuv gives Node the event loop, plus a background thread pool — 4 threads by default — for things like file operations, DNS lookups, and some crypto work. So our JS code stays on one thread, but the heavy lifting happens in the background, and results come back through the event loop.`,
  },
  {
    id: 7,
    question: 'How is Node.js most frequently used?',
    answer: `It's widely used for real-time chat applications, IoT backends, complex single-page applications, real-time collaboration tools like Google Docs style apps, streaming applications, and microservices architecture.`,
  },
  {
    id: 8,
    question: 'Explain the difference between frontend and backend development.',
    answer: `Frontend is the client side — everything the user actually sees and interacts with in the browser, built with HTML, CSS, JavaScript, and frameworks like React or Angular.

Backend is the server side — it runs behind the scenes, handles business logic, and talks to the database. It's built using things like Node.js, Java, or Python.`,
  },
  {
    id: 9,
    question: 'What is NPM?',
    answer: `NPM stands for Node Package Manager. It's the default package manager for Node.js — we use it to install, update, and remove third-party libraries and packages in our project, and it also manages our project's dependencies through package.json.`,
  },
  {
    id: 10,
    question: 'What are the modules in Node.js?',
    answer: `Node.js ships with several built-in modules for common functionality. A few important ones:

http — to create servers and handle HTTP requests/responses.
fs — for file system operations like reading and writing files.
util — utility functions that help with debugging and formatting.
url — for parsing and working with URLs.
querystring — for parsing query strings.
stream — for handling streaming data efficiently.`,
  },
  {
    id: 11,
    question: 'Why is Node.js preferred over other backend technologies like Java and PHP?',
    answer: `A few reasons come to mind — it's fast since it's built on V8. NPM gives us access to a massive number of ready-made packages. It's great for data-intensive, real-time apps because it never blocks waiting for a response. Since frontend and backend can both use JavaScript, code and knowledge sharing between teams becomes easier. And since it's just JavaScript, frontend developers can pick it up quickly.`,
  },
  {
    id: 12,
    question: 'What is the difference between Angular and Node.js?',
    answer: `Angular is a frontend framework, written in TypeScript, used to build single-page client-side applications, and it follows an MVC-style structure.

Node.js is a server-side runtime, built on C and C++ under the hood, used to build fast and scalable backend services that talk to databases and serve APIs.

Basically — Angular runs in the browser, Node runs on the server.`,
  },
  {
    id: 13,
    question: 'What is CORS and body-parser in Node.js?',
    answer: `CORS — Cross-Origin Resource Sharing — is a browser security feature that blocks a webpage from calling an API on a different domain unless that domain explicitly allows it. So if my frontend is on domain A and it wants to call an API on domain B, the browser blocks it by default — unless domain B's server sends the right CORS headers allowing that origin. In Express, we just do app.use(cors()) and can restrict it to specific origins if needed.

body-parser is middleware that reads and parses the incoming request body — like JSON or form data — before our route handler gets it, so we can directly access it as req.body. In modern Express, this is actually built in via express.json().`,
  },
  {
    id: 14,
    question: 'What are some of the most commonly used libraries in Node.js?',
    answer: `Two that come up constantly — Express, which is a lightweight web framework for building APIs and web apps, and Mongoose, which makes it easy to connect to and work with MongoDB using schemas and models.`,
  },
  {
    id: 15,
    question: 'What is the command used to import external libraries?',
    answer: `We use the require() function — for example, const http = require('http') loads the http module. In newer Node projects with ES modules enabled, we'd use import instead, like import http from 'http'.`,
  },
  {
    id: 16,
    question: 'What does event-driven programming mean?',
    answer: `Node.js follows an event-driven, non-blocking model — operations run asynchronously and communicate through events instead of blocking the thread. It uses the EventEmitter module, where something emits an event and a listener reacts to it.

A simple real-world way to explain it — think of a food ordering app. When a customer places an order, an "orderPlaced" event fires, the kitchen listens for that event and starts cooking. Once it's ready, an "orderReady" event fires, and the waiter picks it up. Nobody's sitting there blocking and waiting — things just react when the right event happens.`,
  },
  {
    id: 17,
    question: 'What is Event and EventEmitter in Node.js?',
    answer: `Node.js lets us create and handle our own custom events using the built-in events module. That module gives us the EventEmitter class, which we can use to emit events and register listeners for them — it's the foundation of Node's event-driven style.`,
  },
  {
    id: 18,
    question: 'What is an event listener?',
    answer: `An event listener is basically a function that waits for a specific event to happen and then runs — like a click, a keypress, or in Node's case, a custom emitted event.

In the browser, we register one using element.addEventListener('click', handlerFunction). In Node, it's emitter.on('eventName', callback). Either way, the idea is the same — register a callback, and it runs whenever that event actually fires.`,
  },
  {
    id: 19,
    question: 'What is the Event Loop in Node.js?',
    answer: `JavaScript is single-threaded, which means it can execute only one task at a time. Synchronous code is executed directly in the Call Stack.
    
    However, for asynchronous operations such as API calls, database queries, file reading, or timers, JavaScript does not execute them itself. Instead, it delegates these tasks to Browser APIs or Node.js's libuv.
     
     Once the asynchronous operation is completed, its callback is placed into a queue. If it's a Promise, the callback goes into the Microtask Queue. If it's a setTimeout, I/O operation, or another timer-related task, it goes into the Macrotask Queue. When the Call Stack becomes empty, the Event Loop first checks the Microtask Queue and executes all pending microtasks.
     
     After that, it processes tasks from the Macrotask Queue. This event-driven architecture allows JavaScript to remain non-blocking and efficiently handle thousands of concurrent requests, even though the language itself is single-threaded.`,
  },
  {
    id: 20,
    question: 'What is the package.json file?',
    answer: `package.json holds the metadata for a Node project — things like the project name, version, description, author, scripts, and most importantly, the list of dependencies the project needs. It sits in the root of every Node project.`,
  },
  {
    id: 21,
    question: 'What is the package-lock.json file?',
    answer: `package-lock.json locks down the exact version of every package installed — including nested dependencies. It makes sure that if someone else installs the project, they get the exact same dependency tree, avoiding "works on my machine" issues.`,
  },
  {
    id: 22,
    question: 'What is the Express package?',
    answer: `Express is a lightweight, open-source web framework for Node.js — free under the MIT license. It gives us a simple, flexible way to build web servers and REST APIs — handling routing, middleware, and request/response much more easily than using raw Node's http module.`,
  },
  {
    id: 23,
    question: 'What is nodemon?',
    answer: `Nodemon is a dev tool that watches our files and automatically restarts the Node server whenever it detects a change — so we don't have to manually stop and restart the server every time we edit code. It's only meant for development, not production.`,
  },
  {
    id: 24,
    question: 'What is the difference between dependencies and devDependencies?',
    answer: `dependencies are packages our app actually needs to run in production — like express or mongoose. devDependencies are only needed during development — like nodemon, testing libraries, or linters — they're not shipped to production.`,
  },
  {
    id: 25,
    question: 'What is a cluster in Node.js?',
    answer: `Node runs on a single thread, so by default it only uses one CPU core. The Cluster module lets us fork multiple child processes — called workers — from a single master process, and all of them share the same server port. This lets us use all the CPU cores on the machine to handle more requests.

Each worker has its own event loop, memory, and V8 instance — so they don't share state directly. Some useful cluster APIs: fork() creates a new worker, isMaster/isWorker tell us what type of process we're in, worker.send() lets processes message each other, and worker.kill() stops a worker.`,
  },
  {
    id: 26,
    question: 'How would you enhance Node.js performance?',
    answer: `Since Node runs on a single core by default, the main way is using the Cluster module or a process manager like PM2 to spin up multiple instances — one per CPU core — each with its own event loop. There's a master process that manages and monitors these worker processes. Beyond that — caching with Redis, offloading heavy computation to worker threads, and optimizing DB queries all help too.`,
  },
  {
    id: 27,
    question: 'What is fork in Node.js?',
    answer: `fork() is a method from the child_process module used to create a new child process — specifically for running another Node.js file. It creates a separate instance of the V8 engine, and sets up an IPC channel so the parent and child can exchange messages. It's commonly used to offload CPU-heavy work or scale using the cluster module.`,
  },
  {
    id: 28,
    question: 'What is a child process?',
    answer: `Node is single-threaded, so it can't handle heavy CPU work well on its own. The child_process module lets us spawn separate processes to run other programs or scripts, and communicate with them.

For example: const cp = require('child_process'); cp.exec('ls', (err, data) => { console.log(data); }); — this runs a shell command and gives us back the result.

There are four ways to create a child process — spawn(), fork(), exec(), and execFile().`,
  },
  {
    id: 29,
    question: 'What is the difference between spawn() and fork() method?',
    answer: `Both create child processes, but spawn() is more general — it can run any command and gives back output as a stream, which is great for large or continuous data.

fork() is specifically for running another Node.js file, and unlike spawn, it automatically sets up an IPC channel so the parent and child process can send messages back and forth easily.`,
  },
  {
    id: 30,
    question: 'What is the assert module?',
    answer: `assert is a built-in Node module used mainly for writing tests and sanity checks — it throws an AssertionError if a condition isn't met. Common methods include assert.equal() to check loose equality, assert.strictEqual() for strict equality, assert.deepEqual() to compare objects/arrays, and assert.throws() to check that a function throws an error.`,
  },
  {
    id: 31,
    question: 'What are streams in Node.js?',
    answer: `Streams let us read or write data piece by piece, continuously, instead of loading the whole thing into memory at once — like streaming a video instead of downloading the whole file first.

There are four types — Readable, for reading data; Writable, for writing data; Duplex, which can do both; and Transform, a duplex stream where the output is computed from the input, like a compression stream.

fs.readFile() loads the entire file into memory before giving it to us — simple, but slower and more memory-heavy for big files. fs.createReadStream() reads the file in small chunks, so it's faster and more memory-efficient, though a bit trickier to manage.

Every stream is actually an EventEmitter — it fires events like 'data' when a chunk is available, 'end' when there's no more data, 'error' if something goes wrong, and 'finish' once all data has been written out.`,
  },
  {
    id: 32,
    question: 'How do you install, update, and delete a dependency?',
    answer: `To install: npm install package-name. To update: npm update, or npm update package-name for a specific one. To remove: npm uninstall package-name.`,
  },
  {
    id: 33,
    question: 'How do you create a simple Hello World server in Node.js?',
    answer: `With plain Node — import the http module, use http.createServer() with a callback that takes request and response, write "Hello World" to the response, and call server.listen() on a port like 8080.

With Express, it's simpler:
const express = require('express');
const app = express();
app.get('/', (req, res) => res.send('Hello World'));
app.listen(3000, () => console.log('Server running on port 3000'));`,
  },
  {
    id: 34,
    question: 'What is REPL in Node.js?',
    answer: `REPL stands for Read, Evaluate, Print, Loop. It's basically the interactive console we get when we just type "node" in the terminal — we can type a single JS expression, it evaluates it immediately, and prints the result. Good for quickly testing small snippets of code.`,
  },
  {
    id: 35,
    question: 'What is the Buffer class in Node.js?',
    answer: `Buffer is used to handle raw binary data directly in memory — things like data coming from files, network sockets, or streams, before it's converted into a readable format. It's a global class in Node, so we don't even need to require it. It exists because JavaScript originally had no good way to work with binary data.`,
  },
  {
    id: 36,
    question: 'Explain the concept of middleware in Node.js.',
    answer: `Middleware is a function that sits between the incoming request and the final response. It gets access to req, res, and a next() function, and it runs after the server gets the request but before the route's actual logic sends back a response. We use it for things like logging, authentication checks, parsing request bodies, or handling errors — and we chain multiple middlewares using next().`,
  },
  {
    id: 37,
    question: 'What are the timing features in Node.js?',
    answer: `Node gives us three main timer functions:

setTimeout(callback, delay) — runs the callback once, after the given delay in milliseconds.
setInterval(callback, delay) — runs the callback repeatedly, every "delay" milliseconds, until we clear it.
setImmediate(callback) — runs the callback right after the current poll phase completes, in the check phase of the event loop — basically "run this as soon as possible, after I/O."`,
  },
  {
    id: 38,
    question: 'Difference between setImmediate() and process.nextTick()?',
    answer: `process.nextTick() runs its callback immediately after the current operation, before the event loop moves to its next phase — it has the highest priority. setImmediate() runs in the check phase, which comes after the poll/I/O phase. So in the same tick, nextTick will always run before setImmediate.`,
  },
  {
    id: 39,
    question: 'What is the purpose of __filename?',
    answer: `__filename gives us the absolute path of the file that's currently running — useful for logging or building file paths dynamically.`,
  },
  {
    id: 40,
    question: 'What is the purpose of __dirname?',
    answer: `__dirname gives us the absolute path of the directory that contains the currently running file — commonly used when building paths to other files, like path.join(__dirname, 'uploads').`,
  },
  {
    id: 41,
    question: 'Difference between authentication and authorization?',
    answer: `Authentication is about verifying who you are — like logging in with a username and password. Authorization is about what you're allowed to do once you're logged in — like whether you can access the admin panel or just your own profile.

Simple example — logging into your company email is authentication. Whether you can see HR's confidential files or not is authorization.`,
  },
  {
    id: 42,
    question: 'How do you validate data in Node.js?',
    answer: `The most common way is using the express-validator package — it lets us define validation and sanitization rules right in our route, and check things like required fields, email format, string length, etc. There's also Joi (from hapi), which is popular for schema-based validation. Both let us reject bad requests before they even hit our business logic.`,
  },
  {
    id: 43,
    question: 'What is ORM?',
    answer: `ORM stands for Object Relational Mapping. It's a technique that lets us interact with a relational database using objects and methods in our programming language, instead of writing raw SQL queries. Sequelize is a popular ORM for Node.js with SQL databases. For MongoDB, which is NoSQL, we usually call Mongoose an ODM instead, since it maps documents rather than relational tables.`,
  },
  {
    id: 44,
    question: 'How would you connect a MongoDB database to Node.js?',
    answer: `We typically use Mongoose:

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/myDatabase');

Mongoose then lets us define schemas and models on top of that connection to interact with our collections.`,
  },
  {
    id: 45,
    question: 'Which database is most commonly used with Node.js?',
    answer: `MongoDB is the most popular choice with Node.js. It's a NoSQL, document-oriented database — data is stored as JSON-like documents, which pairs naturally with JavaScript objects. It's also known for being highly scalable and flexible with schema design. That said, PostgreSQL and MySQL are also very common, especially when the data is more relational.`,
  },
  {
    id: 46,
    question: 'What is a debugger in Node.js?',
    answer: `Node has a built-in debugger we can use by running "node inspect app.js", which lets us step through code, set breakpoints, and inspect variables. In practice though, most of us just use the Chrome DevTools debugger or the debugger built into VS Code, which is much more convenient — we can set breakpoints directly in the editor and inspect the call stack visually.`,
  },
  {
    id: 47,
    question: 'What is the crypto module?',
    answer: `crypto is a built-in Node module for handling encryption, decryption, and hashing. We use it a lot for security — for example, hashing passwords before storing them in the database, generating secure random tokens, or creating HMAC signatures. It gives us classes like Hash, Hmac, Cipher, Decipher, Sign, and Verify.`,
  },
  {
    id: 48,
    question: 'What is the Passport module used for in Node.js?',
    answer: `Passport is an authentication middleware for Node.js. It supports many "strategies" — like local username/password login, Google OAuth, Facebook login, JWT-based auth, and more — and it plugs cleanly into Express to handle the sign-in flow without us writing all that logic from scratch.`,
  },
  {
    id: 49,
    question: 'What is StringDecoder?',
    answer: `StringDecoder is a built-in module used to convert Buffer data — raw binary — into readable strings. buffer.toString() can also do this, but StringDecoder specifically handles multi-byte UTF-8 characters correctly even when they're split across separate buffer chunks, which toString() can sometimes get wrong.`,
  },
  {
    id: 50,
    question: 'What is TLS/SSL?',
    answer: `TLS (and its older version SSL) is the protocol that encrypts data between a client and a server — it's what makes HTTPS secure. Node has a built-in tls module, built on top of OpenSSL, that we can use to create secure servers and connections: const tls = require('tls').`,
  },
  {
    id: 51,
    question: 'What is Redis?',
    answer: `Redis is an in-memory key-value data store — extremely fast because it works mostly in RAM. We commonly use it for caching, session storage, and as a message broker/pub-sub system.

Basic usage:
const redis = require('redis');
const client = redis.createClient();
client.on('connect', () => console.log('Connected!'));`,
  },
  {
    id: 52,
    question: 'How do you manage sessions in Node.js?',
    answer: `We usually use the express-session middleware. It stores session data server-side (or in a store like Redis) under a session ID, and only that session ID gets sent to the client as a cookie — not the actual data. This is more secure than storing everything in the cookie itself.`,
  },
  {
    id: 53,
    question: 'What is a JWT token?',
    answer: `JWT — JSON Web Token — is a compact, self-contained way to securely transmit data between client and server, commonly used for authentication. After login, the server signs a token with a secret key and sends it to the client. The client then sends that token with future requests, and the server verifies it instead of checking the database every time.

Example:
jwt.sign({ userId: 123 }, 'secretKey', { expiresIn: '1h' });
jwt.verify(token, 'secretKey', (err, decoded) => console.log(decoded));`,
  },
  {
    id: 54,
    question: 'What is GraphQL?',
    answer: `GraphQL is a query language for APIs, created by Facebook, that lets the client ask for exactly the data it needs — nothing more, nothing less — in a single request. This solves common REST problems like over-fetching or under-fetching data, and avoids having to hit multiple endpoints to gather related data. It uses a single endpoint, and the client sends a query describing the shape of the response it wants.`,
  },
  {
    id: 55,
    question: 'What is the difference between REST and SOAP APIs?',
    answer: `SOAP is a strict protocol — it transports data in XML format, relies on WSDL for defining its contract, and can work over multiple transport protocols like HTTP, SMTP, or XMPP. It's more rigid but has built-in support for things like security and transactions.

REST is more of an architectural style, not a strict protocol — it typically uses JSON, is built around URIs and standard HTTP methods like GET, POST, PUT, DELETE, and generally works over HTTP/HTTPS. It's lighter, simpler, and is what most modern APIs use today.`,
  },
  {
    id: 56,
    question: 'What are the common API methods?',
    answer: `GET — to fetch data. POST — to create new data. PUT — to fully update/replace a resource. PATCH — to partially update a resource. DELETE — to remove a resource.`,
  },
  {
    id: 57,
    question: 'What payment gateway integrations have you worked with?',
    answer: `[Personal answer — mention the actual gateways you've integrated, like Razorpay, Stripe, or PayPal, and briefly describe the flow: creating an order on the backend, redirecting or opening a checkout on the frontend, then verifying the payment signature/webhook on the backend before marking the order as paid.]`,
  },
  {
    id: 58,
    question: 'What is unit testing and how does it work?',
    answer: `Unit testing means testing the smallest pieces of our code — usually individual functions — in isolation, to make sure each one works correctly on its own. In Node, we typically use a testing framework like Jest or Mocha, write test cases that call a function with known inputs, and assert that the output matches what we expect. Good unit tests also mock external dependencies like databases or APIs, so we're only testing our own logic, not the network or DB.`,
  },
  {
    id: 59,
    question: 'What is Socket.IO in Node.js?',
    answer: `Socket.IO is a library for real-time, bidirectional communication between client and server, built on top of WebSockets with fallback options. Unlike regular HTTP requests, it keeps a persistent connection open, so either side can send data anytime without a new request being made. It's commonly used for chat apps, live notifications, online gaming, and collaborative tools — and it supports concepts like rooms and namespaces to group connections.`,
  },
  {
    id: 60,
    question: 'How does Node.js work internally? (detailed)',
    answer: `Node runs our JavaScript on a single thread, but it gives us the feel of doing multiple things at once through smart use of async patterns and background processing.

Two core ideas make this work — non-blocking I/O and asynchronous callbacks. Non-blocking I/O means the main thread doesn't wait around for file, network, or database operations to complete — it moves on to handle other work. Asynchronous callbacks mean that once an operation finishes, its result comes back through a callback function, which the event loop then picks up and runs when the thread is free.

Behind the scenes, this is all powered by libuv, a C library that gives Node two key pieces — the Event Loop and a Thread Pool.

The Event Loop is what keeps checking: are there any completed callbacks waiting to run? If yes, it runs them. It cycles through fixed phases — timers, pending callbacks, poll (where most I/O is handled), check (setImmediate), and close callbacks — and clears the microtask queue between each phase.

The Thread Pool, 4 threads by default, is used for tasks that can't be handled async at the OS level directly — things like file system operations, some crypto functions, and DNS lookups. So a "blocking-style" task actually gets handed off to one of these background threads instead of blocking our main thread.

So the flow is — request comes in, if it needs I/O, Node hands it off to libuv, and immediately moves to the next task. Once libuv finishes, it queues the callback, and the event loop runs it when it gets a chance. That's how Node handles thousands of concurrent operations on just one main thread.`,
  },
  {
    id: 61,
    question: 'How do you handle errors in Node.js?',
    answer: `A few layers to it — for sync code, we use try/catch. For Promises, we use .catch() or wrap async/await code in try/catch. For Express apps, we set up centralized error-handling middleware — a function with four parameters (err, req, res, next) — so all errors, from any route, end up in one place and get a consistent response instead of crashing the server.

For things outside normal request handling, like unexpected exceptions, we can also listen to process-level events like uncaughtException and unhandledRejection as a last safety net — though the better approach is to actually catch and handle errors where they happen rather than relying on those.`,
  },
];


function AccordionItem({ item, isOpen, onToggle }) {
  const bodyRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (bodyRef.current) {
      setHeight(isOpen ? bodyRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const lines = item.answer.split('\n').filter((l) => l.trim() !== '');

  return (
    <div className={`${styles.item} ${isOpen ? styles.open : ''}`}>
      <button className={styles.question} onClick={onToggle} aria-expanded={isOpen}>
        <span className={styles.badge}>{String(item.id).padStart(2, '0')}</span>
        <span className={styles.questionText}>{item.question}</span>
        <FiChevronDown className={styles.chevron} aria-hidden="true" />
      </button>

      <div
        className={styles.answerWrap}
        style={{ height: `${height}px` }}
        aria-hidden={!isOpen}
      >
        <div className={styles.answerInner} ref={bodyRef}>
          <div className={styles.answerBody}>
            {lines.map((line, i) => {
              if (line.startsWith('•')) {
                return (
                  <div key={i} className={styles.bulletRow}>
                    <span className={styles.dot} aria-hidden="true" />
                    <p>{line.replace('•', '').trim()}</p>
                  </div>
                );
              }
              return <p key={i} className={styles.para}>{line}</p>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NodeJsQA() {
  const [openId, setOpenId] = useState(null);

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <Link href="/" className={styles.back}>
          <FiArrowLeft size={15} />
          Back
        </Link>

        <div className={styles.header}>
          <span className={styles.headerEyebrow}>Interview preparation</span>
          <h1 className={styles.headerTitle}>Node.js — Event Loop &amp; Concurrency</h1>
          <p className={styles.headerSub}>
            {QUESTIONS.length} questions — click to reveal answers
          </p>
        </div>

        <div className={styles.list}>
          {QUESTIONS.map((q) => (
            <AccordionItem
              key={q.id}
              item={q}
              isOpen={openId === q.id}
              onToggle={() => toggle(q.id)}
            />
          ))}
        </div>

      </div>
    </div>
  );
}