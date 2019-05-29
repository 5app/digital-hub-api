// Get an instance of the Hub Api
const api = require('./api.js')

async function addUsers({users, teams}) {
	if (!users.length) {
		return null // Nothing to do
	}

	// Create accounts by email
	const emails = users.map(user => user.email)
	const {success: newlyCreatedUsers, exist: existentUsers} = await api({
		method: 'post',
		path: 'addUsers',
		body: {
			users: emails,
			send_email: false,
		},
	})

	// Retrieve the IDs of our users (existing and new ones)
	const userIds = {}

	newlyCreatedUsers.forEach(user => {
		userIds[user.name] = {isNew: true, id: user.id}
	})

	existentUsers.forEach(user => {
		userIds[user.name] = {isNew: false, id: user.id}
	})

	const usersWithIds = users.map(user => {
		const {id, isNew} = userIds[user.email]

		return {
			...user,
			id,
			isNew,
		}
	})

	// Add the user to the right groups and create a profile for new users
	for (const user of usersWithIds) {
		const {id, isNew, firstName, lastName, email, teams: userTeams} = user
		const normalisedTeamNames = userTeams.map(team => team.toLowerCase())
		const teamsToAdd = normalisedTeamNames.map(team => teams[team].name)

		const updatePayload = {
			name: email, // this is mandatory
			groups: JSON.stringify(teamsToAdd), // the API expects a JSON instead of an Array
			updateGroups: true,
		}

		if (isNew) {
			updatePayload.first_name = firstName
			updatePayload.last_name = lastName
		}

		// eslint-disable-next-line no-await-in-loop
		await api({
			method: 'put',
			path: `users/${id}`,
			body: updatePayload,
		})
	}

	// Invite users (the API will not send invites to previously invited users)
	const toInvite = usersWithIds
		.filter(user => user.invite && user.isNew)
		.map(user => user.id)

	if (toInvite.length) {
		await api({
			method: 'post',
			path: 'invites',
			body: {
				ids: toInvite,
			},
		})
	}

	return usersWithIds
}

module.exports = addUsers
