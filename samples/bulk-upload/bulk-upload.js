#!/usr/bin/env node
/*eslint no-console: "off"*/

// This script takes a CSV file as the first argument and processes each row.
// It uses the unique customer reference field to find and patch, or otherwise create anew
// If provided with tags field it will create tags.
// Matches relative path to a thumbnail and uploads
// Same for field

const Hub = require('../../src/api')
const unique = require('tricks/array/unique')
const parse = require('csv-parse')
const fs = require('fs')
const path = require('path')

const {
	CLIENT_ID,
	CLIENT_SECRET,
	TENANT,
	DEFAULT_ROOT_FOLDER_REFID
} = process.env

// Get the file to operate over...
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

// Scope of fields
const fields = [
	'id',
	'name',
	'type',
	'description',
	'parent_id',
	'openiniframe',
	'disabledownload',
	'mime_type',
	'collection_type',
	'completion_time',
	'weburl',
	'refid'
]

const columns = columns => columns.map(name => name.toLowerCase()).map(columnMapper)

const errors = []

// Parse the contents of the CSV file
const parser = parse({delimiter: ',', columns, relax: true}, (err, data) => {

	if (err) {
		return console.error(err)
	}

	const promise = data.reduce((promise, record, index) => promise.then(() => processRecord(record))
		.then(resp => {
			console.log(`${index}: CREATED`, resp)
		})
		.catch(resp => {
			errors.push({record, error: resp.error || resp.message})
			console.error(`${index}: ERROR`, resp.error || resp.message)
		}), Promise.resolve())

	promise.then(() => {
		// Finally
		console.log('ERRORS', errors)
	})
})

fs.createReadStream(SOURCE_ASSET_DATA).pipe(parser)


// Process each row
// This function interprets a normalized record Key=>Value record
// Making requests to functions to store the data
async function processRecord(record) {

	// Name;Description;Type;RefID;ParentRefID;Tags;ThumbnailPath;WebURL;OpenInIFrame;Path;DisableDownload;MimeType;CompletionTime;CollectionType
	const {
		refid,
		parentrefid,
		tags,
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
		await patchAssetRecord(asset, patch)
	}

	// Tags
	if (tags) {
		await setTags(asset.id, unique(tags.split(/,\s+/).map(s => s.trim())))
	}

	// Thumbnail
	if (thumbnailpath) {
		await upload(asset.id, 'thumb', thumbnailpath)
	}

	// File Upload
	if (path) {
		await upload(asset.id, 'upload', path)
	}

	// Return a reference
	return asset
}

// Retrieve the asset using refid
async function getAssetByRefId(refid) {

	return hub.api({
		path: 'api/assets',
		qs: {
			fields,
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
			fields
		},
		body
	})
}

// Patch entry
async function patchAssetRecord(asset, patch) {

	// Find the diff of the second object from the first
	const body = diffObject(asset, patch)

	// If there is no change dont do anything
	if (Object.keys(body).length === 0) {
		return
	}

	// Run
	return hub.api({
		method: 'patch',
		path: `api/assets/${asset.id}`,
		body
	})
}

// Upload
// POST's a file to be associated with a given asset
async function upload(id, type, filePath) {

	// The path given is relative to the SOURCE_ASSET_DATA
	const FILE_PATH = path.resolve(SOURCE_ASSET_DATA.replace(/[^/]+$/, ''), formatFilePath(filePath))

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


// Tags
// Define tags on a given asset
// If the tags do not exist, create them...
async function setTags(asset_id, tags) {

	const tag_ids = await getTagIds(tags)

	// Get the tags associacted with the asset
	const assigned_tags = await hub.api({
		path: 'api/assetTags',
		qs: {
			fields: ['id', 'tag_id'],
			filter: {
				asset_id
			},
			limit: 1000
		}
	})

	const add =	tag_ids.filter(id => !assigned_tags.data.find(assetTag => assetTag.tag_id === id))

	if (add.length) {
		await hub.api({
			method: 'post',
			path: 'api/assetTags',
			body: add.map(tag_id => ({asset_id, tag_id}))
		})
	}
}

// Get Tags
// Given a list of tags, this will return the list of ID's for those tags,
// Creates new ones if required
async function getTagIds(tags) {

	// Get the tags
	const match_tags = await hub.api({
		path: 'api/tags',
		qs: {
			fields: ['id', 'name'],
			filter: {
				name: tags
			}
		}
	})

	const matches = match_tags.data

	// Show tags...
	const new_tags = tags.filter(tag => !matches.find(item => item.name.toLowerCase() === tag.toLowerCase()))

	if (new_tags.length) {

		const created_tags = await hub.api({
			method: 'post',
			path: 'api/tags',
			qs: {
				fields: ['id', 'name']
			},
			body: new_tags.map(name => ({name}))
		})

		// Merge new and existing
		matches.push(...created_tags.data)
	}

	// Return id's
	return matches.map(item => item.id)
}


// Alter CSV mapping
// Change the columnnames of the CSV to match those of the api
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
		else if (x === 'completion_time') {
			patch[x] = formatTime(patch[x])
		}
		else {
			patch[x] = formatValue(patch[x])
		}
	}
}

// Convert string 'true' and 'false', to equivalent Boolean
function formatValue(value) {
	if (value === 'true') {
		return true
	}
	else if (value === 'false') {
		return false
	}
	return value
}

// Format Time
// 00:00:00
function formatTime(value) {
	return value.replace(/^([\d]{2}):([\d]{2}):([\d]{2})$/, (patt, h, m, s) => ((((+h * 60) + +m) * 60) + +s))
}

// Format File Path
function formatFilePath(path) {
	return path.replace(/^\//, (() => './'))
}

// Return the properties in the second argument which does not match those in the first.
function diffObject(base, obj) {
	const diff = {}
	for (const x in obj) {
		if (obj[x] != base[x]) { // eslint-disable-line eqeqeq
			diff[x] = obj[x]
		}
	}
	return diff
}