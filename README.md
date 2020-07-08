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
You will be asked for the following authentication details on installation. To avoid prompts in a CI/CD context, you can provide the same details as environment variables.

| Field | Install-Time Environment Variable | Description |
| --- | --- | --- |
| **instanceUrl** | `CRANK_AUTOMATONINC_SALESFORCE__INSTANCEURL` | Login/instance URL (e.g. https://na1.salesforce.com) |
| **clientId** | `CRANK_AUTOMATONINC_SALESFORCE__CLIENTID` | OAuth2 Client ID |
| **clientSecret** | `CRANK_AUTOMATONINC_SALESFORCE__CLIENTSECRET` | OAuth2 Client Secret |
| **username** | `CRANK_AUTOMATONINC_SALESFORCE__USERNAME` | Username |
| **password** | `CRANK_AUTOMATONINC_SALESFORCE__PASSWORD` | Password |

```shell-session
# Re-authenticate by running this
$ crank cog:auth automatoninc/salesforce
```
<!-- authenticationDetailsEnd -->

### Steps
<!-- stepDetails -->
| Name (ID) | Expression | Expected Data |
| --- | --- | --- |
| **Create a Salesforce Account**<br>(`CreateAccount`) | `create a salesforce account` | - `account`: A map of field names to field values |
| **Delete a Salesforce Account**<br>(`DeleteAccount`) | `delete the salesforce account with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)` | - `field`: the name of the field used to identify the account <br><br>- `identifier`: the value of the field |
| **Check a field on a Salesforce Account**<br>(`AccountFieldEquals`) | `the (?<field>[a-zA-Z0-9_]+) field on salesforce account with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be set\|not be set\|be less than\|be greater than\|be one of\|be\|contain\|not be one of\|not be\|not contain) ?(?<expectedValue>.+)?` | - `idField`: The field used to search/identify the account <br><br>- `identifier`: The value of the id field to use when searching <br><br>- `field`: The name of the field to check <br><br>- `operator`: Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of) <br><br>- `expectedValue`: The expected value of the field |
| **Check a field on a Salesforce Campaign Member**<br>(`CampaignMemberFieldEquals`) | `the salesforce lead (?<email>.+) should have campaign member (?<field>[a-z0-9_]+) (?<operator>set to one of\|set to\|set\|not set to one of\|not set to\|not set\|containing\|not containing\|less than\|greater than) ?(?<expectedValue>.+)? on campaign (?<campaignId>.+)` | - `email`: Lead's email address <br><br>- `campaignId`: Campaign ID <br><br>- `field`: Field name to check <br><br>- `operator`: Check Logic (set to, not set to, containing, not containing, greater than, less than, set, not set, set to one of, or not set to one of) <br><br>- `expectedValue`: Expected field value |
| **Check Salesforce Campaign Membership**<br>(`CampaignMemberCampaignIdEquals`) | `the salesforce lead (?<email>.+) should be a member of campaign (?<campaignId>.+)` | - `email`: Lead's email address <br><br>- `campaignId`: Campaign ID |
| **Create a Salesforce Contact**<br>(`ContactCreateStep`) | `create a salesforce contact` | - `contact`: A map of field names to field values |
| **Delete a Salesforce Contact**<br>(`ContactDeleteStep`) | `delete the (?<email>.+) salesforce contact` | - `email`: Contact's Email Address |
| **Check a field on a Salesforce Contact**<br>(`ContactFieldEqualsStep`) | `the (?<field>[a-zA-Z0-9_]+) field on salesforce contact (?<email>.+) should (?<operator>be set\|not be set\|be less than\|be greater than\|be one of\|be\|contain\|not be one of\|not be\|not contain) ?(?<expectedValue>.+)?` | - `email`: Contact's email address <br><br>- `field`: Field name to check <br><br>- `operator`: Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of) <br><br>- `expectedValue`: Expected field value |
| **Create a Salesforce Lead**<br>(`CreateLead`) | `create a salesforce lead` | - `lead`: A map of field names to field values |
| **Delete a Salesforce Lead**<br>(`DeleteLead`) | `delete the (?<email>.+) salesforce lead` | - `email`: Lead's email address |
| **Check a field on a Salesforce Lead**<br>(`LeadFieldEquals`) | `the (?<field>[a-zA-Z0-9_]+) field on salesforce lead (?<email>.+) should (?<operator>be set\|not be set\|be less than\|be greater than\|be one of\|be\|contain\|not be one of\|not be\|not contain) ?(?<expectedValue>.+)?` | - `email`: Lead's email address <br><br>- `field`: Field name to check <br><br>- `operator`: Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of) <br><br>- `expectedValue`: Expected field value |
| **Create a Salesforce Object**<br>(`CreateObject`) | `create a salesforce (?<objName>[a-zA-Z0-9]+) object` | - `objName`: Salesforce object name <br><br>- `salesforceObject`: where keys represent object field names as represented in the SFDC API |
| **Delete a Salesforce Object**<br>(`DeleteObject`) | `delete the salesforce (?<objName>[a-zA-Z0-9]+) object with id (?<id>.+)` | - `objName`: Salesforce Object name <br><br>- `id`: Object ID |
| **Check a field on a Salesforce Object**<br>(`ObjectFieldEquals`) | `the (?<field>[a-zA-Z0-9_]+) field on salesforce (?<objName>[a-zA-Z0-9]+) object with id (?<id>[^s]+) should (?<operator>be set\|not be set\|be less than\|be greater than\|be one of\|be\|contain\|not be one of\|not be\|not contain) ?(?<expectedValue>.+)?` | - `objName`: Salesforce object name <br><br>- `id`: Object ID <br><br>- `field`: Field name to check <br><br>- `operator`: Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of) <br><br>- `expectedValue`: Expected field value |
| **Update a Salesforce Object**<br>(`UpdateObject`) | `update the salesforce (?<objName>[a-zA-Z0-9]+) object identified by id (?<identifier>[^s]+)` | - `objName`: Salesforce object name <br><br>- `identifier`: Salesforce object ID <br><br>- `salesforceObject`: where keys represent object field names as represented in the SFDC API |
| **Create a Salesforce Opportunity**<br>(`CreateOpportunity`) | `create a salesforce opportunity` | - `opportunity`: A map of field names to field values |
| **Delete a Salesforce Opportunity**<br>(`DeleteOpportunity`) | `delete the salesforce opportunity with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)` | - `field`: the name of the field used to identify the opportunity <br><br>- `identifier`: the value of the field |
| **Check a field on a Salesforce Opportunity**<br>(`OpportunityFieldEquals`) | `the (?<field>[a-zA-Z0-9_]+) field on salesforce opportunity with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be set\|not be set\|be less than\|be greater than\|be one of\|be\|contain\|not be one of\|not be\|not contain) ?(?<expectedValue>.+)?` | - `idField`: The field used to search/identify the opportunity <br><br>- `identifier`: The value of the id field to use when searching <br><br>- `field`: The name of the field to check <br><br>- `operator`: Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of) <br><br>- `expectedValue`: The expected value of the field |
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
