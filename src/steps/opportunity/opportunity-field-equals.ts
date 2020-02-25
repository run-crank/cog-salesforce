import { Field, ExpectedRecord } from '../../core/base-step';
/*tslint:disable:no-else-after-return*/

// tslint:disable-next-line:no-duplicate-imports
import { BaseStep, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';
import { titleCase } from 'title-case';

export class OpportunityFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Opportunity';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce opportunity with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should (?<operator>be less than|be greater than|be|contain|not be|not contain) (?<expectedValue>.+)';
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
    description: 'Check Logic (be, not be, contain, not contain, be greater than, or be less than)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
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
      description: "Lead's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Lead's Last Modified Date",
    }],
    dynamicFields: true,
  }, {
    id: 'matchedOpportunities',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Opportunity's SalesForce ID",
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
    const idField: string = stepData.idField;
    const identifier: string = stepData.identifier;
    const field: string = stepData.field;
    const operator: string = stepData.operator || 'be';
    const expectedValue: string = stepData.expectedValue;
    let opportunity: Record<string, any>[];

    try {
      opportunity = await this.client.findOpportunityByIdentifier(idField, identifier, field);
    } catch (e) {
      return this.error('There was a problem checking the Opportunity: %s', [e.toString()]);
    }

    try {
      if (opportunity.length === 0) {
        // If the client does not return an opportunity, return an error.
        return this.error('No opportunity matches %s %s', [field, identifier]);
      } else if (opportunity.length > 1) {
        // If the client returns more than one opportunity, return an error.
        return this.error('More than one opportunity matches %s %s', [field, identifier], [this.createRecords(opportunity)]);
      }

      const record = this.keyValue('opportunity', 'Checked Opportunity', opportunity[0]);

      if (!opportunity[0].hasOwnProperty(stepData.field)) {
        // If the given field does not exist on the opportunity, return an error.
        return this.error('The %s field does not exist on Opportunity %s', [field, identifier], [record]);
      } else if (this.compare(operator, opportunity[0][field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue], [record]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(
          this.operatorFailMessages[operator],
          [field, expectedValue, opportunity[0][field]],
          [record],
        );
      }
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

  createRecords(opportunities: Record<string, any>[]) {
    const records = [];
    opportunities.forEach((opportunity) => {
      opportunity.attributes.forEach(attr => opportunity[attr.name] = attr.value);
      records.push(opportunity);
    });
    const headers = { };
    Object.keys(opportunities[0]).forEach(key => headers[key] = key);
    opportunities[0].attributes.forEach(attr => headers[attr.name] = titleCase(attr.name));
    return this.table('matchedOpportunities', 'Matched Opportunities', headers, records);
  }
}

export { OpportunityFieldEquals as Step };
