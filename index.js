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
let bullets = [];
let newBullets = [], remBullets = [];
let bulletId = 0; // For generating unique bullet ids
let players = [];
let maxPlayers = 2, joinedPlayers = 0;
let clientSockets = [];
let gameDuration = 60000 * 10; // 10 mins
let deaths = [];

wss.on('connection', function connection(ws) {
	// Send initial game parameters
	clientSockets.push(ws);

	let player = {
		x : Math.floor(Math.random() * 640),
		y : Math.floor(Math.random() * 480),
		sense : "-y"
	};
	players.push(player);
	deaths.push(0);


	ws.send(JSON.stringify({
		dim : canvasDimensions,
		player : player,
		id : joinedPlayers,
		max : maxPlayers
	}));

	for(let client of clientSockets){
		client.send(JSON.stringify({ joined : joinedPlayers + 1 }));
	}


	if(++joinedPlayers == maxPlayers){
		for(let i = 0; i < maxPlayers; i++){
			clientSockets[i].send(JSON.stringify({start : true}));
			clientSockets[i].on('message', incoming(i));
		}
		let sendUpdates = function() {
			for (let client of clientSockets) {
				let data = {
					newBullets : newBullets,
					remBullets : remBullets, // Removed Bullets
					players : players
				};
				client.send(JSON.stringify(data));
			}
			newBullets = [];
			remBullets = [];
		};
		// Periodically send updates to clients.
		gameloop.setGameLoop(sendUpdates, 50);

		// Shutdown game after sometime
		setInterval(function() {
			console.log("Shutting down");
			wss.close();
			process.exit(0);
		}, gameDuration);


		listener.close(function() {
			console.log('Stopped listening for new players.');
		});
	}
});

function incoming(id) {
	return function(data){
		let obj = JSON.parse(data);
		if(obj.dx || obj.dy) { // If obj is a new bullet
			obj.id = bulletId++;
			bullets.push(obj);
			// console.log(bullets);
			newBullets.push(obj);
		} else {
			players[id] = obj;
		}
	};
}



const gameloop = require('node-gameloop');

function intersect(bullet, player){
	return !(player.x > bullet.x + 10 || player.x + 20 < bullet.x || player.y > bullet.y + 10 || player.y + 20 < bullet.y);
}


// Gamestate updation
gameloop.setGameLoop(function(delta) {
	for(let bullet of bullets) {
		bullet.x += bullet.dx * delta;
		if (bullet.x < 0) bullet.x += canvasDimensions[0];
		bullet.y += bullet.dy * delta;
		if (bullet.y < 0) bullet.y += canvasDimensions[1];
		bullet.x %= canvasDimensions[0];
		bullet.y %= canvasDimensions[1];
	}

	for(let bullet of bullets) {
		for(let player of players) {
			if(intersect(bullet, player)){
				const bi = bullets.indexOf(bullet),
					pi = players.indexOf(player);

				bullets.splice(bi, 1);
				remBullets.push(bullet.id);

				deaths[pi]++;

				players[pi].x = Math.floor(Math.random() * 640);
				players[pi].y = Math.floor(Math.random() * 480);



			}
		}
	}



}, 1000 / 30);



const listener = server.listen(8080, function listening() {
	console.log('listening on 8080...');
});
