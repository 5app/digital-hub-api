// Get an instance of the Hub Api
const api = require('./api.js')

async function findOrCreateDomainTeams({users, forbiddenTeams = []}) {
	// Get users' teams
	const uniqueTeams = new Set()

	users.forEach(({jobFamilyTeam, fullJobTitleTeam, countryTeam}) => {
		uniqueTeams.add(jobFamilyTeam.trim())
		uniqueTeams.add(fullJobTitleTeam.trim())
		uniqueTeams.add(countryTeam.trim())
	})

	const teams = [...uniqueTeams]

	// Get the list of all known teams from the the DB
	const {data: domainTeams} = await api({
		path: 'api/teams',
		qs: {
			fields: ['id', 'name'],
		}
	})

	// Generate a map of team names for quicker searches/filtering
	const allTeams = domainTeams.reduce((teamsMap, team) => {
		teamsMap[team.name.toLowerCase()] = {
			name: team.name,
			id: team.id,
			isNew: false,
		}

		return teamsMap
	}, {})

	// Get the list of teams that we need to create (unknown teams)
	// const allTeamNames = teams.map(name => name.toLowerCase());
	const toBeCreated = teams
		.filter(teamName => {
			const name = teamName.toLowerCase()

			return name && !allTeams[name] && !forbiddenTeams.includes(name)
		})

	// Create the new teams
	if (toBeCreated.length) {
		const teamCreationPayload = toBeCreated.map(name => ({name}))
		const {data: newTeams} = await api({
			method: 'POST',
			path: 'api/teams',
			body: teamCreationPayload,
			qs: {
				fields: ['id', 'name'],
			}
		})

		// Add the newly created names and IDs to the map of all teams
		newTeams.forEach(team => {
			allTeams[team.name.toLowerCase()] = {
				name: team.name,
				id: team.id,
				isNew: true,
			}
		})
	}

	return allTeams
}

module.exports = findOrCreateDomainTeams
