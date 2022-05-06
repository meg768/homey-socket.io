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

			// Show all devices for debugging purposes.
			console.log(JSON.stringify(this.devices, null, '  '));
		});

		// Listen to a sensor. The format is "zone-name/device-name/capabilityID"
		// This example listens to a motion sensor named "Philips" in a zone named "Hem".
		// See https://tools.developer.homey.app/tools/devices for your device capabilities. 
		this.socket.on(`Hem/Philips/alarm_motion`, (value) => {
			// Turn a light on/off. Same format.
			// In this case a lamp in zone "Kontoret" named "Kontoret D".
			this.socket.emit(`Kontoret/Kontoret D/onoff`, !value, () => {
				console.log(`The lamp is now ${value ? "OFF" : "ON"}.`);
			});
		});
	}
}

const app = new App();
