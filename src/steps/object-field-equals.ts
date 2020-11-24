import { Field, ExpectedRecord } from './../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class ObjectFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Object';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce (?<objName>[a-zA-Z0-9]+) object with id (?<id>[^\s]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain) ?(?<expectedValue>.+)?';
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
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
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

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      object = await this.client.findObjectById(objName, id, [field]);
    } catch (e) {
      return this.error('There was a problem checking the %s Object: %s', [objName, e.toString()]);
    }

    try {
      if (!object) {
        // If no results were found, return an error.
        return this.fail('No %s Object found with id %s', [objName, id]);
      }

      const record = this.createRecord(object);

      if (!object.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.fail('The %s field does not exist on %s Object %s', [field, objName, id], [record]);
      }

      const result = this.assert(operator, object[field], expectedValue, field);

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

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
