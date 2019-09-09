/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class LeadCampaignIdEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check Lead Campaign Membership';
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
    description: "Lead's CampaignId",
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const field: string = 'CampaignId';
    const expectedValue: string = stepData.campaignId;
    let lead: Record<string, any>;

    try {
      lead = await this.client.findCampaignMemberByEmail(email, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Lead: %s', [e.toString()]);
    }

    if (!lead) {
      // If no results were found, return an error.
      return this.error('No Lead found with email %s', [email]);
    } else if (lead[field] === expectedValue) {
      // If the value of the field matches expectations, pass.
      return this.pass('Lead belongs to Campaign with id %s, as expected', [field, expectedValue]);
    } else {
      // If the value of the field does not match expectations, fail.
      return this.fail('Lead does not belong to Campaign with id %s', [expectedValue]);
    }
  }

}

export { LeadCampaignIdEquals as Step };
