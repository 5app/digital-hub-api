const util = require('util')
const pkgcloud = require('pkgcloud')

const {
	RACKSPACE_API_TOKEN,
	RACKSPACE_USERNAME,
	RACKSPACE_CONTAINER,
	RACKSPACE_REGION,
} = process.env

const client = pkgcloud.providers.rackspace.storage.createClient({
	username: RACKSPACE_USERNAME,
	apiKey: RACKSPACE_API_TOKEN,
	region: RACKSPACE_REGION || 'LON',
})

const getContainer = util.promisify(client.getContainer).bind(client)
const getFiles = util.promisify(client.getFiles).bind(client)

async function fetchMicrositeSize({root}) {
	const container = await getContainer(RACKSPACE_CONTAINER)
	const files = await getFiles(container, {marker: root})
	const micrositeFiles = files.filter(file => file.name.startsWith(root)) // We can't limit the results of pkgcloud to the directoty files only
	const size = micrositeFiles.reduce((total, file) => total + file.size, 0) // total uncompressed size of the microsite

	return size
}

module.exports = fetchMicrositeSize