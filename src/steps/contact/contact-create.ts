import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class ContactCreateStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Contact';
  protected stepExpression: string = 'create a salesforce contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'contact',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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
    const contact: any = stepData.contact;

    try {
      const result = await this.client.createContact(contact);
      const record = this.createRecord(result);
      const orderedRecord = this.createOrderedRecord(result, stepData['__stepOrder']);
      return this.pass('Successfully created Contact with ID %s', [result['id']], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Contact: %s', [e.toString()]);
    }
  }

  public createRecord(contact): StepRecord {
    return this.keyValue('contact', 'Created Contact', { Id: contact.id });
  }

  public createOrderedRecord(contact, stepOrder = 1): StepRecord {
    return this.keyValue(`contact.${stepOrder}`, `Created Contact from Step ${stepOrder}`, { Id: contact.id });
  }

}

export { ContactCreateStep as Step };
