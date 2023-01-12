/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { baseOperators } from '../../client/constants/operators';

export class CampaignMemberCountStep extends BaseStep implements StepInterface {

  protected stepName: string = 'Count a Salesforce campaign';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'check the number of members from salesforce campaign (?<campaignId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Campaign Member Count';
  protected expectedFields: Field[] = [{
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: 'Campaign ID',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'campaign',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'campaignId',
      type: FieldDefinition.Type.STRING,
      description: "Campaign's SalesForce ID",
    }, {
      field: 'campaignName',
      type: FieldDefinition.Type.STRING,
      description: "Campaign's Name",
    }, {
      field: 'campaignMemberCount',
      type: FieldDefinition.Type.STRING,
      description: "Campaign's Member Count",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const campaignId: string = stepData.campaignId;

    try {
      const data = await this.client.findCampaignById(campaignId, ['Name', 'NumberOfLeads', 'NumberOfContacts']);

      if ((data === null || data === undefined) || (data && data.length === 0)) {
        return this.error('Campaign with Id %s does not exist', [
          campaignId,
        ]);
      }

      const totalMembers = +data.NumberOfLeads + +data.NumberOfContacts;

      const record = this.createRecord(campaignId, data.Name, totalMembers);
      const orderRecord = this.createOrderedRecord(campaignId, data.Name, totalMembers, stepData['__stepOrder']);

      return this.pass('Program %s has %s members', [campaignId, totalMembers], [record, orderRecord]);
    } catch (e) {
      return this.error('There was a problem checking the Campaign Member Count: %s', [e.message]);
    }
  }

  createRecord(id: string, name: string, count: number) {
    const record = {
      campaignId: id,
      campaignName: name,
      campaignMemberCount: count,
    };
    return this.keyValue('campaign', 'Checked Campaign Member Count', record);
  }

  createOrderedRecord(id: string, name: string, count: number, stepOrder = 1) {
    const record = {
      campaignId: id,
      campaignName: name,
      campaignMemberCount: count,
    };
    return this.keyValue(`campaign.${stepOrder}`, `Checked Campaign Member Count from Step ${stepOrder}`, record);
  }
}

export { CampaignMemberCountStep as Step };
