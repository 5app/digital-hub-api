const mockery = require('mockery')
let Hub

before(() => {

	mockery.enable({
		warnOnReplace: false,
		warnOnUnregistered: false,
		useCleanCache: true
	})

	mockery.registerMock('request-promise-native', opts => {

		if (opts.uri.match('/auth/login')) {
			opts.access_token = 'token'
		}
		return Promise.resolve(opts)
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

	it('should trigger a request and append an auth token to the headers', done => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		hub.api({
			path: '/api'
		})
			.then(resp => {
				expect(resp.headers).to.have.property('Authorization', 'Bearer token')
				expect(resp).to.have.property('uri', `https://${tenant}/v2/service/api`)
				done()
			})
			.catch(done)

	})

	it('should throw an error when authentication fails', done => {

		const hub = new Hub({
			username,
			password
		})

		hub.request = () => Promise.resolve({error: 'no token'})

		hub.login({
			path: '/api'
		})
			.then(done, err => {
				expect(err).to.be.an('error')
				expect(err.message).to.eql('Authentication failed')
				done()
			})
			.catch(done)

	})

	it('should throw an error on request when tenant is not defined', done => {

		const hub = new Hub({
			username,
			password
		})

		hub.api({
			path: '/api'
		})
			.then(done, err => {
				expect(err).to.be.an('error')
				expect(err.message).to.eql('Missing property tenant')
				done()
			})
			.catch(done)

	})

	it('should throw an error on request when username or password is not defined', done => {

		const hub = new Hub({
			tenant,
			username
		})

		hub.api({
			path: '/api'
		})
			.then(done, err => {
				expect(err).to.be.an('error')
				expect(err.message).to.eql('Missing property username, password')
				done()
			})
			.catch(done)
	})

	it('should use the instance version of access_token', done => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		hub.access_token = 'Bearer inst_token'

		hub.api({
			path: '/api'
		})
			.then(resp => {
				expect(resp.headers).to.have.property('Authorization', hub.access_token)
				done()
			})
			.catch(done)
	})

	it('should JSON.stringify objects in qs', done => {

		const hub = new Hub({
			tenant,
			username,
			password
		})

		const json = {
			key: 'value'
		}

		hub.api({
			path: '/api',
			qs: {
				json
			}
		})
			.then(resp => {
				expect(resp.qs).to.have.property('json', '{"key":"value"}')
				done()
			})
			.catch(done)

	})

})