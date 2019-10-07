import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class CreateAccount extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Account';
  protected stepExpression: string = 'create a salesforce account';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'account',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const account: any = stepData.account;

    try {
      const result = await this.client.createAccount(account);
      return this.pass('Successfully created Account with ID %s', [result.id]);
    } catch (e) {
      return this.error('There was a problem creating the Account: %s', [e.toString()]);
    }
  }

}

export { CreateAccount as Step };
