import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Lead';
  protected stepExpression: string = 'create a salesforce lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'lead',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.NUMERIC,
      description: "Lead's SalesForce ID",
    }, {
      field: 'Email',
      type: FieldDefinition.Type.EMAIL,
      description: "Lead's Email",
    }, {
      field: 'FirstName',
      type: FieldDefinition.Type.STRING,
      description: "Lead's First Name",
    }, {
      field: 'LastName',
      type: FieldDefinition.Type.STRING,
      description: "Lead's Last Name",
    }, {
      field: 'Company',
      type: FieldDefinition.Type.STRING,
      description: "Lead's Company",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const lead: any = stepData.lead;

    try {
      const result = await this.client.createLead(lead);
      const record = this.keyValue('lead', 'Created Lead', lead);
      return this.pass('Successfully created Lead with ID %s', [result.id], [record]);
    } catch (e) {
      return this.error('There was a problem creating the Lead: %s', [e.toString()]);
    }
  }

}

export { CreateLead as Step };
