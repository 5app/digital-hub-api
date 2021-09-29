const fetch = require('node-fetch')
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

		const {path, qs, json, headers = {}, ...opts} = options

		// URL Path
		const url = new URL(path, `https://${this.options.tenant}`)

		// How to handle JSON
		// Explicitly request JSON response
		const convertToJSON = json ?? true
		if (convertToJSON) {
			headers.Accept = 'application/json'
		}

		// If the body is present and is an object
		// stringify it and set content-type header
		if (typeof(opts.body) === 'object') {
			headers['Content-Type'] = 'application/json'
			opts.body = JSON.stringify(opts.body)
		}

		// Append QS to url
		if (qs) {
			for (const x in qs) {
				if (typeof qs[x] === 'object') {
					qs[x] = JSON.stringify(qs[x])
				}
				url.searchParams.append(x, qs[x])
			}
		}

		const resp = await fetch(url, {...opts, headers})

		if (convertToJSON) {
			return resp.json()
		}

		return resp
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

