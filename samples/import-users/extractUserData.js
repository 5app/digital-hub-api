/* eslint no-console: "off"*/

const {isEmail} = require('validator');

function extractUserData({rawUserData, forbiddenTeams = []}) {
	const users = [];
	const invalidaEmails = [];
	const usersWithForbiddenTeams = {};
	const usersWithoutTeams = [];
	const duplicateTeamNames = [];
	const duplicateEmails = [];
	const emailCounts = {};
	const allTeams = {};

	// Extra user details
	rawUserData.forEach(user => {
		const email = user.emailAddress.trim();
		const firstName = user.firstName.trim();
		const lastName = user.lastName.trim();
		const teams = [
			user.jobFamilyTeam.trim(),
			user.fullJobTitleTeam.trim(),
			user.countryTeam.trim(),
		].filter(team => !!team); // only keep non-empty team names

		if (!isEmail(email)) {
			invalidaEmails.push(email || '<no email>');
		}

		emailCounts[email] = emailCounts[email] || 0;
		emailCounts[email] += 1;

		if (!teams.length) {
			usersWithoutTeams.push(email);
		}

		teams.forEach(team => {
			const teamName = team.toLowerCase();

			// Get all the variations for a team name
			allTeams[teamName] = allTeams[teamName] || new Set();
			allTeams[teamName].add(team);

			if (forbiddenTeams.includes(teamName)) {
				usersWithForbiddenTeams[teamName] =
					usersWithForbiddenTeams[teamName] || new Set();
				usersWithForbiddenTeams[teamName].add(email);
			}
		});

		users.push({
			email,
			firstName,
			lastName,
			teams,
		});
	});

	// Check if there are duplicate emails (2 accounts with the same email address)
	Object.keys(emailCounts).forEach(email => {
		if (emailCounts[email] > 1) {
			duplicateEmails.push(email);
		}
	});

	// Check if the same team name was used more than once but with different case (e.g. "TeamName" and "teamname")
	Object.keys(allTeams).forEach(name => {
		const teamNameVariations = allTeams[name];

		if (teamNameVariations.size > 1) {
			// the same name was written in 2 or more variations
			duplicateTeamNames.push({
				name,
				variations: [...teamNameVariations],
			});
		}
	});

	const doNotImportAccounts =
		invalidaEmails.length ||
		Object.keys(usersWithForbiddenTeams).length ||
		usersWithoutTeams.length ||
		duplicateEmails.length ||
		duplicateTeamNames.length;

	if (doNotImportAccounts) {
		console.error('User import cancelled!');

		if (invalidaEmails.length) {
			console.error('\nInvalid email addresses:');
			console.error(invalidaEmails);
		}

		if (Object.keys(usersWithForbiddenTeams).length) {
			console.error(
				'\nSome of the user teams are restricted and you cannot user them:'
			);
			Object.keys(usersWithForbiddenTeams).forEach(team => {
				const teamMembers = [...usersWithForbiddenTeams[team]];

				console.error(`> Team '${team}':`);
				console.error(teamMembers);
			});
		}

		if (usersWithoutTeams.length) {
			console.error('\nUsers without teams:');
			console.error(usersWithoutTeams);
		}

		if (duplicateEmails.length) {
			console.error('\nDuplicate emails:');
			console.error(duplicateEmails);
		}

		if (duplicateTeamNames.length) {
			console.error(
				'\nTeam names that were used in many variations (please use only one variation):'
			);
			duplicateTeamNames.forEach(details => {
				console.log(`>> '${details.name}' variations:`);
				details.variations.forEach((name, index) => {
					console.log(`>>> Name ${index + 1}: ${name}`);
				});
			});
		}

		return [];
	}

	return users;
}

module.exports = extractUserData;
