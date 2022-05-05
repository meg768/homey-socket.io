'use strict';

const Homey = require('homey');
const { HomeyAPI } = require('athom-api');



class MyApp extends Homey.App {

	async onInit() {
		this.instances = {};
		this.api = await this.getApi();

		this.log(`Fetching devices...`);
		this.devices = await this.api.devices.getDevices();

		this.log(`Fetching zones...`);
		this.zones = await this.api.zones.getZones();

		this.name = await this.api.system.getSystemName();

		this.io = require('socket.io')();

		this.debug = this.log;

		await this.load();



	}

	async getApi() {

		/*
		if (!this.api) {
			const { HomeyAPIApp } = require('homey-api');
			const api = new HomeyAPIApp({
				homey: this.homey,
			  });
		  
			  this.api = api;
		}
        return this.api;
		*/

        if (!this.api) {
            this.api = HomeyAPI.forCurrentHomey(this.homey);
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
					let deviceName = `${instance.device.zoneName}/${instance.device.name}`;

					if (instance.setable) {
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
				}
				else {

				}
			}
			catch(error) {
				this.log(error.stack);
			}
		};

		return fn; 
	}

	async load() {

		this.api.devices.setMaxListeners(9999); // HACK
		
		for (let deviceID in this.devices) {

			let device = this.devices[deviceID];
			let capabilities = device.capabilitiesObj;

			device.setMaxListeners(100);

			for (let capabilityID in capabilities) {

				if (capabilities.hasOwnProperty(capabilityID)) {
					let deviceCapabilityID = this.getDeviceCapabilityID(deviceID, capabilityID);
					let deviceCapabilityName = `${device.zoneName}/${device.name}/${capabilityID}`;

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
							await this.deviceCapabilitySetter(deviceID, capabilityID, value)();
	
							if (typeof callback == 'function') {
								callback();
							}
						});
	
					});

				}

			}

			client.on('disconnect', () => {
				this.debug('Disconnect from client.');
			});

			client.emit('connected', {devices:this.devices, zones:this.zones});

		});

		this.io.listen(3987);
		this.log('Loading finished...');


	}
	
}

module.exports = MyApp;