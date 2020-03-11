/*eslint no-console: "off"*/

/**
 * Set theme of a hub
 *
 * @example
 *
 * node -r dotenv/config settings/set-theme.js 5app
 */

const Hub = require('../../src/api')

const {
	DH_USERNAME,
	DH_PASSWORD,
	DH_TENANT
} = process.env

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD
})

async function init() {

	// Set name of theme
	const theme = process.argv.slice(2)[0]

	// Set hub theme
	await setHubSetting({theme})
}

async function setHubSetting(body) {

	const resp = await hub.api({
		path: 'api/domains/self',
		method: 'patch',
		body
	})

	console.log(resp)
}

init().catch(e => console.error(e))
