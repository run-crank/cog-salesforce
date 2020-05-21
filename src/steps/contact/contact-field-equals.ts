/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
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
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Contact's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Contact's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Contact's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let contact: Record<string, any>;

    try {
      contact = await this.client.findContactByEmail(email, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Contact: %s', [e.toString()]);
    }

    try {
      if (!contact) {
        return this.error('No Contact found with email %s', [email]);
      }

      const record = this.keyValue('contact', 'Checked Contact', contact);

      if (!contact.hasOwnProperty(field)) {
        return this.error('The %s field does not exist on Contact %s', [field, email], [record]);
      } else if (this.compare(operator, contact[field], expectedValue)) {
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue], [record]);
      } else {
        return this.fail(this.operatorFailMessages[operator], [field, expectedValue, contact[field]], [record]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of contact field: %s', [e.message]);
    }
  }

  createRecord(contact: Record<string, any>) {
    delete contact.attributes;
    return this.keyValue('contact', 'Checked Contact', contact);
  }
}

export { ContactFieldEqualsStep as Step };
