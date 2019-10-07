import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class DeleteLead extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce Lead';
  protected stepExpression: string = 'delete the (?<email>.+) salesforce lead';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: any = stepData.email;

    try {
      const result = await this.client.deleteLeadByEmail(email);
      return this.pass('Successfully deleted Lead %s (%s)', [email, result.id]);
    } catch (e) {
      return this.error('There was a problem deleting the Lead: %s', [e.toString()]);
    }
  }

}

export { DeleteLead as Step };
