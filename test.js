#!/usr/bin/env node

const AthomCloudAPI = require('homey-api/lib/AthomCloudAPI');

// Create a Cloud API instance
const cloudApi = new AthomCloudAPI({
  clientId: '5a8d4ca6eb9f7a2c9d6ccf6d',
  clientSecret: 'e3ace394af9f615857ceaa61b053f966ddcfb12a',
  redirectUrl: 'http://localhost'
});

async function test() {
	// Get the logged in user
	const user = await cloudApi.getAuthenticatedUser();

	// Get the first Homey of the logged in user
	const homey = await user.getFirstHomey();

	// Create a session on this Homey
	const homeyApi = await homey.authenticate();

	// Loop all devices
	const devices = await homeyApi.devices.getDevices();
	for(const device of Object.values(devices)) {
	// Turn device on
	await device.setCapabilityValue({ capabilityId: 'onoff', value: true }); 
	}
}

test();