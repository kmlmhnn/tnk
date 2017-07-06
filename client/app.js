"use strict";

/*jslint browser: true */

let players = [];
let maxPlayers = 0;
let player = {};
let bullets = [];
let server = {};
let playerId = 0;
let playerVel = 0;
let bulletVel = 0;
let playerSize = 0;
let bulletSize = 0;

function recv(event) {
	const data = JSON.parse(event.data);
	bullets = bullets.concat(data.newBullets);
	bullets = bullets.filter(x => !(new Set(data.remBullets)).has(x.id));
	for(let i = 0; i < maxPlayers; i++){
		if(i != playerId){ 
			Object.assign(players[i], data.players[i]);
		}
	}
	Object.assign(player, data.players[playerId]);
}

function keyDown(e) {
	switch(e.keyCode){
		case 37: player.x -= playerVel; player.sense = "-x"; break;
		case 38: player.y -= playerVel; player.sense = "-y"; break;
		case 39: player.x += playerVel; player.sense = "+x"; break;
		case 40: player.y += playerVel; player.sense = "+y"; break;

		case 32: 
			let bullet = {};
			bullet.id = 0;
			bullet.x = player.x; 
			bullet.y = player.y;

			switch(player.sense){
				case "-x": bullet.dx = -bulletVel; bullet.dy = 0; break;
				case "-y": bullet.dy = -bulletVel; bullet.dx = 0; break;
				case "+x": bullet.dx =  bulletVel; bullet.dy = 0; break;
				case "+y": bullet.dy =  bulletVel; bullet.dx = 0; break;
			}
			
			bullet.x += (bullet.dx / bulletVel) * 2 * playerSize;
			bullet.y += (bullet.dy / bulletVel) * 2 * playerSize;

			server.send(JSON.stringify(bullet));
			return;
	}
	server.send(JSON.stringify(player));

}

function makeRedraw(context) {
	let oldTick = 0;
	const redraw = function(newTick) {
		let delta = (newTick - oldTick) / 1000;
		oldTick = newTick;

		context.clearRect(0, 0, context.canvas.width, context.canvas.height);

		for(let bullet of bullets){
			// Update bullet parameters
			bullet.x += bullet.dx * delta;
			if (bullet.x < 0) bullet.x += context.canvas.width;
			bullet.y += bullet.dy * delta;
			if (bullet.y < 0) bullet.y += context.canvas.height;
			bullet.x %= context.canvas.width;
			bullet.y %= context.canvas.height;

			// Draw bullet
			context.fillRect(bullet.x - bulletSize, bullet.y - bulletSize,
				2 * bulletSize, 2 * bulletSize);
		}
		// Draw player
		context.fillRect(player.x - playerSize, player.y - playerSize, 
			2 * playerSize, 2 * playerSize);
		// Draw others
		for(let i = 0; i < maxPlayers; i++){
			if(i != playerId){ 
				context.fillRect(players[i].x - playerSize, 
					players[i].y - playerSize, 2 * playerSize, 2 * playerSize);
			}
		}
		requestAnimationFrame(redraw);
	};
	return redraw;
}


window.onload = function() {
	server = new WebSocket('ws://localhost:8080');
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');


	const redraw = makeRedraw(context);

	server.onopen = function () {
		server.onmessage = function(event){
			const data = JSON.parse(event.data);
			// const width = data.dim[0], height = data.dim[1];
			const width = data.config.width, height = data.config.height;

			Object.assign(player, data.player);
			playerId = data.id;
			maxPlayers = data.config.maxPlayers;

			players = new Array(maxPlayers).fill({});

			context.canvas.width = width;
			context.canvas.height = height;

			playerVel = data.config.playerVel;
			bulletVel = data.config.bulletVel;
			playerSize = data.config.playerSize;
			bulletSize = data.config.bulletSize;

			server.onmessage = function(event){
				const data = JSON.parse(event.data);
				if(data.start){
					window.addEventListener("keydown", keyDown, false);
					requestAnimationFrame(redraw);
					server.onmessage = recv;
				} else {
					// console.log(data); still waiting for players
				}
			};

		};
	};
};
