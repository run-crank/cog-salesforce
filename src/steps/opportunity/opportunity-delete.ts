import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DeleteOpportunity extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce Opportunity';
  protected stepExpression: string = 'delete the salesforce opportunity with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'the name of the field used to identify the opportunity',
  }, {
    field: 'identifier',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'the value of the field',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'opportunity',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Opportunity's SalesForce ID",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();

    try {
      const result = await this.client.deleteOpportunityByIdentifier(stepData.field, stepData.identifier);
      const record = this.keyValue('opportunity', 'Deleted Opportunity', { Id: result.id });
      return this.pass('Successfully deleted Opportunity with %s %s', [stepData.field, stepData.identifier], [record]);
    } catch (e) {
      return this.error('There was a problem deleting the Opportunity: %s', [e.toString()]);
    }
  }

}

export { DeleteOpportunity as Step };
