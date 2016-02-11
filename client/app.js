"use strict";

/*jslint browser: true */

let players = [];
let maxPlayers = 0;
let player = {};
let bullets = [];
let server = {};
let playerId = 0;

function recv(event) {
	const data = JSON.parse(event.data);
	let temp = bullets.length;
	bullets = bullets.concat(data.newBullets);
	if(temp !== bullets.length) console.log(bullets);
	bullets = bullets.filter(x => !(new Set(data.remBullets)).has(x.id));
	for(let i = 0; i < maxPlayers; i++){
		if(i != playerId){ 
			Object.assign(players[i], data.players[i]);
		}
	}
}

function keyDown(e) {
	switch(e.keyCode){
		case 37: player.x -= 10; player.sense = "-x"; break;
		case 38: player.y -= 10; player.sense = "-y"; break;
		case 39: player.x += 10; player.sense = "+x"; break;
		case 40: player.y += 10; player.sense = "+y"; break;

		case 32: 
			let bullet = {};
			bullet.id = 0;
			bullet.x = player.x; 
			bullet.y = player.y;
			switch(player.sense){
				case "-x": bullet.dx = -1000; bullet.dy = 0; break;
				case "-y": bullet.dy = -1000; bullet.dx = 0; break;
				case "+x": bullet.dx =  1000; bullet.dy = 0; break;
				case "+y": bullet.dy =  1000; bullet.dx = 0; break;
			}
			server.send(JSON.stringify(bullet));
			return;
	}
	server.send(JSON.stringify(player));

}

window.onload = function() {
	server = new WebSocket('ws://localhost:8080');
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');

	let oldTick = 0;
	const redraw = function(newTick) {
		let delta = (newTick - oldTick) / 1000;
		oldTick = newTick;

		// Hint: Doesnot work with transformations
		context.clearRect(0, 0, canvas.width, canvas.height);

		for(let bullet of bullets){
			// Predict bullet's parameters
			bullet.x += bullet.dx * delta;
			if (bullet.x < 0) bullet.x += context.canvas.width;
			bullet.y += bullet.dy * delta;
			if (bullet.y < 0) bullet.y += context.canvas.height;
			bullet.x %= context.canvas.width;
			bullet.y %= context.canvas.height;

			// Draw bullet
			context.fillRect(bullet.x, bullet.y, 10, 10);
		}
		// Draw player
		context.fillRect(player.x, player.y, 20, 20);
		// Draw others
		for(let i = 0; i < maxPlayers; i++){
			if(i != playerId){ 
				context.fillRect(players[i].x, players[i].y, 20, 20);
			}
		}
		requestAnimationFrame(redraw);
	};

	window.addEventListener("keydown", keyDown, false);

	server.onopen = function () {
		server.onmessage = function(event){
			const data = JSON.parse(event.data);
			const width = data.dim[0], height = data.dim[1];

			Object.assign(player, data.player);
			playerId = data.id;
			maxPlayers = data.max;

			players = new Array(maxPlayers).fill({});

			context.canvas.width = width;
			context.canvas.height = height;

			requestAnimationFrame(redraw);
			server.onmessage = recv;

		};
	};
};
