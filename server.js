const http = require('http');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');
const { EventEmitter } = require('events');

const hostname = '127.0.0.1';
const port = 3000; 

let messages = [];
let listeningRequests = [];
const events = new EventEmitter();

const server = http.createServer(async (req, res) => {
    switch (req.url) {
        case '/':
            res.statusCode = 200;
            res.setHeader('Content-Type', 'text/html');
            const html = fs.readFileSync(path.join(__dirname, 'client.html'));
            res.end(html);
            break;
        case '/send':
            const buffers = [];
            for await (const chunk of req) {
                buffers.push(chunk);
            }
            const data = Buffer.concat(buffers).toString();
            const params = new URLSearchParams(data);

            if (!params.has('username')) {
                res.statusCode = 401;
                res.end('You are not authorised to use chat (no username)');
                break;
            }

            if (!params.has('message')) {
                res.statusCode = 400;
                res.end('You must include a message');
                break;
            }

            const date = Date.now();
            const username = params.get('username');
            const messageContent = params.get('message');

            const message = {
                id: `${username}-${date}`,
                username: username,
                message: messageContent,
                date: date
            };

            res.statusCode = 200;
            res.end();
            events.emit('new-message', message);
            
            break;
        case '/listen':
            listeningRequests.push({req: req, res: res});

            break;
        default:
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Page not found');
            break;
    }
});

events.addListener('new-message', (message) => {
    console.log(message);
    messages.push(message);

    console.log(`Pushing to ${listeningRequests.length} waiting requests...`);

    for (let listeningRequest of listeningRequests) {
        console.log('Ending request with json: ' + JSON.stringify(message));
        listeningRequest.res.statusCode = 200;
        listeningRequest.res.setHeader('Content-Type', 'application/json');
        listeningRequest.res.end(JSON.stringify(message));
    }
    listeningRequests = [];
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
