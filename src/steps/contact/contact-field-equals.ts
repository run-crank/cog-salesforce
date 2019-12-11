/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class ContactFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Contact';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce contact (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let contact: Record<string, any>;

    try {
      contact = await this.client.findContactByEmail(email, field);
    } catch (e) {
      return this.error('There was a problem checking the Contact: %s', [e.toString()]);
    }

    try {
      if (!contact) {
        return this.error('No Contact found with email %s', [email]);
      } else if (!contact.hasOwnProperty(field)) {
        return this.error('The %s field does not exist on Contact %s', [field, email]);
        /* tslint:disable-next-line:triple-equals */
      } else if (this.compare(operator, contact[field], expectedValue)) {
        return this.pass(this.operatorSuccessMessages[operator.replace(/\s/g, '').toLowerCase()], [field, expectedValue]);
      } else {
        return this.fail(this.operatorFailMessages[operator.replace(/\s/g, '').toLowerCase()], [
          field,
          expectedValue,
          contact[field],
        ]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s. Please provide one of: %s', [e.message, baseOperators]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of contact field: %s', [e.message]);
    }
  }

}

export { ContactFieldEqualsStep as Step };
