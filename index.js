"use strict";

const express = require('express');
const app = express();

app.use(express.static('client'));

const http = require('http');
const server = http.createServer(app);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });


// Globals
const canvasDimensions = [ 640, 480 ];
let bullet = { x: 100, y : 100, dx : 1000, dy : 0 }; // dx = 1 pixel per sec
let player = { x : 0, y : 0 };
let clients = [];

wss.on('connection', function connection(ws) {
	// Send initial game parameters
	clients.push(ws);
	ws.send(JSON.stringify({
		dim : canvasDimensions,
		bullet : bullet,
		player : player
	}));

	ws.on('message', incoming);
});

function incoming(data) {
	console.log(data);
}



const gameloop = require('node-gameloop');

// Gamestate updation
gameloop.setGameLoop(function(delta) {
	bullet.x += bullet.dx * delta;
	bullet.x %= canvasDimensions[0];
}, 1000 / 30);

// Periodically send updates to clients.
gameloop.setGameLoop(function() {
	for (let client of clients) {
		client.send(JSON.stringify({
			bullet : bullet,
			player : player
		}));
	}
}, 50);


server.listen(8080, function listening() {
	console.log('listening on 8080...');
});
