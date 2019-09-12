/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../proto/cog_pb';

export class CampaignMemberFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a CampaignMember Field Value';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the salesforce lead (?<email>.+) should have campaign member (?<field>.+) set to (?<expectedValue>.+) on campaign (?<campaignId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "CampaignMember's email address",
  }, {
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: 'CampaignId',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    description: 'Expected field value',
  }];

  async executeStep(step: Step): Promise<RunStepResponse> {
    const stepData: any = step.getData().toJavaScript();
    const email: string = stepData.email;
    const campaignId: string = stepData.campaignId;
    const field: string = stepData.field;
    const expectedValue: string = stepData.expectedValue;
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
      return this.error('No CampaignMember found with email %s and campaignId %s', [email, campaignId]);
    } else if (!campaignMember.hasOwnProperty(field)) {
      // If the given field does not exist on the user, return an error.
      // tslint:disable-next-line:max-line-length
      return this.error('The %s field does not exist on CampaignMember with email %s', [field, email]);
    // tslint:disable-next-line:triple-equals
    } else if (campaignMember[field] == expectedValue) {
      // If the value of the field matches expectations, pass.
      return this.pass('The %s field was set to %s, as expected', [field, campaignMember[field]]);
    } else {
      // If the value of the field does not match expectations, fail.
      return this.fail('Expected %s field to be %s, but it was actually %s', [
        field,
        expectedValue,
        campaignMember[field],
      ]);
    }
  }

}

export { CampaignMemberFieldEquals as Step };
