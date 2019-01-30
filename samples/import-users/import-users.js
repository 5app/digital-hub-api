#!/usr/bin/env node
/*eslint no-console: "off"*/

const addUsers = require('./addUsers')
const readJson = require('./readJson')
const validateUserData = require('./validateUserData')
const findOrCreateDomainTeams = require('./findOrCreateDomainTeams')

const forbiddenTeams = ['admin'] // you need to add users manually through the UI for these teams

async function importUsers({usersFilePath}) {
	// Read the users' JSON file and extract the list of users
	const users = await readJson(usersFilePath)

	// Validate user data
	validateUserData({users})

	// Get the list of all teams
	const teams = await findOrCreateDomainTeams({users, forbiddenTeams})

	// Create users
	const {forbiddenTeamUsers, updatedUsers} = await addUsers({users, teams, forbiddenTeams})

	// Summary
	const newTeams = Object.values(teams).filter(team => team.isNew).map(team => team.name)
	const newAccounts = updatedUsers.filter(user => user.isNew).map(user => user.emailAddress)
	const updatedAccounts = updatedUsers.filter(user => !user.isNew).map(user => user.emailAddress)

	console.log('Newly added teams:')
	console.log(newTeams)

	console.log('Newly added user accounts:')
	console.log(newAccounts)

	console.log('User accounts with updated groups:')
	console.log(updatedAccounts)

	console.log('User accounts that need to be manually added (forbidden teams):')
	console.log(forbiddenTeamUsers)
}

const usersFilePath = process.argv[2]
// const defaultLanguage = process.argv[3]

importUsers({usersFilePath})