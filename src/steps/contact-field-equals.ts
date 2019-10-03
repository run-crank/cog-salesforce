/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class ContactFieldEqualsStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Contact';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the (?<field>[a-zA-Z0-9_]+) field on salesforce contact (?<email>.+) should be (?<expectedValue>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Contact's email address",
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
    let contact: Record<string, any>;

    try {
      contact = await this.client.findContactByEmail(email, field);
    } catch (e) {
      return this.error('There was a problem checking the Contact: %s', [e.toString()]);
    }

    if (!contact) {
      return this.error('No Contact found with email %s', [email]);
    } else if (!contact.hasOwnProperty(field)) {
      return this.error('The %s field does not exist on Contact %s', [field, email]);
      /* tslint:disable-next-line:triple-equals */
    } else if (contact[field] == expectedValue) {
      return this.pass('The %s field was set to %s, as expected', [field, contact[field]]);
    } else {
      return this.fail('Expected %s field to be %s, but it was actually %s', [
        field,
        expectedValue,
        contact[field],
      ]);
    }
  }

}

export { ContactFieldEqualsStep as Step };
