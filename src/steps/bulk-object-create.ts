import { BaseStep, Field, StepInterface, ExpectedRecord } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../proto/cog_pb';

export class BulkCreateObject extends BaseStep implements StepInterface {

  protected stepName: string = 'Bulk create Salesforce Objects';
  protected stepExpression: string = 'bulk create salesforce (?<objName>[a-zA-Z0-9]+) objects';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected expectedFields: Field[] = [{
    field: 'objName',
    type: FieldDefinition.Type.STRING,
    description: 'Salesforce object name',
  }, {
    field: 'salesforceObjects',
    type: FieldDefinition.Type.MAP,
    description: 'A map of index to object',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'createdObjects',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'id',
      type: FieldDefinition.Type.NUMERIC,
      description: 'ID of Salesforce Object',
    }],
    dynamicFields: true,
  }, {
    id: 'failedObjects',
    type: RecordDefinition.Type.TABLE,
    fields: [{
      field: 'message',
      type: FieldDefinition.Type.STRING,
      description: 'Message for explanation of fail',
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const objName: any = stepData.objName;
    const salesforceObjects: any = stepData.salesforceObjects;
    const objArray = [];
    const records = [];

    Object.values(salesforceObjects).forEach((obj) => {
      objArray.push(obj);
    });

    try {
      const successArray = [];
      const failArray = [];
      const data = await this.client.bulkCreateObjects(objName, objArray);

      // we should parse out the original CSV array if provided, or handle it if missing
      const csvArray = stepData.csvArray ? JSON.parse(stepData.csvArray) : [];
      const csvColumns = csvArray[0];
      const csvRows = csvArray.slice(1);
      const failArrayOriginal = csvColumns ? [csvColumns] : [];

      if (data.length === 0) {
        return this.fail('No objects were created in Salesforce', [], []);
      }

      data.forEach((obj, index) => {
        if (obj.success) {
          successArray.push({ ...objArray[index], id: obj.id });
        } else {
          failArray.push({ ...objArray[index], message: obj.errors.join(', ') });

          // also preserve the original csv entry;
          const match = csvRows[index];
          if (match) {
            failArrayOriginal.push(match);
          }
        }
      });

      const returnedObjCount = successArray.length + failArray.length;

      if (objArray.length !== returnedObjCount) {
        records.push(this.createTable('createdObjects', 'Objects Created', successArray));
        records.push(this.createTable('failedObjects', 'Objects Failed', failArray));
        records.push(this.keyValue('failedOriginal', 'Objects Failed (Original format)', { 'array': JSON.stringify(failArrayOriginal) }));
        return this.fail(
          'Only %d of %d %s Objects were successfully created in Salesforce',
          [returnedObjCount, objArray.length, objName],
          records,
        );
      } else if (!failArray.length) {
        records.push(this.createTable('createdObjects', 'Objects Created', successArray));
        return this.pass(
          'Successfully created %d %s Objects in Salesforce',
          [successArray.length, objName],
          records,
        );
      } else {
        records.push(this.createTable('createdObjects', 'Objects Created', successArray));
        records.push(this.createTable('failedObjects', 'Objects Failed', failArray));
        records.push(this.keyValue('failedOriginal', 'Objects Failed (Original format)', { 'array': JSON.stringify(failArrayOriginal) }));
        return this.fail(
          'Failed to create %d %s Objects in Salesforce',
          [failArray.length, objName],
          records,
        );
      }
    } catch (e) {
      return this.error('There was a problem creating the %s Object: %s', [objName, e.toString()]);
    }
  }

  private createTable(id, name, leads) {
    const headers = {};
    const headerKeys = Object.keys(leads[0] || {});
    headerKeys.forEach((key: string) => {
      headers[key] = key;
    });
    return this.table(id, name, headers, leads);
  }
}

export { BulkCreateObject as Step };
