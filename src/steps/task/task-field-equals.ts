import { Field, ExpectedRecord } from './../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class TaskFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Task';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce task from (?<email>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Recipient's email address",
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
    id: 'task',
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
    let recipient: Record<string, any>;
    let tasks: Record<string, any>[];

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      recipient = await this.client.findObjectByField('Lead', 'Email', email) || await this.client.findObjectByField('Contact', 'Email', email);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    try {
      if (!recipient) {
        // If no results were found, return an error.
        return this.fail('No Recipient found with email %s', [email]);
      }

      const taskFieldMap = {
        'WhoId': recipient.Id,
      };

      tasks = await this.client.findObjectsbyFields('Task', taskFieldMap);

      const record = this.createRecord(tasks[0]);
      const validResults = [];
      let result = {
        valid: false,
        message: '',
      };

      // Assert field
      tasks.forEach((task) => {
        const assertResult = this.assert(operator, task[field], expectedValue, field);
        if (assertResult.valid) {
          validResults.push(task);
          result = assertResult;
        }
      });

      if (validResults.length > 1) {
        // If no results were found, return an error.
        return this.error('There are more than 1 tasks from %s that matches the expected %s from email %s.', [email, field]);
      } else if (validResults.length < 1) {
        // If no results were found matching the expectedValue, return an fail.
        return this.fail('Task for email %s found. Expected %s field %s %s but it was actually %s', [email, field, operator, expectedValue, tasks[0][field]]);
      }

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of task field: %s', [e.message]);
    }
  }

  createRecord(task: Record<string, any>) {
    delete task.attributes;
    return this.keyValue('task', 'Checked Task', task);
  }
}

export { TaskFieldEquals as Step };
