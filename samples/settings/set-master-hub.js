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

// Grab the assets
hub.api({
	path: 'api/domains/self',
	method: 'patch',
	body: {
		parent_id
	}
})
	.then(resp => {
		console.log(resp)
	})
	.catch(resp => {
		console.log(resp)
	})
