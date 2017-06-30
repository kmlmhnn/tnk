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
let players = [];
let maxPlayers = 2, joinedPlayers = 0;
let clientSockets = [];

wss.on('connection', function connection(ws) {
	// Send initial game parameters
	clientSockets.push(ws);

	let player = {
		x : Math.floor(Math.random() * 640),
		y : Math.floor(Math.random() * 480)
	};
	players.push(player);


	ws.send(JSON.stringify({
		dim : canvasDimensions,
		bullet : bullet,
		player : player,
		id : joinedPlayers,
		max : maxPlayers
	}));

	ws.on('message', incoming(joinedPlayers));

	if(++joinedPlayers == maxPlayers){
		listener.close(function() {
			console.log('Stopped listening for new players.');
		});
	}
});

function incoming(id) {
	return function(data){
		console.log(id, data);
		players[id] = JSON.parse(data);
	};
}



const gameloop = require('node-gameloop');

// Gamestate updation
gameloop.setGameLoop(function(delta) {
	bullet.x += bullet.dx * delta;
	bullet.x %= canvasDimensions[0];
}, 1000 / 30);

// Periodically send updates to clients.
gameloop.setGameLoop(function() {
	for (let client of clientSockets) {
		client.send(JSON.stringify({
			bullet : bullet,
			players : players
		}));
	}
}, 50);


const listener = server.listen(8080, function listening() {
	console.log('listening on 8080...');
});
