#!/usr/bin/env node
/* eslint no-console: "off"*/

// This script takes a CSV file as the first argument and processes each row.
// It uses the unique customer reference field to find and patch, or otherwise create anew
// If provided with tags field it will create tags.
// Matches relative path to a thumbnail and uploads
// Same for field

const api = require('./api');
const parse = require('csv-parse');
const fs = require('node:fs');
const path = require('node:path');

// Fields
const fields = ['id', 'asset_id', 'collection_id', 'rank'];

// Format columns of CSV
function columns(columns) {
	return columns.map(name => name.toLowerCase());
}

const {files} = require('./datafiles');

// Loop through and process each file...
asyncForEach(files, processFile);

async function asyncForEach(a, callback) {
	for (let i = 0, len = a.length; i < len; i++) {
		// eslint-disable-next-line no-await-in-loop
		await callback(a[i], i);
	}
}

//
// Process a CSV file
//
async function processFile(filePath) {
	console.log(path.basename(filePath));

	return new Promise(accept => {
		// Parse the contents of the CSV file
		const parser = parse(
			{delimiter: ',', columns, relax: true},
			async (err, data) => {
				if (err) {
					console.error(err);
					accept();
					return;
				}

				if (
					!('assetrefid' in data[0] && 'collectionrefid' in data[0])
				) {
					// Missing columns
					console.log('Missing columns assetrefid, collectionrefid');
					accept();
					return;
				}

				try {
					await asyncForEach(data, async (record, index) => {
						try {
							await processRecord(record);
							console.log([index, 'CREATED'].join());
						} catch (e) {
							console.log(
								[index, 'ERROR', e.error || e.message].join()
							);
						}
					});
				} catch {
					// Ignore
				}

				accept();
			}
		);

		fs.createReadStream(filePath).pipe(parser);
	});
}

// Process each row
// This function interprets a normalized record Key=>Value record
// Making requests to functions to store the data
async function processRecord(record) {
	const {assetrefid, collectionrefid, status, ...props} = record;

	// Get this match
	const filter = {
		asset_id: (await getAssetByRefId(assetrefid)).id,
		collection_id: (await getAssetByRefId(collectionrefid)).id,
	};

	let ref = await getCollectionAsset(filter);

	// Delete command
	if (status === 'DELETE') {
		const action = 'deleted';
		const messages = [];

		if (ref && ref.id) {
			await deleteCollectionAsset(ref.id);
		} else {
			// Nothing to do
			messages.push('Not Found');
		}

		return {
			action,
			messages,
		};
	}

	if (ref) {
		await patchCollectionAsset({id: ref.id}, props);
	} else {
		const body = Object.assign(props, filter);
		ref = await postCollectionAsset(body);
	}

	return ref;
}

// Retrieve the asset using refid
async function getCollectionAsset(filter) {
	const resp = await api({
		path: 'api/assetCollections',
		qs: {
			fields,
			filter,
			limit: 1,
		},
	});

	return resp.data[0];
}

// Retrieve the asset using refid
async function patchCollectionAsset(filter, body) {
	if (Object.keys(body).length === 0) {
		return;
	}

	return api({
		method: 'patch',
		path: 'api/assetCollections',
		qs: {
			filter,
			limit: 1,
		},
		body,
	});
}

// Retrieve the asset using refid
async function postCollectionAsset(body) {
	return api({
		method: 'post',
		path: 'api/assetCollections',
		qs: {
			fields,
			limit: 1,
		},
		body,
	});
}

// Retrieve the asset using refid
async function deleteCollectionAsset(id) {
	return api({
		method: 'delete',
		path: `api/assetCollections/${id}`,
	});
}

// Retrieve the asset using refid
async function getAssetByRefId(refid) {
	if (!refid) {
		throw new Error('Missing reference');
	}

	const resp = await api({
		path: 'api/assets',
		qs: {
			fields: ['id'],
			filter: {
				refid,
			},
			limit: 1,
		},
	}).catch(err => {
		console.error(err);
		throw new Error(`Failed to retrieve the refid: ${refid}`);
	});

	if (resp.data.length) {
		return resp.data[0];
	}
	throw new Error(`Cannot find asset refid: ${refid}`);
}
