const fs = require('fs')
const WebSocket = require('ws')


const wss = new WebSocket.Server({ port: 8080 })
var record = 0;
var emulatedCard;
var browser;

wss.on('connection', (ws) => {
	console.log(`Connection`)
	ws.on('message', (message) => {
		// console.log(`Received message => ${message}`)

		var jsonObject = JSON.parse(message);

		if (jsonObject.caller === "client") {
			if (jsonObject.function.name === "load") {
				emulatedCard = jsonObject.function.parameters.data;
				console.log(emulatedCard);
				jsonObject.function.result = "ok";
				ws.send(JSON.stringify(jsonObject));
				browser = ws;
				record = 0;
			}
		} else {
			broadcast(message, ws);
			while (emulatedCard != null && record < emulatedCard.length) {
				var currentFunction = emulatedCard[record];
				record++;
				if (currentFunction.request != null && jsonObject.function != null &&
					jsonObject.function.name === currentFunction.request.name) {
					console.log("Command found. Waiting " + currentFunction.timestamp + " ms");
					setTimeout(function () {
						console.log('Sending => ' + JSON.stringify(currentFunction, 2));
						ws.send(JSON.stringify(currentFunction));
						broadcast(JSON.stringify(currentFunction), ws);
					}, currentFunction.timestamp);
					return;
				} else {
					console.log("Ignoring response " + JSON.stringify(currentFunction));
				}
			}
			console.log("No more card commands ");
			setTimeout(function () {
				console.log('response  ' + message);
				ws.send(message);
				broadcast(message, ws);
			}, 1000);
		}
	})
})

function broadcast(data, ws) {
	// wss.clients.forEach(function each(client) {
	if (browser != null && browser.readyState === WebSocket.OPEN) {
		browser.send(data);
	}
	//}) 
}
