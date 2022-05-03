Adds support for socket.io to Homey.

This app for Homey exposes all devices to socket.io. Below is
a small example how to listen to a sensor and turning on/off a lamp.


const {io} = require("socket.io-client");

class App {

	constructor() {
		// Connect to Homey socket. It is your Homey name plus your Athom Cloud-ID.
		// You can find it under system settings in the Homey App.
		this.socket = io("http://homey-5d9c7ec99091850c3d2a43cc:3987");
		
		this.socket.on("connect", () => {
			// Successful socket.io connection
			console.log(`Connected to socket ID ${this.socket.id}.`);		
		});

		this.socket.on('connected', (payload) => {
			// Now connected to Homey. The payload is all zones and devices
			console.log(`Connected to Homey.`);		

			// Payload contains all Homey devices and zones
			let {devices, zones} = payload;

			this.devices = devices;
			this.zones = zones;

			console.log(JSON.stringify(this.devices, null, '  '));
		});

		// Listen to a sensor. The format is "zone-name/device-name/capability"
		this.socket.on(`Hem/Philips/alarm_motion`, (value) => {
			// Turn a light on/off. Same format.
			this.socket.emit(`Kontoret/Kontoret D/onoff`, !value);
		});				

	}
}

const app = new App();

