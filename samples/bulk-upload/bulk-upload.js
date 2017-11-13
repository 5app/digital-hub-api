/*eslint no-console: "off"*/

const Hub = require('../../src/api')
const parse = require('csv-parse')
const fs = require('fs')
const path = require('path')

const {
	CLIENT_ID,
	CLIENT_SECRET,
	TENANT,
	DEFAULT_ROOT_FOLDER_REFID
} = process.env

// Spit out PWD
const args = process.argv.slice(2)

if (!args.length) {
	throw new Error('Unknown csv path')
}
// Select a data source
const SOURCE_ASSET_DATA = path.resolve(process.cwd(), args[0])

// Initiate the connection
const hub = new Hub({
	tenant: TENANT,
	client_id: CLIENT_ID,
	client_secret: CLIENT_SECRET
})

const columns = columns => columns.map(name => name.toLowerCase()).map(columnMapper)

// Parse the contents of the CSV file
const parser = parse({delimiter: ',', columns, relax: true}, (err, data) => {

	if (err) {
		return console.error(err)
	}

	data.map(processRecord).forEach(p =>
		p
			.then(resp => {
				console.log('CREATED', resp)
			})
			.catch(resp => {
				console.error('ERROR', resp.error || resp.message)
			})
	)
})

fs.createReadStream(SOURCE_ASSET_DATA).pipe(parser)


// Process each row
async function processRecord(record) {

	// Name;Description;Type;RefID;ParentRefID;Tags;ThumbnailPath;WebURL;OpenInIFrame;Path;DisableDownload;MimeType;CompletionTime;CollectionType
	const {
		refid,
		parentrefid,
		tags, //eslint-disable-line
		thumbnailpath,
		path,
		...patch
	} = record

	// Get the reference id for this record
	if (!refid) {
		throw new Error('Missing refid')
	}

	// Get the Asset
	let asset = await getAssetByRefId(refid)
	const parent = await getAssetByRefId(parentrefid || DEFAULT_ROOT_FOLDER_REFID)

	// If there is no parent
	if (!parent) {
		throw new Error(`Cannot find parent ref: ${parentrefid || DEFAULT_ROOT_FOLDER_REFID}`)
	}

	// Set parent id
	if (parentrefid && parent) {
		patch.parent_id = parent.id
	}

	// ref id
	patch.refid = refid

	// format
	formatPatch(patch)

	// If the asset does not exist
	if (!asset) {
		// Create a new record
		asset = await createAssetRecord(patch)
	}
	else {
		// Patch record
		await patchAssetRecord(asset.id, patch)
	}

	if (thumbnailpath) {
		await upload(asset.id, 'thumb', thumbnailpath)
	}

	if (path) {
		await upload(asset.id, 'upload', path)
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
			},
			limit: 1
		}
	})
		.then(resp => resp.data[0])
}

// Create entry
async function createAssetRecord(body) {
	return hub.api({
		method: 'post',
		path: 'api/assets',
		qs: {
			fields: ['id']
		},
		body
	})
}

// Patch entry
async function patchAssetRecord(id, body) {
	return hub.api({
		method: 'patch',
		path: `api/assets/${id}`,
		body
	})
}

async function upload(id, type, filePath) {

	const FILE_PATH = path.resolve(SOURCE_ASSET_DATA, filePath)

	// Get the file

	return hub.api({
		method: 'post',
		path: `asset/${id}/${type}`,
		formData: {
			fileupload: [
				fs.createReadStream(FILE_PATH)
			]
		}
	})
}

// Alter CSV mapping
function columnMapper(name) {
	return {
		mimetype: 'mime_type',
		completiontime: 'completion_time',
		collectiontype: 'collection_type'
	}[name] || name
}

function formatPatch(patch) {
	for (const x in patch) {
		if (patch[x] === '') {
			delete patch[x]
		}
		else {
			patch[x] = formatValue(patch[x])
		}
	}
}

function formatValue(value) {
	if (value === 'true') {
		return true
	}
	else if (value === 'false') {
		return false
	}
	return value
}

// Loop through each row in the CSV and process the item

// Match the item to an existing item and update any metadata

// Find the file: if one exists

// upload it - in place of the previous one.

// Find the thumbnail: if one exists

// upload it - in place of the previous one.

// Match the