import { BaseStep, Field, ExpectedRecord, StepInterface } from '../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import * as moment from 'moment';
import { baseOperators } from '../../client/constants/operators';

export class LeadCreateDateValidation extends BaseStep implements StepInterface {

  protected stepName: string = 'Validate time from form submission to Salesforce Lead Creation';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the salesforce lead (?<email>.+) created date difference from form submission on (?<submittedAt>.+) should (?<operator>be less than|be greater than|be|not be) ?(?<expectedValue>.+) seconds';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, be greater than, be less than)',
  }, {
    field: 'submittedAt',
    type: FieldDefinition.Type.DATETIME,
    description: 'The datetime stamp when the form was submitted',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.NUMERIC,
    description: 'Expected timespan value in seconds',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'lead',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Lead's SalesForce ID",
    }, {
      field: 'TimeSpan',
      type: FieldDefinition.Type.NUMERIC,
      description: 'The time difference in seconds between form submission and lead creation in Salesforce',
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
    const submittedAt = stepData.submittedAt;
    const operator: string = stepData.operator || 'be';
    const expectedValue: number = stepData.expectedValue;
    let lead: Record<string, any>;

    try {
      lead = await this.client.findLeadByEmail(email, ['CreatedDate']);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    try {
      if (!lead) {
        return this.fail('No Lead found with email %s', [email]);
      }

      const createdDate = lead.CreatedDate;
      const submittedAtMoment = moment.utc(submittedAt);
      const createdDateMoment = moment.utc(createdDate);
      const dateDiffInSeconds = createdDateMoment.diff(submittedAtMoment) / 1000;
      const humanizedDuration = moment.duration(createdDateMoment.diff(submittedAtMoment)).humanize();

      const record = this.createRecord(lead, dateDiffInSeconds);
      const result = this.evaluate(dateDiffInSeconds, expectedValue, operator);
      result.message += ` (around ${humanizedDuration} ago)`;

      return result.passed ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an validating lead creation date: %s', [e.message]);
    }
  }

  createRecord(lead: Record<string, any>, diffInSeconds) {
    delete lead.attributes;
    const record = { ...lead, TimeSpan: diffInSeconds };
    return this.keyValue('lead', 'Checked Lead', record);
  }

  private evaluate(actual: number, expected: number, operator: string): { passed: boolean, message: string } {
    let result = { passed: false, message: '' };
    const validOperators = ['be', 'not be', 'be greater than', 'be less than'];

    if (!validOperators.includes(operator)) {
      result = {
        passed: false,
        message: `Invalid operator. Please provide one of: ${validOperators.join(', ')}`,
      };
    } else {
      result = this.evaluateOperator(actual, expected, operator);
    }

    return result;
  }

  private evaluateOperator(actual: number, expected: number, operator: string) {
    const operators = {
      'be': (actual, expected) => actual === expected,
      'not be': (actual, expected) => actual !== expected,
      'be greater than': (actual, expected) => actual > expected,
      'be less than': (actual, expected) => actual < expected,
    };

    const messages = {
      'be': {
        passed: `Lead was created in ${expected} seconds after form submission, as expected`,
        failed: `Expected Lead to be created in ${expected} seconds after form submission but it was actually ${actual} seconds`,
      },
      'not be': {
        passed: `Lead was not created in ${expected} seconds after form submission, as expected`,
        failed: `Expected Lead to not be created in ${expected} seconds after form submission but it was actually ${actual} seconds`,
      },
      'be greater than': {
        passed: `Lead was created in greater than ${expected} seconds after form submission, as expected`,
        failed: `Expected Lead to be created in greater than ${expected} seconds after form submission but it was actually ${actual} seconds`,
      },
      'be less than': {
        passed: `Lead was created in less than ${expected} seconds after form submission, as expected`,
        failed: `Expected Lead to be created in less than ${expected} seconds after form submission but it was actually ${actual} seconds`,
      },
    };

    const result = { passed: false, message: '' };
    result.passed = operators[operator](actual, expected);
    result.message = messages[operator][result.passed ? 'passed' : 'failed'];
    return result;
  }
}

export { LeadCreateDateValidation as Step };
