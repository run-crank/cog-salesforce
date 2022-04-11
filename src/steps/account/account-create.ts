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
    }, {
      field: 'Name',
      type: FieldDefinition.Type.STRING,
      description: "Account's Name",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const account: any = stepData.account;

    try {
      const result = await this.client.createAccount(account);
      let data: any = result;
      if (result.success) {
        data = await this.client.findAccountByIdentifier('Name', account.Name, []);
      }
      const record = this.createRecord(data);
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);
      return this.pass('Successfully created Account with ID %s', [result.id], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Account: %s', [e.toString()]);
    }
  }

  public createRecord(account): StepRecord {
    return this.keyValue('account', 'Created Account', account);
  }

  public createOrderedRecord(account, stepOrder = 1): StepRecord {
    return this.keyValue(`account.${stepOrder}`, `Created Account from Step ${stepOrder}`, account);
  }

}

export { CreateAccount as Step };
