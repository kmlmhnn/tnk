"use strict";

/*jslint browser: true */

let player = {};
let bullet = {};

function recv(event) {
	const data = JSON.parse(event.data);
	Object.assign(bullet, data.bullet);
	Object.assign(player, data.player);
	console.log(bullet);
}

window.onload = function() {
	const socket = new WebSocket('ws://localhost:8080');
	const canvas = document.getElementById('canvas');
	const context = canvas.getContext('2d');


	socket.onopen = function () {
		socket.send('Hello from the other side.');
		socket.onmessage = function(event){
			const data = JSON.parse(event.data);
			const width = data.dim[0], height = data.dim[1];
			Object.assign(bullet, data.bullet);
			Object.assign(player, data.player);
			context.canvas.width = width;
			context.canvas.height = height;

			socket.onmessage = recv;
		};
	};
};
