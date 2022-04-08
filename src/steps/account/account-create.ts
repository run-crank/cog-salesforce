import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateAccount extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Account';
  protected stepExpression: string = 'create a salesforce account';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'account',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'account',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Account's SalesForce ID",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const account: any = stepData.account;

    try {
      const result = await this.client.createAccount(account);
      const record = this.createRecord(result);
      const orderedRecord = this.createOrderedRecord(result, stepData['__stepOrder']);
      return this.pass('Successfully created Account with ID %s', [result.id], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Account: %s', [e.toString()]);
    }
  }

  public createRecord(account): StepRecord {
    return this.keyValue('account', 'Created Account', { Id: account.id });
  }

  public createOrderedRecord(account, stepOrder = 1): StepRecord {
    return this.keyValue(`account.${stepOrder}`, `Created Account from Step ${stepOrder}`, { Id: account.id });
  }

}

export { CreateAccount as Step };
