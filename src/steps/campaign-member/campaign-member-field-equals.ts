/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';

export class CampaignMemberFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce Campaign Member';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the salesforce lead (?<email>.+) should have campaign member (?<field>[a-z0-9_]+) (?<operator>set to|not set to|containing|not containing|less than|greater than) (?<expectedValue>.+) on campaign (?<campaignId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected expectedFields: Field[] = [{
    field: 'email',
    type: FieldDefinition.Type.EMAIL,
    description: "Lead's email address",
  }, {
    field: 'campaignId',
    type: FieldDefinition.Type.STRING,
    description: 'Campaign ID',
  }, {
    field: 'field',
    type: FieldDefinition.Type.STRING,
    description: 'Field name to check',
  }, {
    field: 'operator',
    type: FieldDefinition.Type.STRING,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Check Logic (set to, not set to, containing, not containing, greater than, or less than)',
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
    let operator: string = stepData.operator || 'set to';
    const expectedValue: string = stepData.expectedValue;
    let campaignMember: Record<string, any>;

    const normalizedOperators = {
      setto: 'be',
      notsetto: 'not be',
      containing: 'contain',
      notcontaining: 'not contain',
      lessthan: 'be less than',
      greaterthan: 'be greater than',
    };

    operator = normalizedOperators[operator.replace(/\s/g, '').toLowerCase()];

    try {
      campaignMember = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Campaign Member: %s', [e.toString()]);
    }

    try {
      if (!campaignMember) {
        // If no results were found, return a failure.
        return this.fail('No Campaign Membership found between %s and campaign %s', [email, campaignId]);
      } else if (!campaignMember.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.error('The %s field does not exist on Campaign Member with email %s and campaign id %s', [field, email, campaignId]);
      } else if (this.compare(operator, campaignMember[field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(this.operatorSuccessMessages[operator.replace(/\s/g, '').toLowerCase()], [field, expectedValue]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(this.operatorFailMessages[operator.replace(/\s/g, '').toLowerCase()], [
          field,
          expectedValue,
          campaignMember[field],
        ]);
      }
    } catch (e) {
      return this.error('There was an error during validation of campaign member field: %s', [e.message]);
    }
  }

}

export { CampaignMemberFieldEquals as Step };
