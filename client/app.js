"use strict";

/*jslint browser: true */

let player = {};
let bullet = {};

function recv(event) {
	const data = JSON.parse(event.data);
	Object.assign(bullet, data.bullet);
	Object.assign(player, data.player);
}


window.onload = function() {
	const socket = new WebSocket('ws://localhost:8080');
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');

	const redraw = function() {

		// Hint: Doesnot work with transformations
		context.clearRect(0, 0, canvas.width, canvas.height);

		// Draw bullet
		context.fillRect(bullet.x, bullet.y, 10, 10);
		// Draw player
		context.fillRect(player.x, player.y, 20, 20);

		requestAnimationFrame(redraw);
	};


	socket.onopen = function () {
		socket.send('Hello from the other side.');
		socket.onmessage = function(event){
			const data = JSON.parse(event.data);
			const width = data.dim[0], height = data.dim[1];
			Object.assign(bullet, data.bullet);
			Object.assign(player, data.player);
			context.canvas.width = width;
			context.canvas.height = height;

			requestAnimationFrame(redraw);
			socket.onmessage = recv;

		};
	};
};
