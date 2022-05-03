#!/usr/bin/env node
const {io} = require("socket.io-client");

class App {

	constructor() {
//		this.socket = io("http://192.168.86.37:3987");
		this.socket = io("http://homey-5d9c7ec99091850c3d2a43cc:3987");
		
		this.socket.on("connect", () => {
			console.log(`Connected to socket ID ${this.socket.id}.`);		
		});

		this.socket.on('connected', (payload) => {
			console.log(`Connected to Homey.`);		
			
			let {devices, zones} = payload;
			this.devices = devices;
			this.zones = zones;

			console.log(JSON.stringify(this.devices, null, '  '));
		});

		this.socket.on(`Hem/Philips/alarm_motion`, (value) => {
			this.socket.emit(`Kontoret/Kontoret D/onoff`, !value);
		});				

	}

	run() {

	}
}

const app = new App();
app.run();


