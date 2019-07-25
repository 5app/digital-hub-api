const api = require('./api.js')

async function findAllMicrositesWithoutSize() {
	const {data} = await api({
		path: 'api/asset',
		qs: {
			fields: ['id', 'name', 'uuid', 'index_path', 'domain'],
			filter: {
				type: 'zip',
				is_deleted: 0,
				fileSize: 0,
				'-index_path': null,
			},
		}
	})

	const microsites = data.map(details => ({
		...details,
		path: `${details.domain}-${details.id}/${details.uuid}/${details.index_path}`,
		root: `${details.domain}-${details.id}/${details.uuid}`,
	}))

	return microsites
}

module.exports = findAllMicrositesWithoutSize
