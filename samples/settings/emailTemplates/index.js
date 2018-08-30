/*eslint no-console: "off"*/

const Hub = require('../../../src/api')
const fs = require('fs')
const path = require('path')

const env = process.env

// Initiate the connection
const hub = new Hub({
	tenant: env.DH_TENANT,
	username: env.DH_USERNAME,
	password: env.DH_PASSWORD
})

// Set master hub
setEmailTemplate({
	body: fs.readFileSync(path.join(__dirname, 'sampleTemplate.yml')).toString(),
	from: 'notification@5app.com',
	lang: 'en-GB',
	subject: 'Welcome New User',
	type: 'newUser'
}).catch(e => console.log(e))


// Grab the assets
async function setEmailTemplate(body) {

	const resp = await hub.api({
		path: 'api/emailTemplates',
		method: 'post',
		body
	})

	console.log(resp)

	return resp
}

