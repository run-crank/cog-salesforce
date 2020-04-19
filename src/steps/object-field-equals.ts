import { Field, ExpectedRecord } from './../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../client/constants/operators';

export class ObjectFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Object';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce (?<objName>[a-zA-Z0-9]+) object with id (?<id>[^\s]+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'objName',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce object name',
  }, {
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Object ID',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'salesforceObject',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Object's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Object's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Object's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const field: string = stepData.field;
    const objName: string = stepData.objName;
    const id: string = stepData.id;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let object: Record<string, any>;

    try {
      object = await this.client.findObjectById(objName, id);
    } catch (e) {
      return this.error('There was a problem checking the %s Object: %s', [objName, e.toString()]);
    }

    try {
      if (!object) {
        // If no results were found, return an error.
        return this.error('No %s Object found with id %s', [objName, id]);
      }

      const record = this.createRecord(object);

      if (!object.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.error('The %s field does not exist on %s Object %s', [field, objName, id], [record]);
      } else if (this.compare(operator, object[field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue], [record]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(this.operatorFailMessages[operator], [field, expectedValue, object[field]], [record]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of %s object field: %s', [objName, e.message]);
    }
  }

  createRecord(object: Record<string, any>) {
    delete object.attributes;
    return this.keyValue('salesforceObject', 'Checked Object', object);
  }
}

export { ObjectFieldEquals as Step };
