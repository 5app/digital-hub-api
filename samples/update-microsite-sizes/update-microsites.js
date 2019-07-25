#!/usr/bin/env node

const program = require('commander')
const updateMicrosites = require('./updateMicrosites')

program
	.option('-d, --dry-run', 'Dry run: show microsites to update and do not update the DB')
	.parse(process.argv)

updateMicrosites({skipDbUpdate: program.dryRun})
