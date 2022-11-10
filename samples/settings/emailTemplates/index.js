/* eslint no-console: "off"*/

const Hub = require('../../../src/api');
const fs = require('fs');
const path = require('path');

const env = process.env;

// Use parameters for the tenant
const tenant = process.argv[2];

if (!tenant) {
	console.log('Please provide the tenant');
}

// Initiate the connection
const hub = new Hub({
	tenant,
	username: env.DH_USERNAME,
	password: env.DH_PASSWORD,
});

// Set the newUser template
setEmailTemplate({
	body: fs
		.readFileSync(path.join(__dirname, 'sampleTemplate.yml'))
		.toString(),
	locale: 'en-GB',
	subject: 'Welcome New User',
	type: 'newUser', // newUser welcomeUser invitationReminder inactivityReminder
}).catch(e => console.log(e));

// Post the email template
async function setEmailTemplate(body) {
	const resp = await hub.api({
		path: 'api/emailTemplates',
		method: 'post',
		body,
	});

	console.log(resp);

	return resp;
}

// node -r dotenv/config ./settings/emailTemplates product.5app.com
