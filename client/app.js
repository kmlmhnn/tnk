"use strict";

/*jslint browser: true */

window.onload = function() {
	const socket = new WebSocket('ws://localhost:8080');

	socket.onopen = function (event) {
		console.log('event: ', event);
		socket.send('Hello from the other side.');
		socket.onmessage = function(event){
			console.log('event: ', event, 'data: ', event.data);
		};
	};
};
