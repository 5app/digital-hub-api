#!/usr/bin/env node
/*eslint no-console: "off"*/

// This script takes a CSV file as the first argument and processes each row.
// It uses the unique customer reference field to find and patch, or otherwise create anew
// If provided with tags field it will create tags.
// Matches relative path to a thumbnail and uploads
// Same for field

const Hub = require('../../src/api')
const parse = require('csv-parse')
const fs = require('fs')
const path = require('path')

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

// Fields
const fields = ['id', 'asset_id', 'collection_id', 'rank']

const columns = columns => columns.map(name => name.toLowerCase())

const {
	files
} = require('./datafiles')

files.reduce((promise, file) => promise.then(() => processFile(file)), Promise.resolve())

//
// Process a CSV file
//
async function processFile(filePath) {

	console.log(path.basename(filePath))

	return new Promise(accept => {

		// Parse the contents of the CSV file
		const parser = parse({delimiter: ',', columns, relax: true}, (err, data) => {

			if (err) {
				console.error(err)
				accept()
				return
			}

			if (!('assetrefid' in data[0] && 'collectionrefid' in data[0])) {
				// Missing columns
				console.log('Missing columns assetrefid, collectionrefid')
				accept()
				return
			}

			data.reduce((promise, record, index) =>
				promise
					.then(() => processRecord(record))
					.then(() => {
						console.log([index, 'CREATED'].join())
					})
					.catch(resp => {
						console.log([index, 'ERROR', resp.error || resp.message].join())
					}),

			Promise.resolve()
			).then(accept, accept)
		})

		fs.createReadStream(filePath).pipe(parser)
	})
}

// Process each row
// This function interprets a normalized record Key=>Value record
// Making requests to functions to store the data
async function processRecord(record) {

	const {
		assetrefid,
		collectionrefid,
		...props
	} = record

	// Get this match
	const filter = {
		asset_id: (await getAssetByRefId(assetrefid)).id,
		collection_id: (await getAssetByRefId(collectionrefid)).id
	}

	let ref = await getCollectionAsset(filter)

	if (ref) {
		await patchCollectionAsset({id: ref.id}, props)
	}
	else {
		const body = Object.assign(props, filter)
		ref = await postCollectionAsset(body)
	}

	return ref
}

// Retrieve the asset using refid
async function getCollectionAsset(filter) {

	return hub.api({
		path: 'api/assetCollections',
		qs: {
			fields,
			filter,
			limit: 1
		}
	})
		.then(resp => resp.data[0])
}


// Retrieve the asset using refid
async function patchCollectionAsset(filter, body) {

	if (Object.keys(body).length === 0) {
		return
	}

	return hub.api({
		method: 'patch',
		path: 'api/assetCollections',
		qs: {
			filter,
			limit: 1
		},
		body
	})
}

// Retrieve the asset using refid
async function postCollectionAsset(body) {

	return hub.api({
		method: 'post',
		path: 'api/assetCollections',
		qs: {
			fields,
			limit: 1
		},
		body
	})
}


// Retrieve the asset using refid
async function getAssetByRefId(refid) {

	if (!refid) {
		throw new Error('Missing reference')
	}

	return hub.api({
		path: 'api/assets',
		qs: {
			fields: ['id'],
			filter: {
				refid
			},
			limit: 1
		}
	})
		.catch(err => {
			console.error(err)
			throw new Error(`Failed to retrieve the refid: ${refid}`)
		})
		.then(resp => {
			if (resp.data.length) {
				return resp.data[0]
			}
			throw new Error(`Cannot find asset refid: ${refid}`)
		})
}