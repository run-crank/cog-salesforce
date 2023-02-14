import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class ContactCreateStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce contact';
  protected stepExpression: string = 'create a salesforce contact';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Contact';
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
    }, {
      field: 'Email',
      type: FieldDefinition.Type.STRING,
      description: "Contact's Email Address",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const contact: any = stepData.contact;

    try {
      const result = await this.client.createContact(contact);
      let data: any = result;
      if (result.success) {
        data = await this.client.findContactByEmail(contact.Email, []);
      }
      const record = this.createRecord(data);
      const passingRecord = this.createPassingRecord(data, Object.keys(contact));
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);
      return this.pass('Successfully created Contact with ID %s', [result.id], [record, passingRecord, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Contact: %s', [e.toString()]);
    }
  }

  public createRecord(contact): StepRecord {
    return this.keyValue('contact', 'Created Contact', contact);
  }

  public createPassingRecord(data, fields): StepRecord {
    const filteredData = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        if (fields.includes(key)) {
          filteredData[key] = data[key];
        }
      });
    }
    return this.keyValue('exposeOnPass:contact', 'Created Contact', filteredData);
  }

  public createOrderedRecord(contact, stepOrder = 1): StepRecord {
    return this.keyValue(`contact.${stepOrder}`, `Created Contact from Step ${stepOrder}`, contact);
  }

}

export { ContactCreateStep as Step };
