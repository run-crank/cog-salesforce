/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition } from '../../proto/cog_pb';

export class CampaignMemberCampaignIdEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check Salesforce Campaign Membership';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the salesforce lead (?<email>.+) should be a member of campaign (?<campaignId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }, {
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: 'Campaign ID',
  }];
  protected expectedRecords: ExpectedRecord[] = [{
    id: 'campaignMember',
    type: RecordDefinition.Type.KEYVALUE,
    fields: [{
      field: 'Id',
      type: FieldDefinition.Type.STRING,
      description: "Campaign Member's SalesForce ID",
    }, {
      field: 'CreatedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Campaign Member's Created Date",
    }, {
      field: 'LastModifiedDate',
      type: FieldDefinition.Type.DATETIME,
      description: "Campaign Member's Last Modified Date",
    }, {
      field: 'CampaignId',
      type: FieldDefinition.Type.STRING,
      description: "Campaign Member's Campaign Id",
    }, {
      field: 'LeadId',
      type: FieldDefinition.Type.STRING,
      description: "Campaign Member's Lead Id",
    }, {
      field: 'ContactId',
      type: FieldDefinition.Type.STRING,
      description: "Campaign Member's Contact Id",
    }, {
      field: 'LeadOrContactId',
      type: FieldDefinition.Type.STRING,
      description: "Campaign Member's Lead or Contact Id",
    }],
    dynamicFields: true,
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const campaignId: string = stepData.campaignId;
    let campaignMember: Record<string, any>;

    try {
      campaignMember = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId);
    } catch (e) {
      return this.error('There was a problem checking the Campaign Member: %s', [e.toString()]);
    }

    const campaign = await this.client.findCampaignById(campaignId, ['Name']);
    const textToDisplay = campaign ? `${campaign.Name} (${campaignId})` : campaignId;

    if (!campaignMember) {
      // If no results were found, return a failure.
      return this.fail('No Campaign Membership found between %s and campaign %s', [email, textToDisplay]);
    } else {
      // If the value of the field matches expectations, pass.
      const record = this.createRecord(campaignMember);
      return this.pass('Lead belongs to Campaign %s, as expected', [textToDisplay], [record]);
    }
  }

  createRecord(campaignMember: Record<string, any>) {
    delete campaignMember.attributes;
    return this.keyValue('campaignMember', 'Checked Campaign Member', campaignMember);
  }

}

export { CampaignMemberCampaignIdEquals as Step };
