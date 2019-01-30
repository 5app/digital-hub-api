const {isEmail} = require('validator')

function validateUserData({users}) {
	const invalidaEmails = users
		.map(user => user.emailAddress)
		.filter(email => !isEmail(email))

	if (invalidaEmails.length) {
		// eslint-disable-next-line no-console
		console.error('User import cancelled because some of the users have invalid emails', invalidaEmails)

		throw new Error('Invalid email addresses')
	}
}

module.exports = validateUserData
