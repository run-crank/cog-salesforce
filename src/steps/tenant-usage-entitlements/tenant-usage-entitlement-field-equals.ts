import { BaseStep, StepInterface, Field, ExpectedRecord } from '../../core/base-step';
/*tslint:disable:no-else-after-return*/

import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { isNullOrUndefined } from 'util';

export class TenantUsageEntitlementsFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check Salesforce Usage';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce tenant usage entitlements with id (?<id>[^\s]+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: "Entitlement's Id",
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
      description: "Tenant Usage Entitlement's ID",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const field: string = stepData.field;
    const id: string = stepData.id;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let object: Record<string, any>;
    console.log(field);
    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      object = await this.client.findObjectById('TenantUsageEntitlement', id, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Tenant Usage Entitlement: %s', [e.toString()]);
    }

    try {
      if (!object) {
        // If no results were found, return an error.
        return this.fail('No Tenant Usage Entitlement found with id %s', [id]);
      }

      const record = this.createRecord(object);

      object['PercentageUsed'] = 0;

      if (!object.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.fail('The %s field does not exist on Tenant Usage Entitlement Object %s', [field, id], [record]);
      }

      let actual = object[field];

      if (field === 'PercentageUsed') {
        if (object['CurrentAmountAllowed'] === null || object['CurrentAmountAllowed'] === undefined || object['CurrentAmountAllowed'] === 0) {
          return this.error('There is no set CurrentAmountAllowed value for entitilement with id %s', [id]);
        }

        actual = ((object['AmountUsed'] || 0) / object['CurrentAmountAllowed']) * 100;
        console.log(actual);
      }

      const result = this.assert(operator, actual, expectedValue, field);

      return result.valid ? this.pass(result.message, [], [record])
        : this.fail(result.message, [], [record]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of Tenant Usage Entitlement object field: %s', [e.message]);
    }
  }

  createRecord(object: Record<string, any>) {
    delete object.attributes;
    return this.keyValue('salesforceTenantUsageEntitlement', 'Checked Tenant Usage Entitlement', object);
  }
}

export { TenantUsageEntitlementsFieldEquals as Step };
