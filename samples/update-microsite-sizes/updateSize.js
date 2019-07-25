const api = require('./api.js')

function updateSize({id, size}) {
	return api({
		path: `api/asset/${id}`,
		method: 'patch',
		body: {
			fileSize: size,
		},
	})
}

module.exports = updateSize
