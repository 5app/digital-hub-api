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

// Set the audience
const aud = process.argv.slice(2).join(',')

// console.log('Audience set to %s', aud)

// Generate links
getViewerUrls(aud).catch(e => console.log(e))


// Function to get the Viewer Links
async function getViewerUrls(aud = '') {
	const resp = await hub.api({
		path: 'api/commonAsset',
		qs: {
			fields: [
				'id',
				'name',
				'viewerUrl'
			],
			filter: {
				type: ['upload', 'web', 'zip']
			},
			limit: 100,
			aud
		}
	})

	console.log(resp)
}