/* eslint no-console: "off"*/

/**
 * Add a user to a hub
 *
 * @example
 *
 * node -r dotenv/config add-user andrew@example.com Andrew Dodson
 */

const Hub = require('../../src/api');

const {DH_USERNAME, DH_PASSWORD, DH_TENANT} = process.env;

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD,
});

async function init() {
	// Get values...
	const [email, first_name, last_name] = process.argv.slice(2);

	// Set hub theme
	await addUser({email, first_name, last_name});
}

async function addUser(body) {
	const resp = await hub.api({
		path: 'addUser',
		method: 'post',
		body,
	});

	console.log(resp);
}

init().catch(e => console.error(e));
