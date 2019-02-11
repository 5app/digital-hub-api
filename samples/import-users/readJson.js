const fs = require('fs')
const path = require('path')
const {promisify} = require('util')

const readFileAsync = promisify(fs.readFile) // We can remove this when we migrate to NodeJS v10 https://nodejs.org/api/fs.html#fs_fspromises_readfile_path_options

async function readJson(filePath) {
	const fileFullPath = path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath)
	const rawData = await readFileAsync(fileFullPath, {encoding: 'utf8'})
	const parsedData = JSON.parse(rawData)

	return parsedData
}

module.exports = readJson