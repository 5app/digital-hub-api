const request = require('request-promise-native')
const extend = require('tricks/object/extend')

module.exports = class Hub {

	constructor(opts) {
		this.options = opts
	}

	async request(options) {

		const {
			tenant
		} = this.options

		// Check the minimum requirements
		if (!(tenant)) {
			throw new Error('Missing property tenant')
		}

		const uri = new URL(options.path, `https://${this.options.tenant}`).href

		options.uri = uri

		if (!('json' in options)) {
			options.json = true
		}

		options.rejectUnauthorized = false

		{
			const qs = options.qs
			for (const x in qs) {
				if (typeof qs[x] === 'object') {
					qs[x] = JSON.stringify(qs[x])
				}
			}
		}

		return request(options)
	}

	// Login the user
	async login() {

		// Get the options used in this request
		const {
			username,
			password,
		} = this.options

		// Check the minimum requirements
		if (!(username && password)) {
			throw new Error('Missing property username, password')
		}

		// If the access_token has already been set return it...
		if (this.access_token) {
			// Return the token
			return this.access_token
		}

		// Trigger the API request
		const body = await this.request({
			method: 'POST',
			path: '/auth/login',
			body: {
				username,
				password
			}
		})

		// Capture and save the access_token from the response
		const token = body.access_token

		this.access_token = token

		if (!token) {
			throw new Error('Authentication failed')
		}

		return token
	}

	// Api
	async api(options) {

		// Get the token
		const access_token = await this.login()

		// Update headers in request to include Bearer Token
		extend(options, {
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		})

		// Prefix the path
		options.path = new URL(options.path, 'https://invalid/v2/service/').pathname

		// Trigger the request...
		return this.request(options)
	}
}

