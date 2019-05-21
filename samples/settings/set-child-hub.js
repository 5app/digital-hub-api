/*eslint no-console: "off"*/

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

// Select a report
const child_domain_id = +process.argv.slice(2)

if (!child_domain_id || typeof child_domain_id !== 'number') {
	throw new Error('child_domain_id is invalid')
}

// Set child hub
setChildHub(child_domain_id).catch(e => console.log(e))


// Grab the assets
async function setChildHub(child_domain_id) {
	const resp = await hub.api({
		path: 'api/domainRelationships',
		method: 'post',
		body: {
			child_domain_id
		}
	})

	console.log(resp)
}

