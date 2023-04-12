/* eslint no-console: "off"*/

const Hub = require('../../src/api');

const {DH_USERNAME, DH_PASSWORD, DH_TENANT} = process.env;

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD,
});

// Set the audience
const aud = process.argv.slice(2).join(',');

// console.log('Audience set to %s', aud)

// Generate links
getViewerUrls(aud).catch(e => console.log(e));

// Function to get the Viewer Links
async function getViewerUrls(aud = '') {
	const {data} = await hub.api({
		path: 'query/commonAsset',
		qs: {
			fields: ['id', 'name', 'type', 'pictureUrl'],
			filter: {
				type: ['upload', 'web', 'zip'],
			},
			limit: 10_000,
			aud,
		},
	});

	console.log(toCSV(Object.keys(data[0])));

	data.forEach(item => {
		// Update the viewerURL path
		if (item.pictureUrl) {
			item.pictureUrl = `https://${DH_TENANT}${item.pictureUrl}`;
		}
		console.log(toCSV(Object.values(item)));
	});
}

function toCSV(array) {
	return array
		.map(item =>
			typeof item === 'string' ? `"${item.replace('"', '""')}"` : item
		)
		.join();
}
