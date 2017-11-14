const request = require('request-promise-native')
const extend = require('tricks/object/extend')
const path = require('path')

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

		const uri = `https://${path.join(this.options.tenant, options.path)}`
		options.uri = uri
		options.json = true
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
			client_id,
			client_secret,
		} = this.options

		// Check the minimum requirements
		if (!(client_id && client_secret)) {
			throw new Error('Missing property client_id, client_secret')
		}

		// If the access_token has already been set return it...
		if (this.access_token) {
			// Return the token
			return this.access_token
		}

		// Trigger the API request
		return this.request({
			method: 'POST',
			path: '/auth/login',
			body: {
				username: client_id,
				password: client_secret
			}
		})
			.then(body => {

				const token = body.access_token
				this.access_token = token

				if (!token) {
					throw new Error('Authentication failed')
				}

				return token
			})
	}

	// Api
	async api(options) {

		// Get the token
		const access_token = await this.login()
		extend(options, {qs: {access_token}})

		// Prefix the path
		options.path = path.join('/v2/service/', options.path)

		// Trigger the request...
		return this.request(options)
	}
}

