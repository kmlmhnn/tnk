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
let playerLeft = "";
let playerRight = "";
let playerUp = "";
let playerDown = "";

let width = 0, height = 0;

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
	
	if(player.x < 0){
		player.x = 0;
	} else if(player.x > width - 1){
		player.x = width - 1;
	}

	if(player.y < 0){
		player.y = 0;
	} else if(player.y > height - 1){
		player.y = height - 1;
	}

	server.send(JSON.stringify(player));

}

function drawPlayer(context, player){
	let str = "", unit = (playerSize * 2) / 3; // TODO: Remove Dependency bw player and bullet size in config file. 
	switch(player.sense){
		case "-x": str = playerLeft; break;
		case "+x": str = playerRight; break;
		case "-y": str = playerUp; break;
		case "+y": str = playerDown; break;
	}
	let i = 0;
	for(let y = player.y - playerSize; y < player.y + playerSize; y += unit){
		for(let x = player.x - playerSize; x < player.x + playerSize; x += unit){
			switch(str[i++]){
				case '1' : context.fillRect(x, y, unit, unit); break;
				case '0': break;
			}
		}
	}

}

function makeRedraw(context) {
	let oldTick = 0;
	const redraw = function(newTick) {
		let delta = (newTick - oldTick) / 1000;
		oldTick = newTick;

		// Clear screen
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
		drawPlayer(context, player);
		// Draw others
		for(let i = 0; i < maxPlayers; i++){
			if(i != playerId){ 
				drawPlayer(context, players[i]);
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
			width = data.config.width; height = data.config.height;

			Object.assign(player, data.player);
			playerId = data.id;
			maxPlayers = data.config.maxPlayers;

			players = new Array(maxPlayers).fill({});

			context.canvas.width = width;
			context.canvas.height = height;

			canvas.style.backgroundColor = data.config.bgColor;

			playerVel = data.config.playerVel;
			bulletVel = data.config.bulletVel;
			playerSize = data.config.playerSize;
			bulletSize = data.config.bulletSize;

			playerLeft = data.config.playerLeft;
			playerRight = data.config.playerRight;
			playerUp = data.config.playerUp;
			playerDown = data.config.playerDown;

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
