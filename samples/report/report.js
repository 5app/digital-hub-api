/*eslint no-console: "off"*/

const Hub = require('../../src/api')
const path = require('path')
const YAML = require('yamljs')

const {
	DH_USERNAME,
	DH_PASSWORD,
	DH_TENANT
} = process.env

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD
})

// Select a report
const name = process.argv.slice(2)

// Load yaml file using YAML.load
const report = YAML.load(path.join(__dirname, `./reports/${name}.yml`))

// Recurse through the report and replace dynamic values
transform(report, {
	isoSub30: isoDateAdd(-30),
	isoSub90: isoDateAdd(-90)
})

// Grab the assets
hub.api({
	path: `api/${report.root}`,
	qs: report.query
})
	.then(resp => {

		if (!(typeof resp === 'string' || resp instanceof Buffer)) {
			resp = JSON.stringify(resp);
		}

		process.stdout.write(resp)
	})
	.catch(resp => {

		console.log(resp)

	})

function isoDateAdd(days) {
	const d = new Date()
	d.setDate(d.getDate() + days)
	return d.toISOString().split('T')[0]
}

function transform(obj, map) {

	if (typeof obj === 'string') {
		return obj.replace(/\$\{(.*?)\}/g, (m, p) => map[p])
	}
	else if (obj && typeof obj === 'object') {
		for (const x in obj) obj[x] = transform(obj[x], map)
	}
	return obj
}
