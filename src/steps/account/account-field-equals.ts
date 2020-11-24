import { Field, ExpectedRecord } from '../../core/base-step';
/*tslint:disable:no-else-after-return*/

// tslint:disable-next-line:no-duplicate-imports
import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isObject, isNullOrUndefined } from 'util';
import { titleCase } from 'title-case';

export class AccountFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Account';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce account with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'idField',
    type: FieldDefinition.Type.STRING,
    description: 'The field used to search/identify the account',
  }, {
    field: 'identifier',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'The value of the id field to use when searching',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'The name of the field to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'The expected value of the field',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'account',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Account's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Account's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Account's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const idField: string = stepData.idField;
    const identifier: string = stepData.identifier;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let account: Record<string, any>[];

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      account = await this.client.findAccountByIdentifier(idField, identifier, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Account: %s', [e.toString()]);
    }
    try {
      if (account.length === 0) {
        // If the client does not return an account, return an error.
        return this.fail('No Account was found with %s %s', [field, identifier]);
      } else if (account.length > 1) {
        // If the client returns more than one account, return an error.
        return this.fail('More than one account matches %s %s', [field, identifier], [this.createRecords(account)]);
      }

      //// Account found
      const record = this.createRecord(account[0]);

      if (!account[0].hasOwnProperty(stepData.field)) {
        // If the given field does not exist on the account, return an error.
        return this.fail('The %s field does not exist on Account %s', [field, identifier], [record]);
      }

      const result = this.assert(operator, account[0][field], expectedValue, field);

      // If the value of the field matches expectations, pass.
      // If the value of the field does not match expectations, fail.
      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error('There was an error during validation of account field: %s', [e.message]);
      }
      return this.error('There was an error during validation of account field: %s', [e.message]);
    }
  }

  createRecord(account: Record<string, any>) {
    delete account.attributes;
    return this.keyValue('account', 'Checked Account', account);
  }

  createRecords(accounts: Record<string, any>[]) {
    const records = [];
    accounts.forEach((account) => {
      delete account.attributes;
      records.push(account);
    });
    const headers = {};
    Object.keys(accounts[0]).forEach(key => headers[key] = titleCase(key));
    return this.table('matchedAccounts', 'Matched Accounts', headers, records);
  }
}

export { AccountFieldEquals as Step };
