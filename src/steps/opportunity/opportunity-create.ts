import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CreateOpportunity extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Opportunity';
  protected stepExpression: string = 'create a salesforce opportunity';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'opportunity',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'opportunity',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Opportunity's SalesForce ID",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const opportunity: any = stepData.opportunity;

    try {
      const result = await this.client.createOpportunity(opportunity);
      const record = this.keyValue('opportunity', 'Created Opportunity', { Id: result.id });
      return this.pass('Successfully created Opportunity with ID %s', [result.id], [record]);
    } catch (e) {
      return this.error('There was a problem creating the Opportunity: %s', [e.toString()]);
    }
  }

}

export { CreateOpportunity as Step };
