
// Import the DH API
const Hub = require('../../src/api')

// Assign the ENV VARS
const {
	DH_USERNAME,
	DH_PASSWORD,
	DH_TENANT
} = process.env


// Configure an instance of the DH Api
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD
})


// Export the Api as a function
module.exports = hub.api.bind(hub);