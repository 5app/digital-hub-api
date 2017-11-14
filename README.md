# Digital Hub NodeJS API

A NodeJS API for interoperating with a [Digital Hub](https://5app.com)


# Samples

The [samples folder](./samples) highlights how the API can be used to automate and report operations with a Digital Hub.


# Javascript API

Create an instance of the hub

```javasciprt
const Hub = require('digital-hub-api');
```

## constructor

The constructor defines the environment and user credentials

```javascript
const hub = new Hub({
	tenant, 
	username,
	password
})
```

## api

This makes a request using [request-promise](https://www.npmjs.com/package/request-promise-native). 

```javascript
await hub.api({
	path: 'api/assets',
	qs: {
		fields: ['id', 'name'],
		filters: {
			parent_id: 13123
		}
	}
})
```

Note: Docs on the available HTTP endpoints, methods and parameters are in development.