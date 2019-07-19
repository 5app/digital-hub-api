const mockery = require('mockery')
let Hub

before(() => {

	mockery.enable({
		warnOnReplace: false,
		warnOnUnregistered: false,
		useCleanCache: true
	})

	mockery.registerMock('request-promise-native', async opts => {

		if (!opts.json) {
			return JSON.stringify(opts)
		}

		if (opts.uri.match('/auth/login')) {
			opts.access_token = 'token'
		}
		return opts
	})

	Hub = require('../../src/api')
})

after(() => {
	mockery.disable()
	mockery.deregisterAll()
})


describe('Digital Hub API', () => {

	const username = 'username'
	const password = 'password'
	const tenant = 'test.com'

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

		expect(resp.headers).to.have.property('Authorization', 'Bearer token')
		expect(resp).to.have.property('uri', `https://${tenant}/v2/service/api`)
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

		hub.access_token = 'inst_token'

		const resp = await hub.api({
			path: 'api'
		})

		expect(resp.headers).to.have.property('Authorization', 'Bearer inst_token')
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

		expect(resp.qs).to.have.property('json', '{"key":"value"}')
		expect(resp.qs).to.have.property('a', 1)
		expect(resp.qs).to.not.have.property('token')
		expect(resp.qs).to.not.have.property('access_token')
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

		expect(resp).to.have.property('uri', `https://${tenant}/v2/service/api`)
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
			resolveWithFullResponse: true
		})

		expect(resp).to.be.a('string')
	})

})