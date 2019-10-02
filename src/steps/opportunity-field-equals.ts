import { Field } from './../core/base-step';
/*tslint:disable:no-else-after-return*/

import { BaseStep, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class OpportunityFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Opportunity';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce opportunity with (?<idField>[a-zA-Z0-9_]+) (?<identifier>.+) should be (?<expectedValue>.+)';
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
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'The expected value of the field',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const idField: string = stepData.idField;
    const identifier: string = stepData.identifier;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    let opportunity: Record<string, any>[];

    try {
      opportunity = await this.client.findOpportunityByIdentifier(idField, identifier, field);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    if (opportunity.length === 0) {
      // If the client does not return an opportunity, return an error.
      return this.error('No opportunity matches %s %s', [field, identifier]);
    } else if (opportunity.length > 1) {
      // If the client returns more than one opportunity, return an error.
      return this.error('More than one opportunity matches %s %s', [field, identifier]);
    } else if (!opportunity[0].hasOwnProperty(stepData.field)) {
      // If the given field does not exist on the opportunity, return an error.
      return this.error('The %s field does not exist on Opportunity %s', [field, identifier]);
    } else if (opportunity[0][field] == expectedValue) {
      // If the value of the field matches expectations, pass.
      return this.pass('The %s field was set to %s, as expected', [field, expectedValue]);
    } else {
      // If the value of the field does not match expectations, fail.
      return this.fail('Expected %s field to be %s, but it was actually %s', [
        field,
        expectedValue,
        opportunity[0][field],
      ]);
    }
  }
}

export { OpportunityFieldEquals as Step };
