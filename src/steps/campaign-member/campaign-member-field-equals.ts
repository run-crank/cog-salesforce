import { campaignMemberOperators } from './../../client/constants/operators';
/*tslint:disable:no-else-after-return*/

import { BaseStep, Field, StepInterface, ExpectedRecord } from '../../core/base-step';
import { Step, RunStepResponse, FieldDefinition, StepDefinition, RecordDefinition, StepRecord } from '../../proto/cog_pb';
import * as util from '@run-crank/utilities';
import { isNullOrUndefined } from 'util';

export class CampaignMemberFieldEquals extends BaseStep implements StepInterface {

  protected stepName: string = 'Check a field on a Salesforce campaign member';
  /* tslint:disable-next-line:max-line-length */
  protected stepExpression: string = 'the salesforce lead (?<email>.+) should have campaign member (?<field>[a-z0-9_]+) (?<operator>set to one of|set to|set|not set to one of|not set to|not set|containing|not containing|less than|greater than) ?(?<expectedValue>.+)? on campaign (?<campaignId>.+)';
  protected stepType: StepDefinition.Type = StepDefinition.Type.VALIDATION;
  protected actionList: string[] = ['check'];
  protected targetObject: string = 'Campaign Member';
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
    description: 'Check Logic (set to, not set to, containing, not containing, greater than, less than, set, not set, set to one of, or not set to one of)',
  }, {
    field: 'expectedValue',
    type: FieldDefinition.Type.ANYSCALAR,
    optionality: FieldDefinition.Optionality.OPTIONAL,
    description: 'Expected field value',
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
    const field: string = stepData.field;
    let operator: string = stepData.operator || 'set to';
    const expectedValue: string = stepData.expectedValue;
    let campaignMember: Record<string, any>;

    const normalizedOperators = {
      'set': 'be set',
      'not set': 'not be set',
      'set to': 'be',
      'not set to': 'not be',
      'containing': 'contain',
      'not containing': 'not contain',
      'less than': 'be less than',
      'greater than': 'be greater than',
      'set to one of': 'be one of',
      'not set to one of': 'not be one of',
    };

    operator = normalizedOperators[operator] || stepData.operator;

    if (isNullOrUndefined(expectedValue) && !(operator == 'be set' || operator == 'not be set')) {
      return this.error("The operator '%s' requires an expected value. Please provide one.", [operator]);
    }

    try {
      campaignMember = await this.client.findCampaignMemberByEmailAndCampaignId(email, campaignId, [field]);
    } catch (e) {
      return this.error('There was a problem checking the Campaign Member: %s', [e.toString()]);
    }

    try {
      const campaign = await this.client.findCampaignById(campaignId, [field, 'Name']);
      const textToDisplay = campaign ? `${campaign.Name} (${campaignId})` : campaignId;

      if (!campaignMember) {
        // If no results were found, return a failure.
        return this.fail('No Campaign Membership found between %s and campaign %s', [email, textToDisplay]);
      }

      const record = this.createRecord(campaignMember);
      const orderedRecord = this.createOrderedRecord(campaignMember, stepData['__stepOrder']);

      if (!campaignMember.hasOwnProperty(field)) {
        // If the given field does not exist on the user, return an error.
        return this.fail('The %s field does not exist on Campaign Member with email %s and campaign %s', [field, email, textToDisplay], [record, orderedRecord]);
      }

      const result = this.assert(operator, campaignMember[field], expectedValue, field, stepData['__piiSuppressionLevel']);

      // If the value of the field matches expectations, pass.
      // If the value of the field does not match expectations, fail.
      return result.valid ? this.pass(result.message, [], [record, orderedRecord])
        : this.fail(result.message, [], [record, orderedRecord]);

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

  public createRecord(campaignMember: Record<string, any>): StepRecord {
    delete campaignMember.attributes;
    return this.keyValue('campaignMember', 'Checked Campaign Member', campaignMember);
  }

  public createOrderedRecord(campaignMember: Record<string, any>, stepOrder = 1): StepRecord {
    delete campaignMember.attributes;
    return this.keyValue(`campaignMember.${stepOrder}`, `Checked Campaign Member from Step ${stepOrder}`, campaignMember);
  }
}

export { CampaignMemberFieldEquals as Step };
