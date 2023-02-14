import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';

export class CreateOpportunity extends BaseStep implements StepInterface {

  protected stepName: string = 'Create a Salesforce opportunity';
  protected stepExpression: string = 'create a salesforce opportunity';
  protected stepType: StepDefinition.Type = StepDefinition.Type.ACTION;
  protected actionList: string[] = ['create'];
  protected targetObject: string = 'Opportunity';
  protected expectedFields: Field[] = [{
    field: 'opportunity',
    type: FieldDefinition.Type.MAP,
    description: 'A map of field names to field values',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'opportunity',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Opportunity's SalesForce ID",
    }, {
      field: 'Name',
      type: FieldDefinition.Type.STRING,
      description: "Opportunity's Name",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const opportunity: any = stepData.opportunity;

    try {
      const result = await this.client.createOpportunity(opportunity);
      let data: any = result;
      if (result.success) {
        data = await this.client.findOpportunityByIdentifier('Id', result.id, []);
      }
      const record = this.createRecord(data);
      const passingRecord = this.createPassingRecord(data, Object.keys(opportunity));
      const orderedRecord = this.createOrderedRecord(data, stepData['__stepOrder']);
      return this.pass('Successfully created Opportunity with ID %s', [result.id], [record, passingRecord, orderedRecord]);
    } catch (e) {
      return this.error('There was a problem creating the Opportunity: %s', [e.toString()]);
    }
  }

  public createRecord(opportunity): StepRecord {
    return this.keyValue('opportunity', 'Created Opportunity', opportunity[0]);
  }

  public createPassingRecord(data, fields): StepRecord {
    const filteredData = {};
    if (data) {
      Object.keys(data).forEach((key) => {
        if (fields.includes(key)) {
          filteredData[key] = data[key];
        }
      });
    }
    return this.keyValue('exposeOnPass:opportunity', 'Created Opportunity', filteredData);
  }

  public createOrderedRecord(opportunity, stepOrder = 1): StepRecord {
    return this.keyValue(`opportunity.${stepOrder}`, `Created Opportunity from Step ${stepOrder}`, opportunity[0]);
  }

}

export { CreateOpportunity as Step };
