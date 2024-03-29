'use strict';

const Homey = require('homey');

class MyApp extends Homey.App {

	async onInit() {
		this.instances = {};
		this.api = await this.getApi();
		this.debug = this.log;

		this.debug(`Fetching devices...`);
		this.devices = await this.api.devices.getDevices();

		this.debug(`Fetching zones...`);
		this.zones = await this.api.zones.getZones();

		this.debug(`Fetching weather...`);
		this.weather = await this.api.weather.getWeather();
		this.debug(this.weather);

		this.name = await this.api.system.getSystemName();
		this.io = require('socket.io')();

		this.debug(`Fetching system...`);
		this.debug(await this.api.system.getInfo());

		await this.load();

	}

	async getApi() {
		const { HomeyAPIApp } = require('homey-api');

		if (!this.api) {
			this.api = new HomeyAPIApp({homey: this.homey});
		}

        return this.api;
	}


	getDeviceCapabilityID(deviceID, capabilityID) {
		return `${deviceID}/${capabilityID}`; 
	}

	getDeviceCapabilityName(deviceID, capabilityID) {
		let device = this.devices[deviceID];
		return `${device.zoneName}/${device.name}/${capabilityID}`;
	}
	
	deviceCapabilitySetter(deviceID, capabilityID, value) {

		let fn = async () => {

			try {
				let deviceCapabilityID = this.getDeviceCapabilityID(deviceID, capabilityID);
				let deviceCapabilityName = this.getDeviceCapabilityName(deviceID, capabilityID);

				let instance = this.instances[deviceCapabilityID];

				if (instance) {
					try {
						delete this.instances[deviceCapabilityID];
						this.debug(`Setting ${deviceCapabilityName} to ${value}`);
						await instance.setValue(value);
	
					}
					catch(error) {
						this.log(`Could not set ${deviceCapabilityName} to ${value}. ${error.message}`);
					}

					this.instances[deviceCapabilityID] = instance;
				}
				else {
					this.log(`Instance ${deviceCapabilityID} not found.`);

				}
			}
			catch(error) {
				this.log(error.stack);
			}
		};

		return fn; 
	}

	async load() {

		for (let deviceID in this.devices) {

			let device = this.devices[deviceID];
			let capabilities = device.capabilitiesObj;

            this.debug(JSON.stringify(device, null, 4));

			for (let capabilityID in capabilities) {

				if (capabilities.hasOwnProperty(capabilityID)) {
					let deviceCapabilityID = this.getDeviceCapabilityID(deviceID, capabilityID);
					let deviceCapabilityName = this.getDeviceCapabilityName(deviceID, capabilityID);

					let instance = device.makeCapabilityInstance(capabilityID, async (value) => {
						this.debug(`Emitting ${deviceCapabilityName}: ${JSON.stringify(value)}`);
						this.io.emit(deviceCapabilityName, value);
						this.debug(`Emitting ${deviceCapabilityID}: ${JSON.stringify(value)}`);
						this.io.emit(deviceCapabilityID, value);
					});

					this.instances[deviceCapabilityID] = instance;
				}

			}
		}

		this.io.on('connection', async (client) => {
			// Reload zones and devices
			this.devices = await this.api.devices.getDevices();
			this.zones = await this.api.zones.getZones();

			for (let deviceID in this.devices) {
				let device = this.devices[deviceID];

				for (let capabilityID in device.capabilitiesObj) {
					let deviceCapabilityID = this.getDeviceCapabilityID(deviceID, capabilityID);
					let deviceCapabilityName = this.getDeviceCapabilityName(deviceID, capabilityID);

					[deviceCapabilityID, deviceCapabilityName].forEach((event) => {
						client.on(event, async (value, callback) => {

							if (typeof callback != 'function') {
								callback = () => {};
							}								

							try {
								await this.deviceCapabilitySetter(deviceID, capabilityID, value)();
								callback();
							}
							catch(error) {
								callback(error.message);
							}
						});
	
					});

				}

			}

			client.on('disconnect', () => {
				this.debug('Disconnect from client.');
			});

			client.emit('connected', {devices:this.devices, zones:this.zones});
			client.emit('homey', {devices:this.devices, zones:this.zones});

		});

		this.io.listen(3987);
		this.debug('Loading finished...');


	}
	
}

module.exports = MyApp;