import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class DeleteAccount extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce account';
  protected stepExpression: string = 'delete the salesforce account with (?<field>[a-zA-Z0-9_]+) (?<identifier>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Account';
  protected expectedFields: Field[] = [{
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'the name of the field used to identify the account',
  }, {
    field: 'identifier',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'the value of the field',
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

    try {
      const result = await this.client.deleteAccountByIdentifier(stepData.field, stepData.identifier);
      const record = this.keyValue('account', 'Deleted Account', { Id: result.id });
      return this.pass('Successfully deleted Account with %s %s', [stepData.field, stepData.identifier], [record]);
    } catch (e) {
      return this.error('There was a problem deleting the Account: %s', [e.toString()]);
    }
  }

}

export { DeleteAccount as Step };
