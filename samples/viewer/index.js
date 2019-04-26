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
	const {data} = await hub.api({
		path: 'api/commonAsset',
		qs: {
			fields: [
				'id',
				'name',
				'type',
				'viewerUrl'
			],
			filter: {
				type: ['upload', 'web', 'zip']
			},
			limit: 10000,
			aud
		}
	})

	console.log(toCSV(Object.keys(data[0])))

	data.forEach(item => {
		// Update the viewerURL path
		if (item.viewerUrl) {
			item.viewerUrl = `https://${DH_TENANT}${item.viewerUrl}`
		}
		console.log(toCSV(Object.values(item)))
	})
}

function toCSV(array) {
	return array.map(item => (typeof item === 'string' ? `"${item.replace('"', '""')}"` : item)).join()
}