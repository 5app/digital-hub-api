/* eslint no-console: "off"*/

/**
 * Set a child hub to the current hub
 *
 * @example
 *
 * node -r dotenv/config settings/set-child-hub.js childhub.5app.com
 */

const Hub = require('../../src/api');

const {DH_USERNAME, DH_PASSWORD, DH_TENANT} = process.env;

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD,
});

// Select a report
const child_domain = process.argv.slice(2)[0];

const child = new Hub({
	tenant: child_domain,
	username: DH_USERNAME,
	password: DH_PASSWORD,
});

async function init() {
	// Get the child hub domain id
	const child_domain_id = await getChildDomainId();

	// Set child hub
	await setChildHub(child_domain_id);
}

// Grab the assets
async function setChildHub(child_domain_id) {
	const resp = await hub.api({
		path: 'query/domainRelationships',
		method: 'post',
		body: {
			child_domain_id,
		},
	});

	console.log(resp);
}

async function getChildDomainId() {
	const {id} = await child.api({
		path: 'query/domains/self',
		qs: {
			fields: ['id'],
		},
	});

	return id;
}

init().catch(e => console.error(e));
