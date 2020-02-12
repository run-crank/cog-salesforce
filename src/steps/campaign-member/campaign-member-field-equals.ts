import { campaignMemberOperators } from './../../client/constants/operators';
/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';

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
      'set to': 'be',
      'not set to': 'not be',
      'containing': 'contain',
      'not containing': 'not contain',
      'less than': 'be less than',
      'greater than': 'be greater than',
    };

    operator = normalizedOperators[operator] || stepData.operator;

    try {
      campaignMember = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Campaign Member: %s', [e.toString()]);
    }

    try {
      if (!campaignMember) {
        // If no results were found, return a failure.
        return this.fail('No Campaign Membership found between %s and campaign %s', [email, campaignId]);
      }

      const record = this.keyValue('campaignMember', 'Checked Campaign Member', campaignMember);

      if (!campaignMember.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.error('The %s field does not exist on Campaign Member with email %s and campaign id %s', [field, email, campaignId], [record]);
      }

      if (this.compare(operator, campaignMember[field], expectedValue)) {
        // If the value of the field matches expectations, pass.
        return this.pass(this.operatorSuccessMessages[operator], [field, expectedValue], [record]);
      } else {
        // If the value of the field does not match expectations, fail.
        return this.fail(this.operatorFailMessages[operator], [field, expectedValue, campaignMember[field]], [record]);
      }
    } catch (e) {
      if (e instanceof util.UnknownOperatorError) {
        return this.error('%s Please provide one of: %s', [e.message, campaignMemberOperators.join(', ')]);
      }
      if (e instanceof util.InvalidOperandError) {
        return this.error(e.message);
      }
      return this.error('There was an error during validation of campaign member field: %s', [e.message]);
    }
  }

}

export { CampaignMemberFieldEquals as Step };
