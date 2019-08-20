/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class LeadFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Lead';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce lead (?<email>.+) should be (?<expectedValue>.+)';
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
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
    let lead: Record<string, any>;

    try {
      lead = await this.client.findLeadByEmail(email, field);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    if (!lead) {
      // If no results were found, return an error.
      return this.error('No Lead found with email %s', [email]);
    } else if (!lead.hasOwnProperty(field)) {
      // If the given field does not exist on the user, return an error.
      return this.error('The %s field does not exist on Lead %s', [field, email]);
      /* tslint:disable-next-line:triple-equals */
    } else if (lead[field] == expectedValue) {
      // If the value of the field matches expectations, pass.
      return this.pass('The %s field was set to %s, as expected', [field, lead[field]]);
    } else {
      // If the value of the field does not match expectations, fail.
      return this.fail('Expected %s field to be %s, but it was actually %s', [
        field,
        expectedValue,
        lead[field],
      ]);
    }
  }

}

export { LeadFieldEquals as Step };
