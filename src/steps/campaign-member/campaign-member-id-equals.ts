/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

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

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = 'CampaignId';
    const campaignId: string = stepData.campaignId;
    let campaignMember: Record<string, any>;

    try {
      campaignMember = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Campaign Member: %s', [e.toString()]);
    }

    if (!campaignMember) {
      // If no results were found, return a failure.
      return this.fail('No Campaign Membership found between %s and campaign %s', [email, campaignId]);
    } else {
      // If the value of the field matches expectations, pass.
      const record = this.keyValue('campaignMember', 'Checked Campaign Member', campaignMember);
      return this.pass('Lead belongs to Campaign with id %s, as expected', [campaignId], [record]);
    }
  }

}

export { CampaignMemberCampaignIdEquals as Step };
