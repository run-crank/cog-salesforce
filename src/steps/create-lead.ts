import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Lead';
  protected stepExpression: string = 'create a Salesforce Lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'An object representing a valid Lead object',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const lead: any = stepData.lead;

    try {
      const result = await this.client.createLead(lead);
      return this.pass('Successfully created Lead with ID %s', [result.id]);
    } catch (e) {
      return this.error('There was a problem creating the Lead: %s', [e.toString()]);
    }
  }

}

export { CreateLead as Step };
