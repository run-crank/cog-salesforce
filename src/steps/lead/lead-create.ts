import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class CreateLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Lead';
  protected stepExpression: string = 'create a salesforce lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'lead',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
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
