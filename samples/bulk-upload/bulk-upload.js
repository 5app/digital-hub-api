#!/usr/bin/env node
/*eslint no-console: "off"*/

// This script takes a CSV file as the first argument and processes each row.
// It uses the unique customer reference field to find and patch, or otherwise create anew
// If provided with tags field it will create tags.
// Matches relative path to a thumbnail and uploads
// Same for field

// Import the DH API
const Hub = require('../../src/api')

// Reading files from URL's
const request = require('request')
	.defaults({
		forever: true
	})

// Import tools for parsing CSV files
const parse = require('csv-parse')
const fs = require('fs')
const path = require('path')

// Import Utilities
const unique = require('tricks/array/unique')

// Assign the ENV VARS
const {
	DH_USERNAME,
	DH_PASSWORD,
	DH_TENANT,
	PARENT_REFID
} = process.env

// Configure an instance of the DH Api
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD
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

// Format columns of CSV
const columns = columns => columns.map(name => name.toLowerCase()).map(columnMapper)

const {
	base,
	files
} = require('./datafiles')

const BASE_PATH = base

// Iterate through the filepaths in the filelist
// Triggering `processFile`
files.reduce((promise, file) => promise.then(() => processFile(file)), Promise.resolve())


// Process a file
// Given a full path to a CSV file
// Open it, perform rudimentary tests, convert each row to hash and pass to `processRecord`
// Writes out the resolution, and any errors to stdout
async function processFile(file) {

	console.log(path.basename(file))

	return new Promise(accept => {

		// Parse the contents of the CSV file
		const parser = parse({delimiter: ',', columns, relax: true}, (err, data) => {

			// Cancel if there was an error parsing the document
			if (err) {
				console.error('Error parsing file', err)
				accept()
				return
			}

			// Cancel if the required column is missing
			if (!('refid' in data[0])) {
				console.error('Ignoring file: Missing column refid')
				accept()
				return
			}

			console.log(`Processing ${data.length} records`)

			// Run through the entries
			const promise = data.reduce((promise, record) => promise.then(() => processRecord(record))
				.then(resp => ([resp.refid, resp.action, (resp.messages || []).join(' - ')]))
				.catch(err => {
					return [record.refid, 'ERROR', err.toString()]
				})
				.then(fields => console.log(fields.map(csvCell).join(',')))
				, Promise.resolve())

			promise.then(accept, accept)
		})

		// Stream file...
		fs.createReadStream(file).pipe(parser)
	})

}


// Process each hash
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
		status,
		...patch
	} = record

	// Get the reference id for this record
	if (!refid) {
		throw new Error('Missing refid')
	}

	// Get the Asset
	let asset = await getAssetByRefId(refid)

	// Delete command
	if (status === 'DELETE') {

		const action = 'deleted'
		const messages = []

		if (asset && asset.id) {
			await deleteAssetRecord(asset.id)
		}
		else {
			// Nothing to do
			messages.push('Not Found')
		}

		return {
			refid,
			action,
			messages
		}
	}

	// Set parent
	if (typeof parentrefid !== 'undefined') {

		const ParentRefID = parentrefid || PARENT_REFID || null

		// Get the parent...D
		if (ParentRefID) {
			const parent = await getAssetByRefId(ParentRefID)

			// If there is no parent
			if (!parent) {
				throw new Error(`Cannot find parent ref: ${ParentRefID}`)
			}

			// Set parent id
			patch.parent_id = parent.id
		}
		else if (ParentRefID === null) {
			patch.parent_id = null
		}
	}

	// ref id
	patch.refid = refid

	// format
	formatPatch(patch)

	// Resp
	let action

	// If the asset does not exist
	if (!asset) {

		// Expect the minimum fields to be defined
		verify(patch, {
			name: true,
			parent_id: true,
			type: true
		})

		// Create a new record
		asset = await createAssetRecord(patch)

		// Asset Action
		action = 'created'
	}
	else {
		// Patch record
		await patchAssetRecord(asset, patch)

		// Action
		action = 'patched'
	}

	// Additional operations
	// These will not fail the asset build, but will report errors as notes
	const messages = []
	const catchErrs = err => messages.push(err.message)

	// Tags
	if (tags) {
		await setTags(asset.id, unique(tags.split(/[,.]\s*/).map(s => s.trim()).filter(x => !!x)))
			.catch(catchErrs)
	}

	// Thumbnail
	if (thumbnailpath) {
		await upload(asset.id, 'thumb', thumbnailpath)
			.catch(catchErrs)
	}

	// File Upload
	if (path) {
		await upload(asset.id, 'upload', path)
			.catch(catchErrs)
	}

	// Return a reference
	return {
		refid,
		action,
		messages
	}
}

// Retrieve the asset using refid
async function getAssetByRefId(refid) {

	if (!refid) {
		throw new Error('Missing reference')
	}

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

// Create an asset record
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

// Patch a asset record
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


// Delete asset record
async function deleteAssetRecord(id) {

	// Run
	return hub.api({
		method: 'delete',
		path: `api/assets/${id}`
	})
}


// Upload File or Thumbnail + Associate w/ Asset
async function upload(id, type, filePath) {

	let file

	// Is this file path an HTTP URL?
	if (filePath.match(/^https?:\/\//)) {

		// Promise...
		// Pipe file to destination...
		file = request.get(filePath).on('error', err => console.error(err))
	}
	else {
		// The path given is relative to the SOURCE_ASSET_DATA
		const FILE_PATH = path.resolve(BASE_PATH, formatFilePath(filePath))

		if (!fs.existsSync(FILE_PATH)) {
			throw new Error(`Missing ${type} file: ${filePath}`)
		}

		file = fs.createReadStream(FILE_PATH)
	}

	// Get the file
	return hub.api({
		method: 'post',
		path: `asset/${id}/${type}`,
		formData: {
			fileupload: [file]
		}
	}).catch(err => {
		console.error(err)
		throw new Error(`Failed ${type} ${filePath}`)
	})
}


// Tags
// Define tags on a given asset
// If the tags do not exist, create them...
async function setTags(asset_id, tags) {

	// Get the id's for the incoming tags
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
			},
			limit: tags.length
		}
	})

	const matches = match_tags.data

	// Existing tags
	const existing_tags = match_tags.data.map(tag => tag.name)

	// Get the diff
	const new_tags = diff(existing_tags, tags, (a, b) => fts(a) === fts(b))

	if (new_tags.length) {

		const created_tags = await hub.api({
			method: 'post',
			path: 'api/tags',
			qs: {
				fields: ['id', 'name']
			},
			body: new_tags.map(name => ({name}))
		}).catch(() => {
			console.error('TAGS ERROR', tags, existing_tags, new_tags)
			console.error('TAGS Formatted', tags.map(fts), existing_tags.map(fts))
			throw new Error(`Failed to create new tags: ${new_tags}`)
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

function verify(obj, rule, name) {

	// Verify can take
	if (typeof rule === 'object' && Object.keys(rule).length) {
		for (const x in rule) {
			verify(obj[x], rule[x], x)
		}
		return
	}

	if (rule === true && typeof obj === 'undefined') {
		throw new Error(`Validation failed: ${name} is undefined`)
	}

}

function csvCell(value) {
	return value
}

function fts(str) {
	return removeAccents(str.toLowerCase().replace())
}

function removeAccents(p) {
	const c = 'áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÖÔÚÙÛÜÇ'
	const s = 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
	let n = ''
	for (let i = 0; i < p.length; i++) {
		try {
			if (c.search(p.substr(i, 1)) >= 0) {
				n += s.substr(c.search(p.substr(i, 1)), 1)
			}
			else {
				n += p.substr(i, 1)
			}
		}
		catch (e) {
			// Continue
		}
	}
	return n
}

function diff(arrA, arrB, compare = (a, b) => a === b) {
	return arrB.filter(b => !arrA.find(a => compare(a, b)))
}