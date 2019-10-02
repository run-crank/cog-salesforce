import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class DeleteOpportunity extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce Opportunity';
  // tslint:disable-next-line:max-line-length
  protected stepExpression: string = 'delete the salesforce account with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)';
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

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();

    try {
      // tslint:disable-next-line:max-line-length
      const result = await this.client.deleteOpportunityByIdentifier(stepData.field, stepData.identifier);
      // tslint:disable-next-line:max-line-length
      return this.pass('Successfully deleted Opportunity with %s %s', [stepData.field, stepData.identifier]);
    } catch (e) {
      return this.error('There was a problem deleting the Opportunity: %s', [e.toString()]);
    }
  }

}

export { DeleteOpportunity as Step };
