// Get an instance of the Hub Api
const api = require('./api.js')

async function addUsers({users, teams, forbiddenTeams = []}) {
	if (!users.length) {
		return null // Nothing to do
	}

	// Create accounts by email
	const emails = users.map(user => user.emailAddress)
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
		const {id, isNew} = userIds[user.emailAddress]

		return {
			...user,
			id,
			isNew,
		}
	})

	// Add the user to the right groups and create a profile for new users
	const forbiddenTeamUsers = {}

	for (const user of usersWithIds) {
		const {id, isNew, firstName, lastName, jobFamilyTeam, fullJobTitleTeam, countryTeam, emailAddress} = user
		const allUserTeams = [jobFamilyTeam, fullJobTitleTeam, countryTeam].map(team => team.toLowerCase())
		const teamsToAdd = []

		allUserTeams.forEach(team => {
			if (forbiddenTeams.includes(team)) {
				forbiddenTeamUsers[team] = forbiddenTeamUsers[team] || []
				forbiddenTeamUsers[team].push(emailAddress)
			}
			else {
				teamsToAdd.push(teams[team].name)
			}
		})

		const updatePayload = {
			name: emailAddress, // this is mandatory
			groups: JSON.stringify(teamsToAdd), // the API expects a JSON instead of an Array
			updateGroups: true,
		}

		if (isNew) {
			updatePayload.first_name = firstName
			updatePayload.last_name = lastName
		}

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

	return {
		forbiddenTeamUsers,
		updatedUsers: usersWithIds,
	}
}

module.exports = addUsers
