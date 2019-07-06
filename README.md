# Salesforce Cog

This is an Automaton Cog for Salesforce, providing steps and assertions for you to
validate the state and behavior of your Salesforce instance.

* [Installation](#installation)
* [Usage](#usage)
* [Development and Contributing](#development-and-contributing)

## Installation

Ensure you have the `crank` CLI and `docker` installed and running locally,
then run the following.  You'll be prompted to enter your Salesforce
credentials once the cog is successfully installed.

```bash
crank cog:install automatoninc/salesforce
```

You can always re-authenticate by running

```bash
crank cog:auth automatoninc/salesforce
```

## Usage

...

## Development and Contributing
Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change. Please make sure to add or update tests
as appropriate.

### Setup

1. Install node.js (v12.x+ recommended)
2. Clone this repository.
3. Intsall dependencies via `npm install`
4. Run `npm start` to validate the cog works locally (`ctrl+c` to kill it)
5. Run `crank cog:install --source=local --local-start-command="npm start"` to
   register your local instance of this cog. You may need to append a `--force`
   flag or run `crank cog:uninstall automatoninc/salesforce` if you've already
   installed the distributed version of this cog.

### Adding/Modifying Steps
Modify code in `src/steps` and validate your changes by running
`crank cog:step automatoninc/salesforce` and selecting your step.

To add new steps, create new step classes in `src/steps`. You will need to run
`crank registry:rebuild` in order for your new steps to be recognized.

### Tests and Housekeeping
Tests can be found in the `test` directory and run like this: `npm test`.
Ensure your code meets standards by running `npm run lint`.
