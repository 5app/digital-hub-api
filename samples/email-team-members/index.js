/* eslint no-console: "off"*/

const Hub = require('../../src/api');

const {DH_USERNAME, DH_PASSWORD, DH_TENANT} = process.env;

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD,
});

// Select a report
const teamName = process.argv.slice(2);

if (!teamName) {
	throw new Error('Team name is missing');
}

// Set master hub
init(teamName).catch(e => console.log(e));

// Grab the assets
async function init(teamName) {
	// Get members of a team
	const resp = await hub.api({
		path: 'query/users',
		qs: {
			fields: ['id'],
			filter: {
				team: {
					name: teamName,
				},
				userDomains: {
					is_invited: false,
				},
			},
			limit: 10_000,
		},
	});

	console.log(`Found ${resp.data.length} uninvited members of the team`);

	// Send the invites
	await hub.api({
		path: 'invites',
		method: 'POST',
		body: {
			ids: resp.data.map(item => item.id),
		},
	});
}
