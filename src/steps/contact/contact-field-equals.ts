/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class ContactFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce contact';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce contact (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Contact';
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
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
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

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      contact = await this.client.findContactByEmail(email, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Contact: %s', [e.toString()]);
    }

    try {
      if (!contact) {
        return this.fail('No Contact found with email %s', [email]);
      }

      const record = this.createRecord(contact);
      const orderedRecord = this.createOrderedRecord(contact, stepData['__stepOrder']);

      if (!contact.hasOwnProperty(field)) {
        return this.fail('The %s field does not exist on Contact %s', [field, email], [record, orderedRecord]);
      }

      const result = this.assert(operator, contact[field], expectedValue, field, stepData['__piiSuppressionLevel']);

      return result.valid ? this.pass(result.message, [], [record, orderedRecord])
        : this.fail(result.message, [], [record, orderedRecord]);

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

  public createRecord(contact: Record<string, any>): StepRecord {
    delete contact.attributes;
    return this.keyValue('contact', 'Checked Contact', contact);
  }

  public createOrderedRecord(contact: Record<string, any>, stepOrder = 1): StepRecord {
    delete contact.attributes;
    return this.keyValue(`contact.${stepOrder}`, `Checked Contact from Step ${stepOrder}`, contact);
  }
}

export { ContactFieldEqualsStep as Step };
