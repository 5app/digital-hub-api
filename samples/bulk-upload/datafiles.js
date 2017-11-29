const fs = require('fs')
const path = require('path')

// Get the file to operate over...
const args = process.argv.slice(2)

if (!args.length) {
	throw new Error('Unknown csv path')
}

// Select a data source
const ABS_PATH_DATA = path.resolve(process.cwd(), args[0])

// Set the basepath
let BASE_PATH = ABS_PATH_DATA.replace(/[^/]+$/, '')

// Files
const files = []

// If the path given is for a Directory...
if (fs.lstatSync(ABS_PATH_DATA).isDirectory()) {

	// Redefine the basepath
	BASE_PATH = ABS_PATH_DATA

	// Get the full paths of the CSV files in the directory
	const dirfiles = fs.readdirSync(ABS_PATH_DATA)
		.filter(file => path.extname(file) === '.csv')
		.map(file => `${ABS_PATH_DATA}/${file}`)

	// Push them into the datafiles array
	files.push(...dirfiles)

}
// else, this is a single file path...
else {
	files.push(ABS_PATH_DATA)
}

module.exports = {
	files,
	base: BASE_PATH
}