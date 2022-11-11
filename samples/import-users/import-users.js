#!/usr/bin/env node
/* eslint no-console: "off"*/

const addUsers = require('./addUsers');
const readJson = require('./readJson');
const extractUserData = require('./extractUserData');
const findOrCreateDomainTeams = require('./findOrCreateDomainTeams');

const forbiddenTeams = ['admin']; // you need to add users manually through the UI for these teams

async function importUsers({usersFilePath}) {
	// Read the users' JSON file and extract the list of users
	const rawUserData = await readJson(usersFilePath);

	// Sanitise user data
	const users = extractUserData({rawUserData, forbiddenTeams});

	if (!users.length) {
		return;
	}

	// Get the list of all teams
	const teams = await findOrCreateDomainTeams({users});

	// Create users
	const updatedUsers = await addUsers({users, teams});

	// Summary
	console.log('------------- Summary -------------');
	const newTeams = Object.values(teams)
		.filter(team => team.isNew)
		.map(team => team.name);
	const {created, updated} = updatedUsers.reduce(
		(accounts, user) => {
			const collection = user.isNew ? accounts.created : accounts.updated;
			collection.push(user.email);
			return accounts;
		},
		{created: [], updated: []}
	);

	if (newTeams.length) {
		console.log('Newly added teams:');
		console.log(newTeams);
	} else {
		console.log('No new team was created!');
	}

	if (created.length) {
		console.log('Newly added user accounts:');
		console.log(created);
	} else {
		console.log('No new user account was created!');
	}

	if (updated.length) {
		console.log('User accounts with updated groups:');
		console.log(updated);
	} else {
		console.log('No user account was updated!');
	}
}

const usersFilePath = process.argv[2];
// const defaultLanguage = process.argv[3]

importUsers({usersFilePath});
