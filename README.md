# Digital Hub NodeJS API

[![Greenkeeper badge](https://badges.greenkeeper.io/5app/digital-hub-api.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/5app/digital-hub-api/badge.svg)](https://snyk.io/test/github/5app/digital-hub-api)
[![Coverage Status](https://coveralls.io/repos/github/5app/digital-hub-api/badge.svg)](https://coveralls.io/github/5app/digital-hub-api)
[![CircleCI](https://circleci.com/gh/5app/digital-hub-api/tree/main.svg?style=shield)](https://circleci.com/gh/5app/digital-hub-api/tree/main)

A NodeJS API for interoperating with a [Digital Hub](https://5app.com)

# Samples

The [samples folder](./samples) highlights how the API can be used to automate and report operations with a Digital Hub.

# Core API

Create an instance of the hub

```javascript
const Hub = require('@5app/digital-hub-api');
```

## constructor

The constructor defines the environment and user credentials

```javascript
const hub = new Hub({
	tenant,
	username,
	password,
});
```

## api

This makes a request using [node-fetch](https://www.npmjs.com/package/node-fetch).

```javascript
await hub.api({
	path: 'api/assets',
	qs: {
		fields: ['id', 'name'],
		filters: {
			parent_id: 13123,
		},
	},
});
```

Note: Docs on the available HTTP endpoints, methods and parameters are in development.
