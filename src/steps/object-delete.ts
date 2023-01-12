import { BaseStep, Field, StepInterface, ExpectedRecord } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../proto/cog_pb';

export class DeleteObject extends BaseStep implements StepInterface {

  protected stepName: string = 'Delete a Salesforce object';
  protected stepExpression: string = 'delete the salesforce (?<objName>[a-zA-Z0-9]+) object with id (?<id>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['delete'];
  protected targetObject: string = 'Object';
  protected expectedFields: Field[] = [{
    field: 'objName',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce Object name',
  }, {
    field: 'id',
    type: FieldDefinition.Type.STRING,
    description: 'Object ID',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'salesforceObject',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Object's SalesForce ID",
    }],
    dynamicFields: false,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const objName: any = stepData.objName;
    const id: any = stepData.id;

    try {
      const result = await this.client.deleteObjectById(objName, id);
      const record = this.keyValue('salesforceObject', 'Deleted Object', { Id: result.id });
      return this.pass('Successfully deleted %s Object %s', [objName, result.id], [record]);
    } catch (e) {
      return this.error('There was a problem deleting the %s Object: %s', [objName, e.toString()]);
    }
  }

}

export { DeleteObject as Step };
