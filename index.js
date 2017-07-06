"use strict";

const express = require('express');
const app = express();

app.use(express.static('client'));

const http = require('http');
const server = http.createServer(app);

const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });


// Globals
const config = require('./config.js');
const width = config.width, height = config.height,
	maxPlayers = config.maxPlayers, 
	bulletSize = config.bulletSize,		// Actuall, half the bulletsize and
	playerSize = config.playerSize,	// half the playersize
	gameDuration = config.gameDuration;


let joinedPlayers = 0;
let bullets = [];
let newBullets = [], remBullets = [];
let bulletId = 0; // For generating unique bullet ids
let players = [];
let clientSockets = [];
let deaths = [];

wss.on('connection', function connection(ws) {
	// Send initial game parameters
	clientSockets.push(ws);

	let player = {
		x : Math.floor(Math.random() * width),
		y : Math.floor(Math.random() * height),
		sense : "-y"
	};
	players.push(player);
	deaths.push(0);


	ws.send(JSON.stringify({
		config : config,
		player : player,
		id : joinedPlayers,
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

function max(a, b){
	return (a > b) ? a : b;
}
function min(a, b){
	return (a < b) ? a : b;
}

function intersect(bullet, player, delta){
	let oldBullet = {};
	oldBullet.x = bullet.x - bullet.dx * delta;
	oldBullet.y = bullet.y - bullet.dy * delta;
	let sweep = {};
	sweep.left = min(bullet.x, oldBullet.x) - bulletSize;
	sweep.top = min(bullet.y, oldBullet.y) - bulletSize;
	sweep.right = max(bullet.x, oldBullet.x) + bulletSize;
	sweep.bottom = max(bullet.y, oldBullet.y) + bulletSize;

	return !(player.x - playerSize > sweep.right || 
		player.x + playerSize < sweep.left || 
		player.y - playerSize > sweep.bottom || 
		player.y + playerSize < sweep.top);
}


// Gamestate updation
gameloop.setGameLoop(function(delta) {
	for(let bullet of bullets) {
		bullet.x += bullet.dx * delta;
		if (bullet.x < 0) bullet.x += width;
		bullet.y += bullet.dy * delta;
		if (bullet.y < 0) bullet.y += height;
		bullet.x %= width;
		bullet.y %= height;
	}

	for(let bullet of bullets) {
		for(let player of players) {
			if(intersect(bullet, player, delta)){
				const bi = bullets.indexOf(bullet),
					pi = players.indexOf(player);

				bullets.splice(bi, 1);
				remBullets.push(bullet.id);

				deaths[pi]++;

				players[pi].x = Math.floor(Math.random() * width);
				players[pi].y = Math.floor(Math.random() * height);



			}
		}
	}



}, 1000 / 30);



const listener = server.listen(8080, function listening() {
	console.log('listening on 8080...');
});
