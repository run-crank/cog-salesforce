import { BaseStep, Field, StepInterface, ExpectedRecord } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../proto/cog_pb';

export class UpdateObject extends BaseStep implements StepInterface {

  protected stepName: string = 'Update a Salesforce object';
  protected stepExpression: string = 'update the salesforce (?<objName>[a-zA-Z0-9]+) object identified by id (?<identifier>[^\s]+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['update'];
  protected targetObject: string = 'Object';
  protected expectedFields: Field[] = [{
    field: 'objName',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce object name',
  }, {
    field: 'identifier',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce object ID',
  }, {
    field: 'salesforceObject',
    type: FieldDefinition.Type.MAP,
    description: 'where keys represent object field names as represented in the SFDC API',
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
    const id: any = stepData.identifier;
    const salesforceObject: any = stepData.salesforceObject;

    try {
      salesforceObject['Id'] = id;
      const result = await this.client.updateObject(objName, salesforceObject);
      const record = this.createRecord(result);
      const orderedRecord = this.createOrderedRecord(result, stepData['__stepOrder']);

      return this.pass('Successfully updated %s Object with ID %s', [objName, result.id], [record, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem updating the %s Object: %s', [objName, e.toString()]);
    }
  }

  public createRecord(salesforceObject): StepRecord {
    return this.keyValue('salesforceObject', 'Updated Object', { Id: salesforceObject.id });
  }

  public createOrderedRecord(salesforceObject, stepOrder = 1): StepRecord {
    return this.keyValue(`salesforceObject.${stepOrder}`, `Updated Object from Step ${stepOrder}`, { Id: salesforceObject.id });
  }

}

export { UpdateObject as Step };
