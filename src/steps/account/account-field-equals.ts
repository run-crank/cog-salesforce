import { baseOperators } from './../../client/constants/operators';
import { Field } from '../../core/base-step';
/*tslint:disable:no-else-after-return*/

// tslint:disable-next-line:no-duplicate-imports
import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';

export class AccountFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Account';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce account with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
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
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'The expected value of the field',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const idField: string = stepData.idField;
    const identifier: string = stepData.identifier;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let account: Record<string, any>[];

    try {
      account = await this.client.findAccountByIdentifier(idField, identifier, field);
    } catch (e) {
      return this.error('There was a problem checking the Account: %s', [e.toString()]);
    }
    try {
      if (account.length === 0) {
        // If the client does not return an account, return an error.
        return this.error('No Account was found with %s %s', [field, identifier]);
      } else if (account.length > 1) {
        // If the client returns more than one account, return an error.
        return this.error('More than one account matches %s %s', [field, identifier]);
      } else if (!account[0].hasOwnProperty(stepData.field)) {
        // If the given field does not exist on the account, return an error.
        return this.error('The %s field does not exist on Account %s', [field, identifier]);
      } else if (this.compare(operator, account[0][field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(this.operatorSuccessMessages[operator.replace(/\s/g, '').toLowerCase()], [field, expectedValue]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(this.operatorFailMessages[operator.replace(/\s/g, '').toLowerCase()], [
          field,
          expectedValue,
          account[0][field],
        ]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of account field: %s', [e.message]);
    }
  }
}

export { AccountFieldEquals as Step };
