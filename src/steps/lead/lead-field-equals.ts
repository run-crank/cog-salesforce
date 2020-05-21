import { Field, ExpectedRecord } from './../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class LeadFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Lead';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce lead (?<email>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
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
    id: 'lead',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Lead's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Lead's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Lead's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let lead: Record<string, any>;

    try {
      lead = await this.client.findLeadByEmail(email, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    try {
      if (!lead) {
        // If no results were found, return an error.
        return this.error('No Lead found with email %s', [email]);
      }

      const record = this.createRecord(lead);

      if (!lead.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.error('The %s field does not exist on Lead %s', [field, email], [record]);
      } else if (this.compare(operator, lead[field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue], [record]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(this.operatorFailMessages[operator], [field, expectedValue, lead[field]], [record]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of lead field: %s', [e.message]);
    }
  }

  createRecord(lead: Record<string, any>) {
    delete lead.attributes;
    return this.keyValue('lead', 'Checked Lead', lead);
  }
}

export { LeadFieldEquals as Step };
