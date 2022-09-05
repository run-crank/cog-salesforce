import { Field, ExpectedRecord } from '../../core/base-step';
/*tslint:disable:no-else-after-return*/

// tslint:disable-next-line:no-duplicate-imports
import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { titleCase } from 'title-case';
import { isNullOrUndefined } from 'util';

export class OpportunityFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Opportunity';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce opportunity with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be set|not be set|be less than|be greater than|be one of|be|contain|not be one of|not be|not contain|match|not match) ?(?<expectedValue>.+)?';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'idField',
    type: FieldDefinition.Type.STRING,
    description: 'The field used to search/identify the opportunity',
  }, {
    field: 'identifier',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'The value of the id field to use when searching',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'The name of the field to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (be, not be, contain, not contain, be greater than, be less than, be set, not be set, be one of, or not be one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'The expected value of the field',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'opportunity',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Opportunity's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Opportunity's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Opportunity's Last Modified Date",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const idField: string = stepData.idField;
    const identifier: string = stepData.identifier;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let opportunity: Record<string, any>[];

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      opportunity = await this.client.findOpportunityByIdentifier(idField, identifier, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Opportunity: %s', [e.toString()]);
    }

    try {
      if (opportunity.length === 0) {
        // If the client does not return an opportunity, return an error.
        return this.fail('No opportunity matches %s %s', [field, identifier]);
      } else if (opportunity.length > 1) {
        // If the client returns more than one opportunity, return an error.
        return this.fail('More than one opportunity matches %s %s', [field, identifier], [this.createRecords(opportunity)]);
      }

      const record = this.createRecord(opportunity[0]);
      const orderedRecord = this.createOrderedRecord(opportunity[0], stepData['__stepOrder']);

      if (!opportunity[0].hasOwnProperty(stepData.field)) {
        // If the given field does not exist on the opportunity, return an error.
        return this.error('The %s field does not exist on Opportunity %s', [field, identifier], [record, orderedRecord]);
      }

      const result = this.assert(operator, opportunity[0][field], expectedValue, field);

      // If the value of the field matches expectations, pass.
      // If the value of the field does not match expectations, fail.
      return result.valid ? this.pass(result.message, [], [record, orderedRecord])
        : this.fail(result.message, [], [record, orderedRecord]);

    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, baseOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of opportunity field: %s', [e.message]);
    }
  }

  public createRecord(opportunity: Record<string, any>): StepRecord {
    delete opportunity.attributes;
    return this.keyValue('lead', 'Checked Opportunity', opportunity);
  }

  public createOrderedRecord(opportunity: Record<string, any>, stepOrder = 1): StepRecord {
    delete opportunity.attributes;
    return this.keyValue(`opportunity.${stepOrder}`, `Checked Opportunity from Step ${stepOrder}`, opportunity);
  }

  createRecords(opportunities: Record<string, any>[]) {
    const records = [];
    opportunities.forEach((opportunity) => {
      delete opportunity.attributes;
      records.push(opportunity);
    });
    const headers = {};
    Object.keys(opportunities[0]).forEach(key => headers[key] = titleCase(key));
    return this.table('matchedOpportunities', 'Matched Opportunities', headers, records);
  }
}

export { OpportunityFieldEquals as Step };
