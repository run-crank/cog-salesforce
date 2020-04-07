import { BaseStep, Field, StepInterface, ExpectedRecord } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../proto/cog_pb';

export class CreateObject extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce Object';
  protected stepExpression: string = 'create a salesforce (?<objName>[a-zA-Z0-9]+) object';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'objName',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce object name',
  }, {
    field: 'salesforceObject',
    type: FieldDefinition.Type.MAP,
    description: 'where keys represent object field names as represented in the SFDC API',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'salesforceObject ',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Object's SalesForce ID",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const objName: any = stepData.objName;
    const salesforceObject: any = stepData.salesforceObject;
    console.log(stepData);
    try {
      const result = await this.client.createObject(objName, salesforceObject);
      const record = this.keyValue('salesforceObject', 'Created Object', { Id: result.id });
      return this.pass('Successfully created %s Object with ID %s', [objName, result.id], [record]);
    } catch (e) {
      return this.error('There was a problem creating the %s Object: %s', [objName, e.toString()]);
    }
  }

}

export { CreateObject as Step };
