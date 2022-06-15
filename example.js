#!/usr/bin/env node

const {io} = require("socket.io-client");

class App {

	constructor() {
		// Connect to Homey socket. It is your Homey name plus your Athom Cloud-ID.
		// You can find it under system settings in the Homey App. 
		// The port is currently fixed to 3987.
		this.socket = io("http://homey-5d9c7ec99091850c3d2a43cc:3987");
		
		this.socket.on("connect", () => {
			// Successful socket.io connection
			console.log(`Connected to socket ID ${this.socket.id}.`);		
		});

		this.socket.on('homey', (payload) => {
			// Now connected to Homey. The payload is all zones and devices
			console.log(`Connected to Homey.`);		

			// Payload contains all Homey devices and zones
			let {devices, zones} = payload;

			this.devices = devices;
			this.zones = zones;

		});

		// Listen to a sensor. The format is "zone-name/device-name/capabilityID"
		// This example listens to a motion sensor named "Philips" in a zone named "Hem".
		// See https://tools.developer.homey.app/tools/devices for your device capabilities. 
		this.socket.on(`Hem/Philips/alarm_motion`, (value) => {
			// Turn a light on/off. Same format.
			// In this case a lamp in zone "Kontoret" named "Kontoret C".
			this.socket.emit(`Kontoret/Kontoret C/onoff`, !value, (error) => {
				if (!error)
					console.log(`The lamp is now ${value ? "OFF" : "ON"}.`);
				else
					console.log(error);
			});
		});
	}
}

const app = new App();
