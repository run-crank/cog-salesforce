# Salesforce Cog

[![CircleCI](https://circleci.com/gh/run-crank/cog-salesforce/tree/master.svg?style=svg)](https://circleci.com/gh/run-crank/cog-salesforce/tree/master)

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
<h4 id="CreateAccount">Create a Salesforce Account</h4>

- **Expression**: `create a salesforce account`
- **Expected Data**:
  - `account`: A map of field names to field values
- **Step ID**: `CreateAccount`

<h4 id="DeleteAccount">Delete a Salesforce Account</h4>

- **Expression**: `delete the salesforce account with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)`
- **Expected Data**:
  - `field`: the name of the field used to identify the account
  - `identifier`: the value of the field
- **Step ID**: `DeleteAccount`

<h4 id="AccountFieldEquals">Check a field on a Salesforce Account</h4>

- **Expression**: `the (?<field>[a-zA-Z0-9_]+) field on salesforce account with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should be (?<expectedValue>.+)`
- **Expected Data**:
  - `idField`: The field used to search/identify the account
  - `identifier`: The value of the id field to use when searching
  - `field`: The name of the field to check
  - `expectedValue`: The expected value of the field
- **Step ID**: `AccountFieldEquals`

<h4 id="CampaignMemberFieldEquals">Check a field on a Salesforce Campaign Member</h4>

- **Expression**: `the salesforce lead (?<email>.+) should have campaign member (?<field>.+) set to (?<expectedValue>.+) on campaign (?<campaignId>.+)`
- **Expected Data**:
  - `email`: Lead's email address
  - `campaignId`: Campaign ID
  - `field`: Field name to check
  - `expectedValue`: Expected field value
- **Step ID**: `CampaignMemberFieldEquals`

<h4 id="CampaignMemberCampaignIdEquals">Check Salesforce Campaign Membership</h4>

- **Expression**: `the salesforce lead (?<email>.+) should be a member of campaign (?<campaignId>.+)`
- **Expected Data**:
  - `email`: Lead's email address
  - `campaignId`: Campaign ID
- **Step ID**: `CampaignMemberCampaignIdEquals`

<h4 id="ContactCreateStep">Create a Salesforce Contact</h4>

- **Expression**: `create a salesforce contact`
- **Expected Data**:
  - `contact`: A map of field names to field values
- **Step ID**: `ContactCreateStep`

<h4 id="ContactDeleteStep">Delete a Salesforce Contact</h4>

- **Expression**: `delete the (?<email>.+) salesforce contact`
- **Expected Data**:
  - `email`: Contact's Email Address
- **Step ID**: `ContactDeleteStep`

<h4 id="ContactFieldEqualsStep">Check a field on a Salesforce Contact</h4>

- **Expression**: `the (?<field>[a-zA-Z0-9_]+) field on salesforce contact (?<email>.+) should be (?<expectedValue>.+)`
- **Expected Data**:
  - `email`: Contact's email address
  - `field`: Field name to check
  - `expectedValue`: Expected field value
- **Step ID**: `ContactFieldEqualsStep`

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

<h4 id="CreateOpportunity">Create a Salesforce Opportunity</h4>

- **Expression**: `create a salesforce opportunity`
- **Expected Data**:
  - `opportunity`: A map of field names to field values
- **Step ID**: `CreateOpportunity`

<h4 id="DeleteOpportunity">Delete a Salesforce Opportunity</h4>

- **Expression**: `delete the salesforce opportunity with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)`
- **Expected Data**:
  - `field`: the name of the field used to identify the opportunity
  - `identifier`: the value of the field
- **Step ID**: `DeleteOpportunity`

<h4 id="OpportunityFieldEquals">Check a field on a Salesforce Opportunity</h4>

- **Expression**: `the (?<field>[a-zA-Z0-9_]+) field on salesforce opportunity with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should be (?<expectedValue>.+)`
- **Expected Data**:
  - `idField`: The field used to search/identify the opportunity
  - `identifier`: The value of the id field to use when searching
  - `field`: The name of the field to check
  - `expectedValue`: The expected value of the field
- **Step ID**: `OpportunityFieldEquals`
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
