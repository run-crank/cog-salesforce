/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class CampaignMemberCampaignIdEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check CampaignMember Campaign Membership';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the salesforce campaignmember (?<email>.+) should be a member of campaign (?<campaignId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "CampaignMember's email address",
  }, {
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: "CampaignMember's CampaignId",
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = 'CampaignId';
    const campaignId: string = stepData.campaignId;
    let campaignMember: Record<string, any>;

    try {
      // tslint:disable-next-line:max-line-length
      campaignMember = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, [field]);
    } catch (e) {
      return this.error('There was a problem checking the CampaignMember: %s', [e.toString()]);
    }

    if (!campaignMember) {
      // If no results were found, return an error.
      // tslint:disable-next-line:max-line-length
      return this.fail('No CampaignMember found with email %s and campaignId %s', [email, campaignId]);
    // tslint:disable-next-line:triple-equals
    } else {
      // If the value of the field matches expectations, pass.
      // tslint:disable-next-line:max-line-length
      return this.pass('CampaignMember belongs to Campaign with id %s, as expected', [field, campaignId]);
    }
  }

}

export { CampaignMemberCampaignIdEquals as Step };
