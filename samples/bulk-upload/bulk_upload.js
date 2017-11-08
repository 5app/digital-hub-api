/*eslint no-console: "off"*/

const Hub = require('../../src/api')
const parse = require('csv-parse')
const fs = require('fs')
const path = require('path')

const {
	CLIENT_ID,
	CLIENT_SECRET,
	TENANT
} = process.env

// Initiate the connection
const hub = new Hub({
	tenant: TENANT,
	client_id: CLIENT_ID,
	client_secret: CLIENT_SECRET
})

const columns = columns => columns.map(name => name.toLowerCase()).map(columnMapper)

// Parse the contents of the CSV file
const parser = parse({delimiter: ';', columns}, (err, data) => {

	if (err) {
		return
	}
	data.map(processRecord)
})

fs.createReadStream(path.join(__dirname, 'data/assets.csv')).pipe(parser)


// Process each row
async function processRecord(record) {

	// Name;Description;Type;RefID;ParentRefID;Tags;ThumbnailPath;WebURL;OpenInIFrame;Path;DisableDownload;MimeType;CompletionTime;CollectionType
	const {
		refid,
		parentrefid,
		...patch
	} = record

	// Get the reference id for this record
	if (!refid) {
		return
	}

	// Get the Asset
	let asset = await getAssetByRefId(refid)
	const parent = record.parentrefid && await getAssetByRefId(parentrefid)

	// Set parent id
	if (parentrefid && parent) {
		patch.parent_id = parent.id
	}

	// If the asset does not exist
	if (!asset) {
		patch.refid = refid
		asset = await createAssetRecord(patch)
	}
}

// Retrieve the asset using refid
async function getAssetByRefId(refid) {

	return hub.api({
		path: 'api/assets',
		qs: {
			fields: ['id', 'name'],
			filter: {
				refid
			}
		}
	})
		.then(resp => resp.data[0])
		.catch(resp => {
			console.log(resp.error)
		})
}

// Create entry
async function createAssetRecord(patch) {
	console.log(patch)
}

function columnMapper(name) {

	return {
		mimetype: 'mime_type',
		completiontime: 'completion_time',
		collectiontype: 'collection_type'
	}[name] || name
}

// Loop through each row in the CSV and process the item

// Match the item to an existing item and update any metadata

// Find the file: if one exists

// upload it - in place of the previous one.

// Find the thumbnail: if one exists

// upload it - in place of the previous one.

// Match the