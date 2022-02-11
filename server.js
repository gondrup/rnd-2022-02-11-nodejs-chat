const http = require('http');
const { URLSearchParams } = require('url');
const { EventEmitter } = require('events');

const hostname = '127.0.0.1';
const port = 3000;

let messages = [];
const events = new EventEmitter();

const server = http.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    
    switch (req.url) {
        case '/ping':
            res.statusCode = 200;
            res.end('pong');
            break;
        case '/send':
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            const params = new URLSearchParams(data);

            if (!params.has('message')) {
                res.statusCode = 400;
                res.end('You must include a message');
            } else {
                events.emit('new-message', params.get('message'));
                res.end('Message sent!');
            }
            break;
        case '/subscribe':
            events.addListener('new-message', (message) => {
                res.statusCode = 200;
                res.end(message);
            });

            break;
        default:
            res.statusCode = 404;
            res.end('Page not found');
            break;
    }
});

events.addListener('new-message', (message) => {
    messages.push(message);
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
