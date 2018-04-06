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
const parent_id = +process.argv.slice(2)

if (!parent_id || typeof parent_id !== 'number') {
	throw new Error('Parent_id is invalid')
}

// Set master hub
setMasterHub(parent_id).catch(e => console.log(e))


// Grab the assets
async function setMasterHub(parent_id) {
	const resp = await hub.api({
		path: 'api/domains/self',
		method: 'patch',
		body: {
			parent_id
		}
	})

	console.log(resp)
}

