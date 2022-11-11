#!/usr/bin/env node
/* eslint no-console: "off"*/

// This script takes a CSV file as the first argument and processes each row.
// It uses external system meta data related to an asset to update assetDomains table

const api = require('./api');
const parse = require('csv-parse');
const fs = require('fs');
const path = require('path');
const {files} = require('./data-files');

const columns = columns => columns.map(name => name.toLowerCase());

// Loop through and process each file...
asyncForEach(files, processFile);

async function asyncForEach(a, callback) {
	for (let i = 0, len = a.length; i < len; i++) {
		// eslint-disable-next-line no-await-in-loop
		await callback(a[i], i);
	}
}

const VALID_COLUMN_NAMES = ['assetid', 'externalassetid', 'externalassettype'];

const VALID_EXTERNAL_ASSET_TYPES = ['e-learning', 'material', 'video'];

function areColumnNamesValid(row) {
	const sortedColumnNames = Object.keys(row).sort();
	const sortedValidColumnNames = VALID_COLUMN_NAMES.sort(); // in case we add some columns

	return (
		JSON.stringify(sortedColumnNames) ===
		JSON.stringify(sortedValidColumnNames)
	);
}

function validateRecord({assetid, externalassetid, externalassettype}) {
	const errors = [];
	if (!Number.isInteger(assetid)) {
		errors.push('assetid is not a number');
	}

	if (!Number.isInteger(externalassetid)) {
		errors.push('externalassetid is not a number');
	}

	if (!VALID_EXTERNAL_ASSET_TYPES.includes(externalassettype)) {
		errors.push(
			`externalassettype must be one of the type ${VALID_EXTERNAL_ASSET_TYPES.join(
				','
			)}`
		);
	}

	if (errors.length) {
		throw new Error(
			`Validation Error for the fields: \n ${errors.join(',\n')}`
		);
	}
}

function printErrorsForMessage({index, record, errorType, errorMessage}) {
	console.error(`INDEX: ${index}\n`);
	console.error(`RECORD: ${JSON.stringify(record)}\n`);
	console.error(`ERROR_TYPE: ${errorType}\n`);
	console.error(`ERROR: ${JSON.stringify(errorMessage)}\n`);
	console.error(
		'-----------------------------------------------------------------'
	);
}

const normalizersMap = {
	assetid: Number,
	externalassetid: Number,
	externalassettype: value => String(value).toLowerCase(),
};

function normalizeValues(record) {
	return Object.keys(record).reduce((acc, keyName) => {
		const value = record[keyName];
		const updatedValue = normalizersMap[keyName]
			? normalizersMap[keyName](value)
			: value;
		return {...acc, [keyName]: updatedValue};
	}, {});
}
//
// Process a CSV file
//
async function processFile(filePath) {
	console.log(path.basename(filePath));
	return new Promise(accept => {
		// Parse the contents of the CSV file
		const parser = parse(
			{delimiter: ',', columns, relax: true, trim: true},
			async (err, data) => {
				if (err) {
					console.error(err);
					accept();
					return;
				}

				if (!areColumnNamesValid(data[0])) {
					// Missing columns
					console.log(
						`Column names must be: ${VALID_COLUMN_NAMES.join(
							','
						)}. Case insensitive`
					);
					accept();
					return;
				}

				try {
					await asyncForEach(data, async (record, index) => {
						let isRecordValid = false;
						const castedRecord = normalizeValues(record);
						try {
							validateRecord(castedRecord);
							isRecordValid = true;
						} catch (error) {
							printErrorsForMessage({
								index,
								record,
								errorMessage: error.message,
								errorType: 'VALIDATION_ERROR',
							});
						}
						if (!isRecordValid) return;

						try {
							await processRecord(castedRecord);
							console.log([index, 'IMPORTED'].join());
						} catch (error) {
							printErrorsForMessage({
								index,
								record,
								errorMessage: error.error || error.message,
								errorType: 'PATCH_ERROR',
							});
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
async function processRecord({assetid, externalassetid, externalassettype}) {
	const newExternalId = `${externalassetid}:${externalassettype}`;
	const records = await api({
		path: 'api/distributedAssets',
		qs: {
			fields: ['external_ref_id', 'id'],
			filter: {
				asset_id: assetid,
			},
			limit: 1,
		},
	});

	if (!records.data.length) {
		throw new Error('No distributedAssets record has been found');
	}
	const {external_ref_id, id: assetDomainsId} = records.data[0];

	const updatedExternalRefId =
		external_ref_id && external_ref_id.indexOf(newExternalId) === -1
			? `${external_ref_id},${newExternalId}`
			: newExternalId;

	await api({
		method: 'patch',
		path: 'api/distributedAssets',
		qs: {
			filter: {
				id: assetDomainsId,
			},
			limit: 1,
		},
		body: {
			external_ref_id: updatedExternalRefId,
		},
	});
}
