# Import users

Takes a users' JSON file as an input and create accounts for them.

## Importing users
To run the script and import users, please execute the command `./import-users.js users.json` where `users.json` is the the file containing the details for the users to import (see below for an example).

As the script will use the Hub API, it will require the environment variables `DH_TENANT`, `DH_USERNAME`, and `DH_PASSWORD` like the other scripts in the [Samples directory](../).

Example:
```sh
DH_TENANT=beta.5app.com DH_USERNAME=admin@5app.com DH_PASSWORD=AdminPassword  ./import-users.js users.json
```

## Format of the JSON file
The users JSON file must contain a list of users and have at least the following details:

| Attribute          | Type    | Description                                 | Example                       |
|--------------------|---------|---------------------------------------------|-------------------------------|
| `emailAddress`     | String  | Email address (ID of the user)              | admin@5app.com                |
| `firstName`        | String  | First name                                  | Laura                         |
| `lastName`         | String  | Last name                                   | Smith                         |
| `jobFamilyTeam`    | String  | First team to which the user will be added  | Chapter                       |
| `fullJobTitleTeam` | String  | Second team to which the user will be added | Chapter - Post Room Assistant |
| `countryTeam`      | String  | Third team to which the user will be added  | United Kingdom                |
| `invite`           | Boolean | Should we send an invite by email ?         | false                         |


Please note that if one of the teams is `Admin` (case insensitive) then the user will not be added to the team, and a warning will be displayed after executing the script to remind you to add the user manually to the team.

Example:
```json
[
  {
    "fullName": "Lauraine Smith",
    "fullNameTrimmed": "Lauraine Smith",
    "firstNameAuto": "Lauraine",
    "lastNameAuto": "Smith",
    "firstName": "Lauraine",
    "lastName": "Smith",
    "jobTitle": "Executive Assistant",
    "jobFamilyTeam": "Executive",
    "fullJobTitleTeam": "Admin - Executive Assistant",
    "location": "London Corporate Office",
    "countryTeam": "United Kingdom",
    "emailAddress": "lauraine.smith@example.com",
    "invite": true
  },
  {
    "fullName": "Jenny Gobin",
    "fullNameTrimmed": "Jenny Gobin",
    "firstNameAuto": "Jenny",
    "lastNameAuto": "Gobin",
    "firstName": "Jenny",
    "lastName": "Gobin",
    "jobTitle": "Team Assistant, Corporate",
    "jobFamilyTeam": "Assistant",
    "fullJobTitleTeam": "Admin - Team Assistant, Corporate",
    "location": "London Corporate Office",
    "countryTeam": "United Kingdom",
    "emailAddress": "jenny.gobin@example.com",
    "invite": false
  }
]
```

