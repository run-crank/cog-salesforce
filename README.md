# Salesforce Cog

This is a [Crank][what-is-crank] Cog for Salesforce, providing steps and
assertions for you to validate the state and behavior of your Salesforce
instance.

* [Installation](#installation)
* [Usage](#usage)
* [Development and Contributing](#development-and-contributing)

## Installation

Ensure you have the `crank` CLI and `docker` installed and running locally,
then run the following.  You'll be prompted to enter your Salesforce
credentials once the Cog is successfully installed.

```shell-session
$ crank cog:install automatoninc/salesforce
```

Note: you can always re-authenticate later.

## Usage

### Authentication
<!-- authenticationDetails -->
You will be asked for the following authentication details on installation.

- **instanceUrl**: Login/instance URL (e.g. https://na1.salesforce.com)
- **clientId**: OAuth2 Client ID
- **clientSecret**: OAuth2 Client Secret
- **username**: Username
- **password**: Password

```shell-session
# Re-authenticate by running this
$ crank cog:auth automatoninc/salesforce
```
<!-- authenticationDetailsEnd -->

### Steps
<!-- stepDetails -->
<h4 id="CreateLead">Create a Salesforce Lead</h4>

- **Expression**: `create a salesforce lead`
- **Expected Data**:
  - `lead`: A map of field names to field values
- **Step ID**: `CreateLead`

<h4 id="DeleteLead">Delete a Salesforce Lead</h4>

- **Expression**: `delete the (?<email>.+) salesforce lead`
- **Expected Data**:
  - `email`: Lead's email address
- **Step ID**: `DeleteLead`

<h4 id="LeadFieldEquals">Check a field on a Salesforce Lead</h4>

- **Expression**: `the (?<field>[a-zA-Z0-9_]+) field on salesforce lead (?<email>.+) should be (?<expectedValue>.+)`
- **Expected Data**:
  - `email`: Lead's email address
  - `field`: Field name to check
  - `expectedValue`: Expected field value
- **Step ID**: `LeadFieldEquals`
<!-- stepDetailsEnd -->

## Development and Contributing
Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change. Please make sure to add or update tests
as appropriate.

### Setup

1. Install node.js (v12.x+ recommended)
2. Clone this repository.
3. Intsall dependencies via `npm install`
4. Run `npm start` to validate the Cog works locally (`ctrl+c` to kill it)
5. Run `crank cog:install --source=local --local-start-command="npm start"` to
   register your local instance of this Cog. You may need to append a `--force`
   flag or run `crank cog:uninstall automatoninc/salesforce` if you've already
   installed the distributed version of this Cog.

### Adding/Modifying Steps
Modify code in `src/steps` and validate your changes by running
`crank cog:step automatoninc/salesforce` and selecting your step.

To add new steps, create new step classes in `src/steps`. Use existing steps as
a starting point for your new step(s). Note that you will need to run
`crank registry:rebuild` in order for your new steps to be recognized.

Always add tests for your steps in the `test/steps` folder. Use existing tests
as a guide.

### Modifying the API Client or Authentication Details
Modify the ClientWrapper class at `src/client/client-wrapper.ts`.

- If you need to add or modify authentication details, see the
  `expectedAuthFields` static property.
- If you need to expose additional logic from the wrapped API client, add a new
  ublic method to the wrapper class, which can then be called in any step.
- It's also possible to swap out the wrapped API client completely. You should
  only have to modify code within this clase to achieve that.

Note that you will need to run `crank registry:rebuild` in order for any
changes to authentication fields to be reflected. Afterward, you can
re-authenticate this Cog by running `crank cog:auth automatoninc/salesforce`

### Tests and Housekeeping
Tests can be found in the `test` directory and run like this: `npm test`.
Ensure your code meets standards by running `npm run lint`.

[what-is-crank]: https://crank.run?utm_medium=readme&utm_source=automatoninc%2Fsalesforce
