import { Field, ExpectedRecord } from './../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class BulkObjectFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on multiple Salesforce objects';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on multiple salesforce (?<objName>[a-zA-Z0-9]+) objects should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Bulk Objects';
  protected expectedFields: Field[] = [{
    field: 'objName',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce object name',
  }, {
    field: 'salesforceObjects',
    type: FieldDefinition.Type.MAP,
    description: 'Object IDs',
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
    id: 'passedObjects',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'ID of Salesforce Object',
    }],
    dynamicFields: true,
  }, {
    id: 'failedObjects',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'message',
      type: FieldDefinition.Type.STRING,
      description: 'Message for explanation of fail',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const field: string = stepData.field;
    const objName: string = stepData.objName;
    const ids: {[index: string]: {Id: string}} = stepData.salesforceObjects;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    const idArray = [];
    let objectArray;

    Object.values(ids).forEach((obj) => {
      idArray.push(obj.Id);
    });

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      objectArray = await this.client.bulkFindObjectsById(objName, idArray, [field]);
    } catch (e) {
      return this.error('There was a problem checking the %s Object: %s', [objName, e.toString()]);
    }

    try {
      const successArray = [];
      const failArray = [];

      if (!objectArray.length) {
        // If no results were found, return an error.
        return this.fail('No %s Object found with given ids', [objName]);
      }

      // Sort each batch of objects into successArray and failArray
      objectArray.forEach((obj) => {
        if (!obj.hasOwnProperty(field)) {
          // If the given field does not exist on the object, add it to the failArray
          failArray.push({ Id: obj.Id, message: `The ${field} field does not exist on this ${objName} object` });
        } else {
          const assertResult = this.assert(operator, obj[field], expectedValue, field, stepData['__piiSuppressionLevel']);
          if (assertResult.valid) {
            successArray.push({ Id: obj.Id, message: assertResult.message });
          } else {
            failArray.push({ Id: obj.Id, message: assertResult.message });
          }
        }
      });

      const returnedLeadsCount = successArray.length + failArray.length;
      const records = [];

      if (objectArray.length !== returnedLeadsCount) {
        // Not all leads were returned from Marketo
        records.push(this.createTable('failedObjects', 'Objects Failed', failArray));
        records.push(this.createTable('passedObjects', 'Objects Passed', successArray));
        return this.fail(
          'Found %d of %d Objects where the %s field was found to %s %s',
          [successArray.length , objectArray.length, field, operator, expectedValue],
          records,
        );
      } else if (!failArray.length) {
        // If there are no failures, return a pass
        records.push(this.createTable('passedObjects', 'Objects Passed', successArray));
        return this.pass(
          'Successfully checked %d Objects',
          [successArray.length],
          records,
        );
      } else {
        records.push(this.createTable('failedObjects', 'Objects Failed', failArray));
        records.push(this.createTable('passedObjects', 'Objects Passed', successArray));
        return this.fail(
          'Found %d of %d Objects where the %s field was found to %s %s',
          [successArray.length , objectArray.length, field, operator, expectedValue],
          records,
        );
      }
    } catch (e) {
      console.log(e);
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of %s object field: %s', [objName, e.message]);
    }
  }

  private createTable(id, name, leads) {
    const headers = {};
    const headerKeys = Object.keys(leads[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    return this.table(id, name, headers, leads);
  }
}

export { BulkObjectFieldEquals as Step };
