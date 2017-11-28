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

// Get the file to operate over...
const args = process.argv.slice(2)

if (!args.length) {
	throw new Error('Unknown csv path')
}
// Select a data source
const SOURCE_ASSET_DATA = path.resolve(process.cwd(), args[0])

// Initiate the connection
const hub = new Hub({
	tenant: DH_TENANT,
	username: DH_USERNAME,
	password: DH_PASSWORD
})

// Fields
const fields = ['id', 'asset_id', 'collection_id', 'rank']

const columns = columns => columns.map(name => name.toLowerCase())

// Parse the contents of the CSV file
const parser = parse({delimiter: ',', columns, relax: true}, (err, data) => {

	if (err) {
		return console.error(err)
	}

	const promise = data.reduce((promise, record, index) =>
		promise
			.then(() => processRecord(record))
			.then(() => {
				console.log([index, 'CREATED'].join())
			})
			.catch(resp => {
				console.log([index, 'ERROR', resp.error || resp.message].join())
			}),

	Promise.resolve()
	)

	promise.then(() => {
		// finally
	})
})

fs.createReadStream(SOURCE_ASSET_DATA).pipe(parser)


// Process each row
// This function interprets a normalized record Key=>Value record
// Making requests to functions to store the data
async function processRecord(record) {

	const {
		assetrefid,
		collectionrefid,
		rank
	} = record

	// Get this match
	const filter = {
		asset_id: (await getAssetByRefId(assetrefid)).id,
		collection_id: (await getAssetByRefId(collectionrefid)).id
	}

	let ref = await getCollectionAsset(filter)

	if (ref) {
		if (ref.rank !== +rank) {
			await patchCollectionAsset(filter, {rank})
		}
	}
	else {
		const body = Object.assign({rank}, filter)
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
		.then(resp => {
			if (resp.data.length) {
				return resp.data[0]
			}
			throw new Error(`Cannot find asset refid: ${refid}`)
		})
}