import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class ContactDeleteStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce contact';
  protected stepExpression: string = 'delete the (?<email>.+) salesforce contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Contact';
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: 'Contact\'s Email Address',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'contact',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Contact's SalesForce ID",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;

    try {
      const result = await this.client.deleteContactByEmail(email);
      const record = this.keyValue('contact', 'Deleted Contact', { Id: result.id });
      return this.pass('Successfully deleted Contact with ID %s', [result['id']], [record]);
    } catch (e) {
      return this.error('There was a problem deleting the Contact: %s', [e.toString()]);
    }
  }

}

export { ContactDeleteStep as Step };
