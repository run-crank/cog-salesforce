import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class ContactDeleteStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce Contact';
  protected stepExpression: string = 'delete the (?<email>.+) salesforce contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Contact\'s Email Address',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;

    try {
      const result = await this.client.deleteContactByEmail(email);
      return this.pass('Successfully deleted Contact with ID %s', [result['id']]);
    } catch (e) {
      return this.error('There was a problem deleting the Contact: %s', [e.toString()]);
    }
  }

}

export { ContactDeleteStep as Step };
