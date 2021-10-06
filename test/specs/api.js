import {expect} from 'chai'
import nock from 'nock'

let Hub
const tenant = 'test.com'
const origin = `https://${tenant}`
const username = 'username'
const password = 'password'


beforeEach(async () => {

	const headers = {
		'content-type': 'application/json'
	}

	nock(origin, headers)
		.post('/auth/login')
		.reply((url, reqBody) => {

			const opts = {
				access_token: 'token'
			}

			expect(reqBody).to.deep.equal({username, password})

			const resp = {
				...opts,
				uri: url.href,
			}

			return [200, resp]
		})

	nock(origin, {...headers, Authorization: 'Bearer token'})
		.get(/\/v2\/service\/.*/)
		.reply(function(url) {

			const opts = {}

			const resp = {
				...opts,
				uri: url,
				headers: this.req.headers
			}

			return [200, resp]
		})


	Hub = (await import('../../src/api.js')).default
})


describe('Digital Hub API', () => {

	it('should have a constructor which returns an instance', () => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		expect(hub).to.be.instanceof(Hub)
	})

	it('should trigger a request and append an auth token to the headers', async () => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		const resp = await hub.api({
			path: 'api'
		})

		expect(resp).to.have.property('uri', '/v2/service/api')
	})

	it('should throw an error when authentication fails', async () => {

		const hub = new Hub({
			username,
			password
		})

		hub.request = () => Promise.resolve({error: 'no token'})

		try {
			await hub.login({
				path: 'api'
			})
		}
		catch (err) {
			expect(err).to.be.an('error')
			expect(err.message).to.eql('Authentication failed')
			return
		}

		throw new Error('should have failed')
	})

	it('should throw an error on request when tenant is not defined', async () => {

		const hub = new Hub({
			username,
			password
		})

		try {
			await hub.api({
				path: 'api'
			})
		}
		catch (err) {
			expect(err).to.be.an('error')
			expect(err.message).to.eql('Missing property tenant')
			return
		}

		throw new Error('should have failed')

	})

	it('should throw an error on request when username or password is not defined', async () => {

		const hub = new Hub({
			tenant,
			username
		})

		try {
			await hub.api({
				path: 'api'
			})
		}
		catch (err) {
			expect(err).to.be.an('error')
			expect(err.message).to.eql('Missing property username, password')
			return
		}

		throw new Error('should have failed')
	})

	it('should use the instance version of access_token', async () => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		const token = 'a token already defined'
		hub.access_token = token

		const resp = await hub.api({
			path: 'api'
		})

		expect(resp.headers)
			.to.have.property('authorization')
			.to.include(`Bearer ${token}`)
	})

	it('should JSON.stringify objects in qs', async () => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		const json = {
			key: 'value'
		}

		const resp = await hub.api({
			path: 'api',
			qs: {
				json,
				a: 1
			}
		})

		const url = new URL(resp.uri, origin)

		const qs = Object.fromEntries(url.searchParams)

		expect(qs).to.have.property('json', '{"key":"value"}')
		expect(qs).to.have.property('a', '1')
		expect(qs).to.not.have.property('token')
		expect(qs).to.not.have.property('access_token')
	})


	it('should route complete paths, when prefixed with `/`', async () => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		const resp = await hub.api({
			path: '/v2/service/api'
		})

		expect(resp).to.have.property('uri', '/v2/service/api')
	})


	it('should let options.json be overideable', async () => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		const resp = await hub.api({
			path: '/v2/service/picture',
			json: false,
		})

		expect(resp).to.have.property('url', `${origin}/v2/service/picture`)

		expect(resp)
			.to.have.property('headers')
			.to.not.have.property('Accept', 'application/json')

	})

})
