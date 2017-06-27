"use strict";

const express = require('express');
const app = express();

app.use(express.static('client'));

app.use(function (req, res) {
	res.send('hello');
});

const http = require('http');
const server = http.createServer(app);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
	console.log('ws: ', ws);
	console.log('req: ', req);

	ws.on('message', function incoming(data) {
		console.log('data: ', data);
	});

	ws.send('Hello World');
});

server.listen(8080, function listening() {
	console.log('listening on 8080...');
});
