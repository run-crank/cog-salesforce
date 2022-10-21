import { Field, ExpectedRecord } from './../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class LeadFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Lead';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce lead (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?';
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
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
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
    const isSetOperator = ['be set', 'not be set'].includes(operator);
    let lead: Record<string, any>;

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      lead = await this.client.findLeadByEmail(email, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    try {
      if (!lead) {
        // If no results were found, return an error.
        return this.fail('No Lead found with email %s', [email]);
      }

      const record = this.createRecord(lead);
      const orderedRecord = this.createOrderedRecord(lead, stepData['__stepOrder']);

      if (!lead.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.fail('The %s field does not exist on Lead %s', [field, email], [record, orderedRecord]);
      }

      const result = this.assert(operator, lead[field], expectedValue, field, stepData['__piiSuppressionLevel']);

      return result.valid ? this.pass(result.message, [], [record, orderedRecord])
        : this.fail(result.message, [], [record, orderedRecord]);

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

  public createRecord(lead: Record<string, any>): StepRecord {
    delete lead.attributes;
    return this.keyValue('lead', 'Checked Lead', lead);
  }

  public createOrderedRecord(lead: Record<string, any>, stepOrder = 1): StepRecord {
    delete lead.attributes;
    return this.keyValue(`lead.${stepOrder}`, `Checked Lead from Step ${stepOrder}`, lead);
  }
}

export { LeadFieldEquals as Step };
