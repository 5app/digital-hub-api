/*eslint no-console: "off", no-await-in-loop: "off"*/

const chalk = require('chalk')
const findAllMicrositesWithoutSize = require('./findAllMicrositesWithoutSize')
const fetchMicrositeSize = require('./fetchMicrositeSize')
const updateSize = require('./updateSize')

async function updateMicrosites({skipDbUpdate = false}) {
	const microsites = await findAllMicrositesWithoutSize()

	for (const microsite of microsites) {
		const {id, path, root} = microsite
		const size = await fetchMicrositeSize({root})

		if (size) {
			if (!skipDbUpdate) {
				await updateSize({id, size})
			}

			console.log(chalk.green(`Microsite ${id}: size=${size} path=${path}`))
		}
		else {
			console.log(chalk.red(`We could not calculate the size of the microsite ${id}, path=${path}`))
		}
	}

	console.log('Update finished')
}

module.exports = updateMicrosites